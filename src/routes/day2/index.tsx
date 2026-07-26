import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { day2GetEvent, day2GetSubmissions } from "@/lib/api.day2";
import { countdown, formatIST } from "@/lib/format";
import {
  Lock,
  CheckCircle2,
  Clock,
  Trophy,
  Shield,
  Zap,
  Palette,
  Search,
  Code,
  Wrench,
} from "lucide-react";

export const Route = createFileRoute("/day2/")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Day 2 — Vibeathon 6.0" }],
  }),
  component: Day2Index,
});

interface EventDef {
  track: string;
  slot: number;
  label: string;
  title: string;
  path: string;
  icon: React.ReactNode;
}

const EVENTS: EventDef[] = [
  {
    track: "tech",
    slot: 3,
    label: "Tech 3",
    title: "Scenario Challenge: Find the Hidden Credentials",
    path: "/day2/tech3",
    icon: <Shield className="h-5 w-5" />,
  },
  {
    track: "nontech",
    slot: 3,
    label: "Non-Tech 3",
    title: "Brand Battle: Show Your Marketing Skills",
    path: "/day2/nontech3",
    icon: <Palette className="h-5 w-5" />,
  },
  {
    track: "tech",
    slot: 4,
    label: "Tech 4",
    title: "OSINT Challenge: NxtGenSec Intelligence",
    path: "/day2/tech4",
    icon: <Search className="h-5 w-5" />,
  },
  {
    track: "nontech",
    slot: 4,
    label: "Non-Tech 4",
    title: "Coming Soon",
    path: "/day2/nontech4",
    icon: <Clock className="h-5 w-5" />,
  },
  {
    track: "tech",
    slot: 5,
    label: "Tech 5",
    title: "Dev Tools CTF",
    path: "/day2/tech5",
    icon: <Wrench className="h-5 w-5" />,
  },
  {
    track: "nontech",
    slot: 5,
    label: "Non-Tech 5",
    title: "Coming Soon",
    path: "/day2/nontech5",
    icon: <Clock className="h-5 w-5" />,
  },
];

type EventStatus = "upcoming" | "live" | "completed" | "submitted";

const STATUS_STYLES: Record<
  EventStatus,
  { color: string; icon: React.ReactNode; text: string }
> = {
  upcoming: {
    color: "text-yellow-400",
    icon: <Clock className="h-4 w-4" />,
    text: "Upcoming",
  },
  live: {
    color: "text-green-400",
    icon: <Zap className="h-4 w-4" />,
    text: "Live",
  },
  completed: {
    color: "text-white/40",
    icon: <CheckCircle2 className="h-4 w-4" />,
    text: "Completed",
  },
  submitted: {
    color: "text-primary",
    icon: <CheckCircle2 className="h-4 w-4" />,
    text: "Submitted",
  },
};

function Day2Index() {
  const [teamNameInput, setTeamNameInput] = useState("");
  const [leadNameInput, setLeadNameInput] = useState("");

  const [registered, setRegistered] = useState(() => {
    try {
      const raw = localStorage.getItem("day2_team");
      if (!raw) return false;
      const p = JSON.parse(raw);
      return !!(p?.teamName && p?.leadName);
    } catch {
      return false;
    }
  });

  const team = registered
    ? (() => {
        try {
          return JSON.parse(localStorage.getItem("day2_team") || "{}");
        } catch {
          return null;
        }
      })()
    : null;

  const getEventFn = useServerFn(day2GetEvent);
  const getSubsFn = useServerFn(day2GetSubmissions);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const eventResults = useQueries({
    queries: EVENTS.map((e) => ({
      queryKey: ["day2-event", e.track, e.slot] as const,
      queryFn: () =>
        getEventFn({ data: { track: e.track, slot: e.slot } }),
    })),
  });

  const { data: subs } = useQuery({
    queryKey: ["day2-subs", team?.teamName],
    queryFn: () =>
      getSubsFn({
        data: { teamName: team.teamName, leadName: team.leadName },
      }),
    enabled: !!team?.teamName,
  });

  const subList = (subs as any[] | undefined) ?? [];

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const tn = teamNameInput.trim();
    const ln = leadNameInput.trim();
    if (!tn || !ln) return;
    localStorage.setItem("day2_team", JSON.stringify({ teamName: tn, leadName: ln }));
    setRegistered(true);
  }

  function getStatus(ev: EventDef, dbEvent: any): EventStatus {
    if (!dbEvent) return "upcoming";
    if (subList.some((s: any) => s.event_id === dbEvent.id)) return "submitted";
    if (dbEvent.force_live) return "live";
    const start = new Date(dbEvent.start_at).getTime();
    const end = dbEvent.end_at ? new Date(dbEvent.end_at).getTime() : Infinity;
    if (now < start) return "upcoming";
    if (now >= end) return "completed";
    return "live";
  }

  if (!registered) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="glass-strong w-full max-w-md p-8">
          <div className="flex flex-col items-center gap-3">
            <Trophy className="h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold text-white">
              Vibeathon 6.0 · Day 2
            </h1>
            <p className="text-sm text-white/50">3 Challenges Await</p>
          </div>
          <form onSubmit={handleRegister} className="mt-8 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-white/70">
                Team Name
              </label>
              <input
                type="text"
                value={teamNameInput}
                onChange={(e) => setTeamNameInput(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary"
                placeholder="Enter team name"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">
                Lead Name
              </label>
              <input
                type="text"
                value={leadNameInput}
                onChange={(e) => setLeadNameInput(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary"
                placeholder="Enter lead name"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Register & Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  function renderCard(ev: EventDef, idx: number) {
    const dbEvent = eventResults[idx]?.data;
    const status = getStatus(ev, dbEvent);
    const style = STATUS_STYLES[status];
    const isLocked =
      status === "upcoming" && dbEvent?.start_at && new Date(dbEvent.start_at).getTime() > now;

    return (
      <Link key={`${ev.track}-${ev.slot}`} to={ev.path} className="block">
        <div
          className={`glass p-5 transition hover:bg-white/[0.07] ${
            status === "submitted" ? "ring-1 ring-primary/30" : ""
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span
                className={
                  ev.track === "tech" ? "text-primary" : "text-purple-400"
                }
              >
                {ev.icon}
              </span>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-white/40">
                  {ev.label}
                </span>
                <h3 className="mt-0.5 font-semibold text-white">{ev.title}</h3>
              </div>
            </div>
            {isLocked ? (
              <Lock className="h-5 w-5 shrink-0 text-yellow-500/60" />
            ) : (
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.color} bg-white/5`}
              >
                {style.icon} {style.text}
              </span>
            )}
          </div>
          {dbEvent?.start_at && (
            <div className="mt-3 text-xs text-white/40">
              Starts: {formatIST(dbEvent.start_at)}
              {isLocked && (
                <span className="ml-2 text-yellow-400/70">
                  in {countdown(dbEvent.start_at)}
                </span>
              )}
            </div>
          )}
          {ev.title === "Coming Soon" && !dbEvent && (
            <div className="mt-3 text-xs text-white/30">
              Event details coming soon
            </div>
          )}
        </div>
      </Link>
    );
  }

  const techEvents = EVENTS.map((e, i) => ({ ev: e, idx: i })).filter(
    (x) => x.ev.track === "tech"
  );
  const nontechEvents = EVENTS.map((e, i) => ({ ev: e, idx: i })).filter(
    (x) => x.ev.track === "nontech"
  );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">
          <span className="text-primary">Vibeathon 6.0</span> · Day 2
        </h1>
        <p className="mt-3 text-lg text-white/50">3 Challenges Await</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Code className="h-5 w-5 text-primary" /> Tech Track
          </h2>
          {techEvents.map(({ ev, idx }) => renderCard(ev, idx))}
        </div>

        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Palette className="h-5 w-5 text-purple-400" /> Non-Tech Track
          </h2>
          {nontechEvents.map(({ ev, idx }) => renderCard(ev, idx))}
        </div>
      </div>
    </div>
  );
}
