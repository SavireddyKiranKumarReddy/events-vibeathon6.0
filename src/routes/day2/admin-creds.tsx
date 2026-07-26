import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, CheckCircle2, AlertTriangle, Terminal } from "lucide-react";

export const Route = createFileRoute("/day2/admin-creds")({
  ssr: false,
  head: () => ({
    meta: [{ title: "System Debug Console — Hidden" }],
  }),
  component: AdminCreds,
});

const VALID_USER = "system-debug";
const VALID_PASS = "dcp_key_1928";
const FLAG = "Congrats_you_found_M3";

function AdminCreds() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim() === VALID_USER && password.trim() === VALID_PASS) {
      setResult("correct");
    } else {
      setResult("wrong");
    }
  }

  if (result === "correct") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="glass-strong w-full max-w-md p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#22c55e]" />
          <h1 className="mt-4 text-2xl font-bold text-white">Access Granted</h1>
          <div className="mt-6 rounded-lg border border-[#22c55e]/20 bg-[#22c55e]/5 p-6">
            <div className="text-xs uppercase tracking-widest text-[#22c55e] mb-2">Flag</div>
            <div className="font-mono text-xl font-bold text-[#22c55e]">{FLAG}</div>
          </div>
          <p className="mt-4 text-sm text-white/50">
            Copy this flag and submit it on the Tech Event 3 challenge page.
          </p>
          <a
            href="/day2/tech3"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            ← Back to Tech Event 3
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass-strong w-full max-w-md p-8">
        <div className="flex flex-col items-center gap-3">
          <Terminal className="h-10 w-10 text-[#3b82f6]" />
          <h1 className="text-2xl font-bold text-white">System Debug Console</h1>
          <p className="text-sm text-white/50">Enter admin credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/70">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-primary"
              placeholder="Enter username"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-white placeholder-white/30 outline-none transition focus:border-primary"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {result === "wrong" && (
            <div className="flex items-center gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5 p-3 text-sm text-[#ef4444]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Invalid credentials. Try again.
            </div>
          )}

          <button
            type="submit"
            disabled={!username.trim() || !password.trim()}
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            Authenticate
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/day2/tech3" className="text-xs text-white/30 hover:text-white/60">
            ← Return to challenge
          </a>
        </div>
      </div>
    </div>
  );
}
