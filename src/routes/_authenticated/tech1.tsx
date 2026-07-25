import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getEvent, submitAnswer } from "@/lib/api.functions";
import { GlassCard } from "@/components/AppShell";
import { countdown, formatIST } from "@/lib/format";
import { CheckCircle2, Lock, EyeOff, Shield, Database, Terminal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tech1")({
  head: () => ({
    meta: [
      { title: "Tech Event 1: Bug Hunt — Vibeathon" },
      { name: "description", content: "Find the hidden secret token by inspecting the page." },
    ],
  }),
  component: TechEvent1,
});

function TechEvent1() {
  const getFn = useServerFn(getEvent);
  const subFn = useServerFn(submitAnswer);
  const qc = useQueryClient();
  const { data, refetch } = useQuery({
    queryKey: ["event", "tech", 1],
    queryFn: () => getFn({ data: { track: "tech", slot: 1 } }),
    refetchInterval: 15000,
  });
  const [answer, setAnswer] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // Pre-fill with previous answer on first load (for retakes)
  useEffect(() => {
    if (data && (data as any).submission && !answer) {
      setAnswer((data as any).submission.answer);
    }
  }, [data]);

  const submit = useMutation({
    mutationFn: (ans: string) => subFn({ data: { eventId: data!.event.id, answer: ans } }),
    onSuccess: () => { setAnswer(""); setErr(null); refetch(); },
    onError: (e: any) => setErr(e?.message ?? "Failed to submit"),
  });

  if (!data) return <div className="text-white/60">Loading…</div>;
  const { event, open, started, submission } = data as any;

  if (!started) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <Lock className="mx-auto h-8 w-8 text-white/40" />
        <h1 className="text-3xl font-semibold text-white">Tech Event 1: Bug Hunt</h1>
        <p className="text-white/60">Not yet open</p>
        <div className="font-mono text-4xl text-primary">{countdown(event.start_at)}</div>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <GlassCard>
          <div className="text-center text-white/60">
            <Lock className="mx-auto h-6 w-6" />
            <div className="mt-3 font-semibold">This event is closed</div>
            <p className="mt-1 text-sm">You did not submit an answer in the window.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-white/50">Tech · Event 1 · Challenge</div>
        <h1 className="mt-2 text-3xl font-semibold text-white">Bug Hunt: Find the Secret Token</h1>
        <p className="mt-1 text-sm text-white/60">
          There's a bug in this page — the reveal feature is broken. Find another way to uncover the secret token hidden somewhere on this page. Good luck!
        </p>
      </div>

      {/* Fake Admin Panel */}
      <GlassCard>
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-white">System Administration Panel</span>
          <span className="ml-auto text-xs text-green-400">● Online</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-md bg-white/5 p-3">
            <div className="text-xs text-white/40">Total Users</div>
            <div className="mt-1 text-lg font-semibold text-white">1,382</div>
          </div>
          <div className="rounded-md bg-white/5 p-3">
            <div className="text-xs text-white/40">Active Sessions</div>
            <div className="mt-1 text-lg font-semibold text-white">247</div>
          </div>
          <div className="rounded-md bg-white/5 p-3">
            <div className="text-xs text-white/40">Events Running</div>
            <div className="mt-1 text-lg font-semibold text-white">2</div>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">Security Settings</span>
          </div>

          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between rounded-md bg-white/5 p-3">
              <div>
                <div className="text-xs text-white/40">API Secret Token</div>
                <div className="mt-1 font-mono text-sm text-white">••••••••••••••••</div>
              </div>
              <button
                onClick={() => alert("Feature temporarily disabled for security audit.")}
                className="rounded-md border border-white/10 p-2 text-white/40 hover:bg-white/5"
                title="Reveal token"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            </div>

            {/* ===== HIDDEN ANSWER — find me via Inspect ===== */}
            {/* Secret token: Welcome to vibeathon 6.0 */}
            <div style={{ display: "none" }}>Token: Welcome to vibeathon 6.0</div>
            <span data-token="Welcome to vibeathon 6.0" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} />
            <script
              type="application/json"
              id="app-config"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({ api_token: "Welcome to vibeathon 6.0", env: "production" }),
              }}
            />
            {/* ===== END HIDDEN ANSWER ===== */}

            <div className="secret-token" />

            <div className="flex items-center justify-between rounded-md bg-white/5 p-3">
              <div>
                <div className="text-xs text-white/40">Database Connection</div>
                <div className="mt-1 font-mono text-sm text-green-400">● Connected</div>
              </div>
              <Database className="h-4 w-4 text-white/20" />
            </div>

            <div className="flex items-center justify-between rounded-md bg-white/5 p-3">
              <div>
                <div className="text-xs text-white/40">Server Status</div>
                <div className="mt-1 font-mono text-sm text-green-400">● Running (v3.2.1)</div>
              </div>
              <Terminal className="h-4 w-4 text-white/20" />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Answer Input */}
      <GlassCard>
        <div className="text-xs uppercase tracking-widest text-white/50">Your Answer</div>
        <p className="mt-1 text-sm text-white/60">Found the secret token? Enter it below.</p>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={2}
          className="mt-3 w-full resize-none rounded-md border border-white/10 bg-black/40 p-3 font-mono text-white outline-none focus:border-primary"
          placeholder="Enter the secret token…"
        />
        {err && <div className="mt-2 text-xs text-red-400">{err}</div>}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-white/50">You can resubmit — your latest answer will be saved.</div>
          <button
            disabled={!answer.trim() || submit.isPending}
            onClick={() => submit.mutate(answer.trim())}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
          >
            {submit.isPending ? "Submitting…" : "Submit Answer"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
