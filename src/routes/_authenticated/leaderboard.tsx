import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getLeaderboards } from "@/lib/api.functions";
import { GlassCard } from "@/components/AppShell";
import { formatIST } from "@/lib/format";
import { Trophy, CheckCircle2 } from "lucide-react";

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

  const overall = new Map<string, { correct: number; totalScore: number; count: number }>();
  const trackEventIds = new Set(events.map((e: any) => e.id));
  for (const s of d.submissions) {
    if (!trackEventIds.has(s.event_id)) continue;
    const correct = s.admin_override !== null && s.admin_override !== undefined ? s.admin_override : s.auto_correct;
    const entry = overall.get(s.team_id) ?? { correct: 0, totalScore: 0, count: 0 };
    if (correct) {
      entry.correct += 1;
      entry.totalScore += s.score ?? 0;
      entry.count += 1;
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
        <p className="mt-1 text-sm text-white/60">
          {d.isAdmin
            ? "Admin view — you see all leaderboards regardless of visibility toggles."
            : "Live leaderboard for all participants."}
        </p>
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

      {/* Overall Ranking */}
      <GlassCard>
        <h2 className="text-lg font-semibold text-white">
          Overall — {isNonTech ? "Non-Tech" : "Tech"}
        </h2>
        <div className="mt-1 text-xs text-white/40">
          {isNonTech
            ? "Ranked by total points across all events"
            : "Ranked by number of correct answers"}
        </div>
        <div className="mt-4 divide-y divide-white/10">
          {overallSorted.length === 0 && <div className="py-3 text-sm text-white/50">No results yet.</div>}
          {overallSorted.map((r) => (
            <div key={r.rank + r.team.name} className="flex items-center justify-between py-2.5 text-sm">
              <div className="flex items-center gap-3">
                <span className={`w-8 text-right font-mono text-lg ${r.rank <= 3 ? "text-primary font-bold" : "text-white/50"}`}>
                  {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                </span>
                <span className="font-semibold text-white">{r.team.name}</span>
                {r.team.lead_name && <span className="text-xs text-white/40">· {r.team.lead_name}</span>}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-green-500/20 px-2 py-1 text-green-400">
                  <CheckCircle2 className="h-3 w-3" /> {r.correct}
                </span>
                {isNonTech && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-yellow-500/20 px-2 py-1 text-yellow-400 font-semibold">
                    🏆 {r.totalScore} pts
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Per-Event Rankings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {events.map((e: any) => {
          const visible = true;
          const subs = d.submissions
            .filter((s: any) => s.event_id === e.id)
            .filter((s: any) => {
              const c = s.admin_override !== null && s.admin_override !== undefined ? s.admin_override : s.auto_correct;
              return c;
            })
            .sort((a: any, b: any) => {
              if (isNonTech) {
                const aScore = a.score ?? 0;
                const bScore = b.score ?? 0;
                return bScore - aScore; // Higher score first
              }
              return +new Date(a.submitted_at) - +new Date(b.submitted_at);
            });
          const totalSubs = d.submissions.filter((s: any) => s.event_id === e.id).length;
          const correctSubs = subs.length;
          return (
            <GlassCard key={e.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/50">Event {e.slot}</div>
                  <div className="font-semibold text-white">{e.title}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/50">Started {formatIST(e.start_at)}</div>
                  <div className="text-xs text-white/40">{correctSubs}/{totalSubs} submissions</div>
                </div>
              </div>
              {!visible ? (
                <div className="mt-4 text-sm text-white/40">Hidden by admin.</div>
              ) : subs.length === 0 ? (
                <div className="mt-4 text-sm text-white/50">No submissions yet.</div>
              ) : (
                <div className="mt-3 divide-y divide-white/10">
                  {subs.map((s: any, i: number) => (
                    <div key={s.event_id + s.team_id} className="flex items-center justify-between py-2 text-sm">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 text-right font-mono ${i === 0 ? "text-primary font-bold" : "text-white/50"}`}>
                          #{i + 1}
                        </span>
                        <span className="text-white">{(teamMap.get(s.team_id) ?? { name: "—" }).name}</span>
                        {teamMap.get(s.team_id)?.lead_name && (
                          <span className="text-xs text-white/40">· {teamMap.get(s.team_id)?.lead_name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isNonTech && s.score != null && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-yellow-500/20 px-2 py-0.5 text-[11px] font-semibold text-yellow-400">
                            🏆 {s.score} pts
                          </span>
                        )}
                        <span className="font-mono text-xs text-white/50">
                          {new Date(s.submitted_at).toLocaleTimeString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            hour12: false,
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
