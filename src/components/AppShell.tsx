import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/api.functions";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, ShieldCheck } from "lucide-react";

const HIDE_NAV_PATHS = ["/tech1", "/tech2", "/nontech1", "/nontech2"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const router = useRouter();
  const meFn = useServerFn(getMe);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });

  const hideNav = HIDE_NAV_PATHS.includes(router.state.location.pathname);

  async function signOut() {
    await supabase.auth.signOut();
    router.invalidate();
    nav({ to: "/auth", replace: true });
  }

  const navLink =
    "px-3 py-1.5 rounded-md text-sm text-white/80 hover:text-white hover:bg-white/5 transition";
  const active = "text-white bg-white/10";

  if (hideNav) {
    return <div className="min-h-screen"><main className="mx-auto max-w-7xl px-6 py-8">{children}</main></div>;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              <span>Vibeathon</span>
            </Link>
            <nav className="flex items-center gap-1">
              <Link to="/dashboard" className={navLink} activeProps={{ className: `${navLink} ${active}` }}>
                Dashboard
              </Link>
              <Link to="/events" className={navLink} activeProps={{ className: `${navLink} ${active}` }}>
                Events
              </Link>
              <Link to="/leaderboard" className={navLink} activeProps={{ className: `${navLink} ${active}` }}>
                Leaderboard
              </Link>
              {me?.isAdmin && (
                <Link to="/admin" className={navLink} activeProps={{ className: `${navLink} ${active}` }}>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Admin
                  </span>
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <div className="text-white/90">{me?.team?.name ?? (me?.isAdmin ? "Admin" : "")}</div>
              <div className="text-white/50">{me?.email}</div>
            </div>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}

export function GlassCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`glass p-6 ${className}`}>{children}</div>;
}