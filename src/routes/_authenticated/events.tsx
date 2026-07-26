import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { listEvents } from "@/lib/api.functions";
import { countdown, formatIST } from "@/lib/format";
import { Lock, LockOpen, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({
    meta: [
      { title: "Events — Vibeathon" },
      { name: "description", content: "Tech and non-tech events across three days of Vibeathon." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const [track, setTrack] = useState<"tech" | "nontech">("tech");
  const fn = useServerFn(listEvents);
  const { data } = useQuery({ queryKey: ["events"], queryFn: () => fn(), refetchInterval: 10000 });
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const now = Date.now();
  const events = (data?.events ?? []).filter((e: any) => e.track === track);

  return (
    <div className="space-y-6">
      {/* system-debug: c3lzdGVtLWRlYnVnOiBkY3Bfa2V5XzE5Mjg= */}
      <div>
        <h1 className="text-3xl font-semibold text-white">Events</h1>
        <p className="mt-1 text-sm text-white/60">
          Auto-unlocks at exact start time. Auto-locks when the next event begins.
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {events.map((e: any) => {
          const effectiveStart = e.live_at ? new Date(e.live_at).getTime() : new Date(e.start_at).getTime();
          const next = (data?.events ?? [])
            .filter((x: any) => x.track === track && new Date(x.start_at).getTime() > new Date(e.start_at).getTime())
            .sort((a: any, b: any) => +new Date(a.start_at) - +new Date(b.start_at))[0];

          let locksAt: number | null;
          if (e.force_live) {
            locksAt = e.end_at ? new Date(e.end_at).getTime() : null;
          } else {
            locksAt = next ? new Date(next.start_at).getTime() : e.end_at ? new Date(e.end_at).getTime() : null;
          }

          const upcoming = now < effectiveStart;
          const isOpen = !upcoming && !e.manual_lock && (!locksAt || now < locksAt);
          const closed = !upcoming && !isOpen;
          return (
            <div key={e.id} className="glass p-5">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Event {e.slot}</span>
                {isOpen ? (
                  <span className="inline-flex items-center gap-1 text-primary">
                    <LockOpen className="h-3.5 w-3.5" /> Open
                  </span>
                ) : upcoming ? (
                  <span className="inline-flex items-center gap-1 text-white/50">
                    <Lock className="h-3.5 w-3.5" /> Upcoming
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-white/40">
                    <Lock className="h-3.5 w-3.5" /> Closed
                  </span>
                )}
              </div>
              <div className="mt-2 text-lg font-semibold text-white">{e.title}</div>
              <div className="mt-1 text-xs text-white/50">Starts {formatIST(e.start_at)}</div>
              {e.force_live && (
                <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
                  Force Live
                </div>
              )}
              {e.test_emails?.length > 0 && !e.force_live && (
                <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-yellow-500/20 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
                  Test mode ({e.test_emails.length} emails)
                </div>
              )}
              {upcoming && <div className="mt-3 font-mono text-xl text-primary">{countdown(e.live_at ?? e.start_at)}</div>}
              {isOpen && (
                <Link
                  to={e.slot === 1 && track === "tech" ? "/tech1" : e.slot === 2 && track === "tech" ? "/tech2" : e.slot === 1 && track === "nontech" ? "/nontech1" : e.slot === 2 && track === "nontech" ? "/nontech2" : "/events/$track/$slot"}
                  params={(e.slot === 1 && track === "tech") || (e.slot === 2 && track === "tech") || (e.slot === 1 && track === "nontech") || (e.slot === 2 && track === "nontech") ? undefined : { track, slot: String(e.slot) }}
                  className="mt-4 inline-flex rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Enter →
                </Link>
              )}
              {closed && (
                <div className="mt-3 inline-flex items-center gap-1 text-xs text-white/50">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Window closed
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}