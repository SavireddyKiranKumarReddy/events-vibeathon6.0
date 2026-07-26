import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { day2GetLeaderboard } from "@/lib/api.day2";
import { Trophy, Zap, Lock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/day2/leaderboard")({
  ssr: false,
  head: () => ({
    meta: [
      {
        title: "Day 2 Leaderboard — Vibeathon",
      },
      {
        name: "description",
        content: "Live leaderboard for Vibeathon Day 2 challenges.",
      },
    ],
  }),
  component: Day2Leaderboard,
});

function getEffectiveScore(sub: any): number {
  if (
    sub.admin_override !== null &&
    sub.admin_override !== undefined
  ) {
    return sub.admin_override ? (sub.score ?? 1) : 0;
  }
  return sub.score ?? (sub.auto_correct ? 1 : 0);
}

interface TeamScore {
  teamName: string;
  leadName: string;
  totalScore: number;
  eventScores: Record<string, number | null>;
  firstSub: string;
}

function Day2Leaderboard() {
  const getLeaderboardFn = useServerFn(day2GetLeaderboard);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { data } = useQuery({
    queryKey: ["day2-leaderboard"],
    queryFn: () => getLeaderboardFn(),
    refetchInterval: 10000,
  });

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 text-center">
        <div className="text-white/60">Loading leaderboard...</div>
      </div>
    );
  }

  if (!data.visible) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 text-center">
        <Lock className="mx-auto h-8 w-8 text-white/40" />
        <h1 className="text-3xl font-semibold text-white">
          Leaderboard Hidden
        </h1>
        <p className="text-white/60">
          The admin has hidden the leaderboard. Check back later.
        </p>
      </div>
    );
  }

  const { events, submissions, osintProgress } = data;
  const teamMap = new Map<string, TeamScore>();

  for (const sub of submissions) {
    const key = `${sub.team_name}||${sub.lead_name}`;
    if (!teamMap.has(key)) {
      teamMap.set(key, {
        teamName: sub.team_name,
        leadName: sub.lead_name,
        totalScore: 0,
        eventScores: {},
        firstSub: sub.submitted_at,
      });
    }
    const ts = teamMap.get(key)!;
    const effective = getEffectiveScore(sub);
    ts.eventScores[sub.event_id] = effective;
    ts.totalScore += effective;
    if (sub.submitted_at < ts.firstSub) ts.firstSub = sub.submitted_at;
  }

  for (const prog of osintProgress) {
    const key = `${prog.team_name}||${prog.lead_name}`;
    if (!teamMap.has(key)) {
      teamMap.set(key, {
        teamName: prog.team_name,
        leadName: prog.lead_name,
        totalScore: 0,
        eventScores: {},
        firstSub: "",
      });
    }
    const ts = teamMap.get(key)!;
    ts.totalScore += prog.total_correct;
  }

  const ranked = [...teamMap.values()]
    .filter((t) => t.totalScore > 0)
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.firstSub.localeCompare(b.firstSub);
    });

  const osintEvent = events.find(
    (e: any) => e.track === "tech" && e.slot === 4,
  );
  const regularEvents = events.filter(
    (e: any) => !(e.track === "tech" && e.slot === 4),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-semibold text-white">
          <Trophy className="h-7 w-7 text-primary" />
          Day 2 Leaderboard
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Live rankings for Day 2 challenges.
        </p>
      </div>

      <div className="glass p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Zap className="h-5 w-5 text-primary" />
          Overall Rankings
        </h2>
        <div className="mt-4 divide-y divide-white/10">
          {ranked.length === 0 && (
            <div className="py-4 text-center text-sm text-white/50">
              No results yet.
            </div>
          )}
          {ranked.map((t, i) => (
            <div
              key={`${t.teamName}-${t.leadName}`}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-4">
                <span
                  className={`w-10 text-center font-mono text-xl ${
                    i < 3 ? "text-primary font-bold" : "text-white/50"
                  }`}
                >
                  {i === 0
                    ? "\u{1F947}"
                    : i === 1
                      ? "\u{1F948}"
                      : i === 2
                        ? "\u{1F949}"
                        : `#${i + 1}`}
                </span>
                <div>
                  <span className="font-semibold text-white">
                    {t.teamName}
                  </span>
                  {t.leadName && (
                    <span className="ml-2 text-sm text-white/40">
                      — {t.leadName}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-mono text-sm font-bold text-primary">
                  {t.totalScore} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass p-6">
        <h2 className="text-lg font-semibold text-white">
          Event-wise Results
        </h2>
        <div className="mt-4 space-y-4">
          {regularEvents.map((ev: any) => {
            const eventSubs = submissions
              .filter((s: any) => s.event_id === ev.id)
              .sort(
                (a: any, b: any) =>
                  getEffectiveScore(b) - getEffectiveScore(a),
              );
            return (
              <div
                key={ev.id}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/40">
                      Event {ev.slot}
                    </div>
                    <div className="font-semibold text-white">{ev.title}</div>
                  </div>
                  <div className="text-xs text-white/40">
                    {eventSubs.length} submitted
                  </div>
                </div>
                <div className="mt-3 divide-y divide-white/5">
                  {eventSubs.length === 0 ? (
                    <div className="py-2 text-sm text-white/40">
                      No submissions yet.
                    </div>
                  ) : (
                    eventSubs.map((s: any) => {
                      const effective = getEffectiveScore(s);
                      return (
                        <div
                          key={`${s.team_name}-${s.lead_name}`}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white">
                              {s.team_name}
                            </span>
                            {s.lead_name && (
                              <span className="text-xs text-white/40">
                                ({s.lead_name})
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              effective > 0
                                ? "text-[#22c55e]"
                                : "text-white/40"
                            }`}
                          >
                            {effective > 0 ? `${effective} pts` : "\u2014"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}

          {osintEvent && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/40">
                    Event {osintEvent.slot}
                  </div>
                  <div className="font-semibold text-white">
                    {osintEvent.title}
                  </div>
                </div>
                <div className="text-xs text-white/40">
                  {osintProgress.length} participated
                </div>
              </div>
              <div className="mt-3 divide-y divide-white/5">
                {osintProgress.length === 0 ? (
                  <div className="py-2 text-sm text-white/40">
                    No participants yet.
                  </div>
                ) : (
                  osintProgress
                    .sort(
                      (a: any, b: any) =>
                        b.total_correct - a.total_correct,
                    )
                    .map((p: any) => (
                      <div
                        key={`${p.team_name}-${p.lead_name}`}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">
                            {p.team_name}
                          </span>
                          {p.completed && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" />
                          )}
                        </div>
                        <span className="text-xs font-medium text-primary">
                          {p.total_correct} correct
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
