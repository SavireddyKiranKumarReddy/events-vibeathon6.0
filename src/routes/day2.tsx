import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createFileRoute,
  Outlet,
  Link,
  redirect,
} from "@tanstack/react-router";
import { createContext, useContext } from "react";

interface Day2Team {
  teamName: string;
  leadName: string;
  isRegistered: boolean;
}

const Day2TeamCtx = createContext<Day2Team>({
  teamName: "",
  leadName: "",
  isRegistered: false,
});

export function useDay2Team() {
  return useContext(Day2TeamCtx);
}

function readTeam(): Day2Team {
  try {
    const raw = localStorage.getItem("day2_team");
    if (!raw) return { teamName: "", leadName: "", isRegistered: false };
    const p = JSON.parse(raw);
    if (p?.teamName && p?.leadName) {
      return { teamName: p.teamName, leadName: p.leadName, isRegistered: true };
    }
  } catch {}
  return { teamName: "", leadName: "", isRegistered: false };
}

const queryClient = new QueryClient();

export const Route = createFileRoute("/day2")({
  ssr: false,
  beforeLoad: ({ location }) => {
    const path = location.pathname;
    if (path === "/day2" || path === "/day2/") return;
    let team: any = null;
    try {
      const raw = localStorage.getItem("day2_team");
      if (raw) team = JSON.parse(raw);
    } catch {}
    if (!team?.teamName) throw redirect({ to: "/day2" });
  },
  component: Day2Layout,
});

function Day2Layout() {
  const team = readTeam();

  return (
    <QueryClientProvider client={queryClient}>
      <Day2TeamCtx.Provider value={team}>
        <div className="min-h-screen bg-black text-white">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
              <Link to="/day2" className="flex items-center gap-2 font-semibold">
                <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                <span>Vibeathon 6.0</span>
              </Link>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                Day 2
              </span>
              <div className="flex items-center gap-4">
                {team.isRegistered && (
                  <span className="text-sm text-white/70">{team.teamName}</span>
                )}
                <Link
                  to="/day2/leaderboard"
                  className="rounded-md px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
                >
                  Leaderboard
                </Link>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-6 py-8">
            <Outlet />
          </main>
        </div>
      </Day2TeamCtx.Provider>
    </QueryClientProvider>
  );
}
