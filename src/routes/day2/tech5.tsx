import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  day2GetEvent,
  day2GetSubmissions,
  day2GetChallengeConfig,
  day2GradeDevToolsCtf,
} from "@/lib/api.day2";
import { countdown, formatIST } from "@/lib/format";
import {
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trophy,
  Code2,
} from "lucide-react";

export const Route = createFileRoute("/day2/tech5")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tech Event 5: Dev Tools CTF — Vibeathon" },
      { name: "description", content: "A mini CTF with 10 questions about developer tools." },
    ],
  }),
  component: TechEvent5,
});

function getTeam() {
  try {
    return JSON.parse(localStorage.getItem("day2_team") || "{}");
  } catch {
    return {};
  }
}

function TechEvent5() {
  const team = getTeam();
  const getEventFn = useServerFn(day2GetEvent);
  const getSubsFn = useServerFn(day2GetSubmissions);
  const getConfigFn = useServerFn(day2GetChallengeConfig);
  const gradeFn = useServerFn(day2GradeDevToolsCtf);

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: event } = useQuery({
    queryKey: ["day2-event", "tech", 5],
    queryFn: () => getEventFn({ data: { track: "tech", slot: 5 } }),
    refetchInterval: 15000,
  });

  const { data: submissions } = useQuery({
    queryKey: ["day2-subs", team.teamName, team.leadName],
    queryFn: () =>
      getSubsFn({ data: { teamName: team.teamName, leadName: team.leadName } }),
    enabled: !!team.teamName,
  });

  const { data: config } = useQuery({
    queryKey: ["day2-config", "devtools_ctf"],
    queryFn: () => getConfigFn({ data: { challengeKey: "devtools_ctf" } }),
  });

  const existingSubmission = submissions?.find((s: any) => s.event_id === event?.id);
  const questions = (config as any)?.questions ?? [];

  const grade = useMutation({
    mutationFn: () =>
      gradeFn({
        data: {
          teamName: team.teamName,
          leadName: team.leadName,
          eventId: event!.id,
          answers: questions.map((_: any, i: number) => answers[i] ?? ""),
        },
      }),
    onSuccess: (res: any) => {
      setResult({ score: res.score, total: res.total });
      setErr(null);
    },
    onError: (e: any) => {
      setErr(e?.message ?? "Failed to submit");
    },
  });

  if (!team.teamName) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-[#f97316]" />
        <h1 className="text-2xl font-semibold text-white">Team Not Registered</h1>
        <p className="text-white/60">Please register your team first before accessing Day 2 challenges.</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <div className="text-white/60">Loading event...</div>
      </div>
    );
  }

  const now = Date.now();
  const started = now >= new Date(event.start_at).getTime();

  if (!started) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <Lock className="mx-auto h-8 w-8 text-white/40" />
        <h1 className="text-3xl font-semibold text-white">Tech Event 5: Dev Tools CTF</h1>
        <p className="text-white/60">Not yet open</p>
        <div className="font-mono text-4xl text-primary">{countdown(event.start_at)}</div>
        <p className="text-xs text-white/40">Opens at {formatIST(event.start_at)}</p>
      </div>
    );
  }

  if (existingSubmission || submitted || result) {
    let score = result?.score ?? null;
    let total = result?.total ?? questions.length;
    if (!score && existingSubmission?.score != null) {
      score = existingSubmission.score;
      total = questions.length;
    }

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="glass p-6">
          <div className="flex items-center gap-3">
            {score !== null && score > 0 ? (
              <CheckCircle2 className="h-6 w-6 text-[#22c55e]" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-[#ef4444]" />
            )}
            <h1 className="text-2xl font-semibold text-white">CTF Completed</h1>
          </div>
          {score !== null && (
            <div className="mt-4 flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <div className="text-3xl font-bold text-primary">{score} / {total}</div>
                <div className="text-sm text-white/50">Questions Correct</div>
              </div>
            </div>
          )}
          {existingSubmission && (
            <p className="mt-4 text-xs text-white/50">Submitted at {formatIST(existingSubmission.submitted_at)}</p>
          )}
          <p className="mt-2 text-xs text-white/40">This challenge is now locked for your team.</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <Code2 className="mx-auto h-8 w-8 text-white/40" />
        <h1 className="text-3xl font-semibold text-white">Tech Event 5: Dev Tools CTF</h1>
        <p className="text-white/60">Challenge is loading...</p>
      </div>
    );
  }

  const answeredCount = Object.values(answers).filter((a) => a.trim()).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-white/50">Tech · Event 5 · Challenge</div>
        <h1 className="mt-2 text-3xl font-semibold text-white">Dev Tools CTF</h1>
        <p className="mt-1 text-sm text-white/60">
          Answer all {questions.length} questions about developer tools and technologies. Each correct answer earns 1 point.
        </p>
      </div>

      <div className="glass p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Answered: {answeredCount} / {questions.length}</span>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {questions.map((q: any, i: number) => (
        <div key={i} className="glass p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
              {i + 1}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{q.q}</p>
              <input
                type="text"
                value={answers[i] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                placeholder="Type your answer..."
                className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-primary"
              />
            </div>
          </div>
        </div>
      ))}

      {err && (
        <div className="flex items-center gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5 p-3 text-sm text-[#ef4444]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {err}
        </div>
      )}

      <div className="glass p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-white/50">
            <Lock className="h-3 w-3" />
            One submission only. The challenge locks after submitting.
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/50">{answeredCount}/{questions.length} answered</span>
            <button
              disabled={answeredCount < questions.length || grade.isPending}
              onClick={() => grade.mutate()}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {grade.isPending ? "Submitting..." : "Submit All Answers"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
