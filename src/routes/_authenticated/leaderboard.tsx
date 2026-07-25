import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getLeaderboards } from "@/lib/api.functions";
import { GlassCard } from "@/components/AppShell";
import { formatIST } from "@/lib/format";
import { Trophy, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Vibeathon" },
      { name: "description", content: "Live Vibeathon leaderboards for tech and non-tech tracks." },
    ],
  }),
  component: LB,
});

function LB() {
  const [track, setTrack] = useState<"tech" | "nontech">("tech");
  const fn = useServerFn(getLeaderboards);
  const { data } = useQuery({ queryKey: ["leaderboards"], queryFn: () => fn(), refetchInterval: 10000 });
  if (!data) return <div className="text-white/60">Loading…</div>;
  const d = data as any;
  const teamMap = new Map<string, { name: string; lead_name: string }>(d.teams.map((t: any) => [t.id, { name: t.name, lead_name: t.lead_name }]));
  const events = d.events.filter((e: any) => e.track === track).sort((a: any, b: any) => a.slot - b.slot);

  const isNonTech = track === "nontech";

  const overall = new Map<string, { correct: number; totalScore: number }>();
  const trackEventIds = new Set(events.map((e: any) => e.id));
  for (const s of d.submissions) {
    if (!trackEventIds.has(s.event_id)) continue;
    const correct = s.admin_override !== null && s.admin_override !== undefined ? s.admin_override : s.auto_correct;
    const entry = overall.get(s.team_id) ?? { correct: 0, totalScore: 0 };
    if (correct) {
      entry.correct += 1;
      entry.totalScore += s.score ?? 0;
    }
    overall.set(s.team_id, entry);
  }

  const overallSorted = [...overall.entries()]
    .filter(([, v]) => v.correct > 0)
    .sort((a, b) => {
      if (isNonTech) {
        if (a[1].totalScore !== b[1].totalScore) return b[1].totalScore - a[1].totalScore;
        return b[1].correct - a[1].correct;
      }
      return b[1].correct - a[1].correct;
    })
    .slice(0, 10)
    .map(([id, stats], i) => ({
      rank: i + 1,
      team: teamMap.get(id) ?? { name: "—", lead_name: "" },
      ...stats,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold text-white">
          <Trophy className="h-7 w-7 text-primary" />
          Leaderboard
        </h1>
      </div>
      <div className="glass inline-flex p-1">
        {(["tech", "nontech"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTrack(t)}
            className={`rounded-md px-4 py-2 text-sm transition ${
              track === t ? "bg-primary font-semibold text-primary-foreground" : "text-white/70 hover:text-white"
            }`}
          >
            {t === "tech" ? "Tech" : "Non-Tech"}
          </button>
        ))}
      </div>

      {/* Overall Top 10 */}
      <GlassCard>
        <h2 className="text-lg font-semibold text-white">
          Top 10 — {isNonTech ? "Non-Tech" : "Tech"}
        </h2>
        <div className="mt-4 divide-y divide-white/10">
          {overallSorted.length === 0 && <div className="py-3 text-sm text-white/50">No results yet.</div>}
          {overallSorted.map((r) => (
            <div key={r.rank + r.team.name} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-4">
                <span className={`w-10 text-center font-mono text-xl ${r.rank <= 3 ? "text-primary font-bold" : "text-white/50"}`}>
                  {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                </span>
                <span className="font-semibold text-white text-base">{r.team.name}</span>
                {r.team.lead_name && <span className="text-sm text-white/40">— {r.team.lead_name}</span>}
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-mono text-sm font-bold text-primary">
                  {r.correct} {isNonTech && r.totalScore > 0 ? `· ${r.totalScore} pts` : isNonTech ? "" : "/ " + events.length}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Per-Event Best Performers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {events.map((e: any) => {
          const subs = d.submissions
            .filter((s: any) => s.event_id === e.id)
            .filter((s: any) => {
              const c = s.admin_override !== null && s.admin_override !== undefined ? s.admin_override : s.auto_correct;
              return c;
            })
            .sort((a: any, b: any) => {
              if (isNonTech) return (b.score ?? 0) - (a.score ?? 0);
              return +new Date(a.submitted_at) - +new Date(b.submitted_at);
            });
          const totalSubs = d.submissions.filter((s: any) => s.event_id === e.id).length;
          return (
            <GlassCard key={e.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/50">Event {e.slot}</div>
                  <div className="font-semibold text-white">{e.title}</div>
                </div>
                <div className="text-right text-xs text-white/40">{totalSubs} submitted</div>
              </div>
              <div className="mt-3 divide-y divide-white/10">
                {subs.length === 0 ? (
                  <div className="py-3 text-sm text-white/50">No submissions yet.</div>
                ) : (
                  subs.slice(0, 3).map((s: any, i: number) => {
                    const team = teamMap.get(s.team_id) ?? { name: "—", lead_name: "" };
                    return (
                      <div key={s.event_id + s.team_id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 text-center font-mono text-lg ${i === 0 ? "text-primary font-bold" : "text-white/50"}`}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                          </span>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold">{team.name}</span>
                              {team.lead_name && <span className="text-sm text-white/40">— {team.lead_name}</span>}
                            </div>
                            {!isNonTech && s.submitted_at && <span className="text-xs text-white/30">{formatIST(s.submitted_at)}</span>}
                          </div>
                        </div>
                        {isNonTech && s.score != null && (
                          <span className="text-xs font-bold text-primary">{s.score} pts</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
