import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getEvent, submitAnswer } from "@/lib/api.functions";
import { GlassCard } from "@/components/AppShell";
import { countdown, formatIST } from "@/lib/format";
import { CheckCircle2, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/events/$track/$slot")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.track === "tech" ? "Tech" : "Non-Tech"} Event ${params.slot} — Vibeathon` },
      { name: "description", content: "Answer this Vibeathon event question. One submission per team." },
    ],
  }),
  component: EventPage,
});

function EventPage() {
  const { track, slot } = useParams({ from: "/_authenticated/events/$track/$slot" });
  const qc = useQueryClient();
  const trackTyped = (track === "tech" ? "tech" : "nontech") as "tech" | "nontech";
  const getFn = useServerFn(getEvent);
  const subFn = useServerFn(submitAnswer);
  const key = ["event", trackTyped, slot];
  const { data, refetch } = useQuery({
    queryKey: key,
    queryFn: () => getFn({ data: { track: trackTyped, slot: Number(slot) } }),
    refetchInterval: 15000,
  });
  const [answer, setAnswer] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const submit = useMutation({
    mutationFn: (ans: string) => subFn({ data: { eventId: data!.event.id, answer: ans } }),
    onSuccess: () => {
      setAnswer("");
      setErr(null);
      qc.invalidateQueries({ queryKey: key });
      refetch();
    },
    onError: (e: any) => setErr(e?.message ?? "Failed to submit"),
  });

  if (!data) return <div className="text-white/60">Loading…</div>;
  const { event, open, started, locksAt, submission } = data as any;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-white/50">
          {trackTyped === "tech" ? "Tech" : "Non-Tech"} · Event {event.slot}
        </div>
        <h1 className="mt-2 text-3xl font-semibold text-white">{event.title}</h1>
        <div className="mt-1 text-xs text-white/50">
          Starts {formatIST(event.start_at)}
          {locksAt ? ` · Locks ${formatIST(locksAt)}` : ""}
        </div>
      </div>
      {!started ? (
        <GlassCard>
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 text-sm text-white/60">
              <Lock className="h-4 w-4" /> Not yet open
            </div>
            <div className="mt-4 font-mono text-4xl text-primary">{countdown(event.start_at)}</div>
          </div>
        </GlassCard>
      ) : submission ? (
        <GlassCard>
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Submitted</span>
          </div>
          <div className="mt-2 text-xs text-white/50">Submitted at {formatIST(submission.submitted_at)}</div>
          <div className="mt-4 rounded-md bg-white/5 p-4 text-sm text-white/80">{submission.answer}</div>
          <div className="mt-3 text-xs text-white/50">
            Submissions are final. Leaderboards appear when the admin makes them visible.
          </div>
        </GlassCard>
      ) : !open ? (
        <GlassCard>
          <div className="text-center text-white/60">
            <Lock className="mx-auto h-6 w-6" />
            <div className="mt-3 font-semibold">This event is closed</div>
            <p className="mt-1 text-sm">You did not submit an answer in the window.</p>
          </div>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-white/50">Question</div>
          <p className="mt-2 whitespace-pre-wrap text-lg text-white">
            {event.question || (
              <span className="text-white/40">Waiting for the admin to publish the question…</span>
            )}
          </p>
          {event.question && (
            <>
              <div className="mt-6 text-xs uppercase tracking-widest text-white/50">Your Answer</div>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={5}
                className="mt-2 w-full resize-none rounded-md border border-white/10 bg-black/40 p-3 text-white outline-none focus:border-primary"
                placeholder="Type your answer…"
              />
              {err && <div className="mt-2 text-xs text-white">{err}</div>}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-white/50">⚠ You can only submit once. It cannot be edited.</div>
                <button
                  disabled={!answer.trim() || submit.isPending}
                  onClick={() => submit.mutate(answer.trim())}
                  className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
                >
                  {submit.isPending ? "Submitting…" : "Submit answer"}
                </button>
              </div>
            </>
          )}
        </GlassCard>
      )}
    </div>
  );
}