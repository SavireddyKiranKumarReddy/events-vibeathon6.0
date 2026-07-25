import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { listEvents, getMe } from "@/lib/api.functions";
import { GlassCard } from "@/components/AppShell";
import { countdown, formatIST } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Vibeathon" },
      { name: "description", content: "Your Vibeathon dashboard: upcoming events and current status." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const meFn = useServerFn(getMe);
  const evFn = useServerFn(listEvents);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const { data: evs } = useQuery({ queryKey: ["events"], queryFn: () => evFn(), refetchInterval: 15000 });
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const now = Date.now();
  const events = evs?.events ?? [];

  const nextByTrack = (track: "tech" | "nontech") =>
    events
      .filter((e: any) => e.track === track && new Date(e.start_at).getTime() > now)
      .sort((a: any, b: any) => +new Date(a.start_at) - +new Date(b.start_at))[0] ?? null;

  const openByTrack = (track: "tech" | "nontech") =>
    events
      .filter((e: any) => e.track === track)
      .find((e: any) => {
        if (e.manual_lock) return false;
        const start = new Date(e.start_at).getTime();
        if (now < start) return false;
        const next = events
          .filter((x: any) => x.track === track && new Date(x.start_at).getTime() > start)
          .sort((a: any, b: any) => +new Date(a.start_at) - +new Date(b.start_at))[0];
        const locksAt = next ? new Date(next.start_at).getTime() : e.end_at ? new Date(e.end_at).getTime() : null;
        return !locksAt || now < locksAt;
      });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">
          {me?.team ? `Welcome, ${me.team.lead_name}` : me?.isAdmin ? "Admin Dashboard" : "Welcome"}
        </h1>
        <p className="mt-1 text-sm text-white/60">
          {me?.team ? `Team: ${me.team.name}` : "Manage teams and events from the Admin panel."}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(["tech", "nontech"] as const).map((track) => {
          const open = openByTrack(track);
          const next = nextByTrack(track);
          return (
            <GlassCard key={track}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {track === "tech" ? "Tech Track" : "Non-Tech Track"}
                </h2>
                <span className="text-xs uppercase tracking-widest text-white/40">
                  {open ? "Live now" : next ? "Next up" : "Complete"}
                </span>
              </div>
              {open ? (
                <div className="mt-4">
                  <div className="text-2xl font-semibold text-primary">{open.title}</div>
                  <div className="mt-2 text-sm text-white/60">Locks when the next event begins.</div>
                  <Link
                    to="/events/$track/$slot"
                    params={{ track, slot: String(open.slot) }}
                    className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
                  >
                    Open event →
                  </Link>
                </div>
              ) : next ? (
                <div className="mt-4">
                  <div className="text-lg font-medium text-white">{next.title}</div>
                  <div className="mt-1 text-sm text-white/60">Starts {formatIST(next.start_at)}</div>
                  <div className="mt-3 font-mono text-3xl text-primary">{countdown(next.start_at)}</div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-white/50">All events in this track are complete.</p>
              )}
            </GlassCard>
          );
        })}
      </div>
      <GlassCard>
        <h2 className="text-lg font-semibold text-white">All Events</h2>
        <Link to="/events" className="mt-1 inline-block text-sm text-primary hover:underline">
          View events →
        </Link>
      </GlassCard>
    </div>
  );
}