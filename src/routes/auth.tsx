import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMe } from "@/lib/api.functions";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Vibeathon" },
      { name: "description", content: "Team-lead sign-in for the Vibeathon events platform." },
    ],
  }),
  component: AuthPage,
});

export function MobileGate() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-6 lg:hidden">
      <div className="glass-strong max-w-sm p-8 text-center">
        <h2 className="text-lg font-semibold text-white">Please use a laptop</h2>
        <p className="mt-2 text-sm text-white/60">
          Vibeathon is desktop-only. Open this on a laptop or larger screen.
        </p>
      </div>
    </div>
  );
}

const DEFAULT_PASSWORD = "vibeathon2026";

function AuthPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      try {
        const me = await getMe();
        if (cancelled) return;
        if (!me.hasAccess) {
          setDenied(true);
          await supabase.auth.signOut();
          return;
        }
        nav({ to: "/dashboard", replace: true });
      } catch {
        /* ignore */
      }
    }
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") check();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [nav]);

  async function signInWithGoogle() {
    setError(null);
    setDenied(false);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/auth",
        },
      });
      if (error) setError(error.message ?? "Sign-in failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDenied(false);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message.includes("Invalid login")) {
          setError("Invalid email or account not found. Try Google Sign-In, or contact admin.");
        } else {
          setError(error.message);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="hidden min-h-screen items-center justify-center px-6 lg:flex">
        <div className="glass-strong w-full max-w-md p-10 text-center">
          <div className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Vibeathon
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-white">Team Lead Sign In</h1>
          <p className="mt-2 text-sm text-white/60">
            Sign in with Google or use your email with the default password.
          </p>

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#fff" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4a6.1 6.1 0 1 1 0-12.2c1.9 0 3.2.8 4 1.5l2.7-2.6C16.9 3.1 14.7 2 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.3-.2-2H12z" />
            </svg>
            {loading ? "Opening Google…" : "Sign in with Google"}
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/40">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={signInWithEmail} className="space-y-3 text-left">
            <label className="block">
              <div className="text-xs text-white/60">Email</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <div className="text-xs text-white/60">Password</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
                placeholder="Enter your password"
              />
            </label>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In with Email"}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-white">
              {error}
            </div>
          )}
          {denied && (
            <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-white">
              Access denied. This account is not on the invited team-lead list.
            </div>
          )}
        </div>
      </div>
      <MobileGate />
    </>
  );
}
