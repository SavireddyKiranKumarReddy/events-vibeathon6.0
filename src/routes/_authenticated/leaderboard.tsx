import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getLeaderboards } from "@/lib/api.functions";
import { GlassCard } from "@/components/AppShell";
import { formatIST } from "@/lib/format";

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
  const teamMap = new Map<string, string>(d.teams.map((t: any) => [t.id, t.name]));
  const events = d.events.filter((e: any) => e.track === track).sort((a: any, b: any) => a.slot - b.slot);
  const overall = new Map<string, number>();
  const trackEventIds = new Set(events.map((e: any) => e.id));
  for (const s of d.submissions) {
    if (!trackEventIds.has(s.event_id)) continue;
    const correct = s.admin_override !== null && s.admin_override !== undefined ? s.admin_override : s.auto_correct;
    if (!correct) continue;
    overall.set(s.team_id, (overall.get(s.team_id) ?? 0) + 1);
  }
  const overallSorted = [...overall.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, wins], i) => ({ rank: i + 1, team: teamMap.get(id) ?? "—", wins }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Leaderboard</h1>
        <p className="mt-1 text-sm text-white/60">
          {d.isAdmin
            ? "Admin view — you see all leaderboards regardless of visibility toggles."
            : "Only leaderboards the admin has made visible are shown."}
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
      <GlassCard>
        <h2 className="text-lg font-semibold text-white">
          Overall — {track === "tech" ? "Tech" : "Non-Tech"}
        </h2>
        <div className="mt-4 divide-y divide-white/10">
          {overallSorted.length === 0 && <div className="py-3 text-sm text-white/50">No results yet.</div>}
          {overallSorted.map((r) => (
            <div key={r.team} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-3">
                <span className={`w-6 text-right font-mono ${r.rank === 1 ? "text-primary" : "text-white/50"}`}>
                  #{r.rank}
                </span>
                <span className="text-white">{r.team}</span>
              </div>
              <span className="text-white/70">{r.wins} correct</span>
            </div>
          ))}
        </div>
      </GlassCard>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {events.map((e: any) => {
          const visible = d.isAdmin || e.leaderboard_visible;
          const subs = d.submissions
            .filter((s: any) => s.event_id === e.id)
            .filter((s: any) => {
              const c = s.admin_override !== null && s.admin_override !== undefined ? s.admin_override : s.auto_correct;
              return c;
            })
            .sort((a: any, b: any) => +new Date(a.submitted_at) - +new Date(b.submitted_at));
          return (
            <GlassCard key={e.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/50">Event {e.slot}</div>
                  <div className="font-semibold text-white">{e.title}</div>
                </div>
                <div className="text-xs text-white/50">Started {formatIST(e.start_at)}</div>
              </div>
              {!visible ? (
                <div className="mt-4 text-sm text-white/40">Hidden by admin.</div>
              ) : subs.length === 0 ? (
                <div className="mt-4 text-sm text-white/50">No correct submissions.</div>
              ) : (
                <div className="mt-3 divide-y divide-white/10">
                  {subs.map((s: any, i: number) => (
                    <div key={s.event_id + s.team_id} className="flex items-center justify-between py-2 text-sm">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 text-right font-mono ${i === 0 ? "text-primary" : "text-white/50"}`}>
                          #{i + 1}
                        </span>
                        <span className="text-white">{teamMap.get(s.team_id) ?? "—"}</span>
                      </div>
                      <span className="font-mono text-xs text-white/60">
                        {new Date(s.submitted_at).toLocaleTimeString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          hour12: false,
                        })}
                      </span>
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