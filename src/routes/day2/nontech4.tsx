import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef } from "react";
import {
  day2GetEvent,
  day2GetSubmissions,
  day2GetChallengeConfig,
  day2GradeSpeedQuiz,
} from "@/lib/api.day2";
import { countdown, formatIST } from "@/lib/format";
import {
  Lock,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  Zap,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  XCircle,
  Timer,
  Bolt,
} from "lucide-react";

export const Route = createFileRoute("/day2/nontech4")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Non-Tech 4: Speed Quiz — Vibeathon" },
      { name: "description", content: "Race against time! Answer 10 questions as fast as you can." },
    ],
  }),
  component: NonTech4,
});

function getTeam() {
  try {
    return JSON.parse(localStorage.getItem("day2_team") || "{}");
  } catch {
    return {};
  }
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function NonTech4() {
  const team = getTeam();
  const getEventFn = useServerFn(day2GetEvent);
  const getSubsFn = useServerFn(day2GetSubmissions);
  const getConfigFn = useServerFn(day2GetChallengeConfig);
  const gradeFn = useServerFn(day2GradeSpeedQuiz);

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [answerTimestamps, setAnswerTimestamps] = useState<Record<number, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [result, setResult] = useState<{
    correct: number;
    wrong: number;
    fastAnswers: number;
    allFastBonus: boolean;
    total: number;
    totalTime: number;
    quizScore: number;
  } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: event } = useQuery({
    queryKey: ["day2-event", "nontech", 4],
    queryFn: () => getEventFn({ data: { track: "nontech", slot: 4 } }),
    refetchInterval: 15000,
  });

  const { data: submissions } = useQuery({
    queryKey: ["day2-subs", team.teamName, team.leadName],
    queryFn: () =>
      getSubsFn({ data: { teamName: team.teamName, leadName: team.leadName } }),
    enabled: !!team.teamName,
  });

  const { data: config } = useQuery({
    queryKey: ["day2-config", "speed_quiz"],
    queryFn: () => getConfigFn({ data: { challengeKey: "speed_quiz" } }),
  });

  const existingSubmission = submissions?.find((s: any) => s.event_id === event?.id);
  const questions: { q: string; options: string[] }[] = (config as any)?.questions ?? [];
  const timeLimit: number = (config as any)?.time_limit ?? 60;

  useEffect(() => {
    if (!quizStarted || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizStarted, submitted]);

  useEffect(() => {
    if (timeLeft <= 0 && quizStarted && !submitted) {
      handleSubmit();
    }
  }, [timeLeft]);

  function recordAnswer(qIndex: number, letter: string) {
    setAnswers((prev) => ({ ...prev, [qIndex]: letter }));
    if (!answerTimestamps[qIndex] && quizStartTime > 0) {
      const elapsed = (Date.now() - quizStartTime) / 1000;
      setAnswerTimestamps((prev) => ({ ...prev, [qIndex]: elapsed }));
    }
  }

  const grade = useMutation({
    mutationFn: (totalTime: number) =>
      gradeFn({
        data: {
          teamName: team.teamName,
          leadName: team.leadName,
          eventId: event!.id,
          answers: questions.map((_: any, i: number) => answers[i] ?? ""),
          answerTimestamps: questions.map((_: any, i: number) => answerTimestamps[i] ?? 999),
          totalTime,
        },
      }),
    onSuccess: (res: any) => {
      setResult({
        correct: res.correct,
        wrong: res.wrong,
        fastAnswers: res.fastAnswers,
        allFastBonus: res.allFastBonus,
        total: res.total,
        totalTime: res.totalTime,
        quizScore: res.quizScore,
      });
      setErr(null);
      setSubmitted(true);
      setShowConfirm(false);
      if (timerRef.current) clearInterval(timerRef.current);
    },
    onError: (e: any) => {
      setErr(e?.message ?? "Failed to submit");
      setShowConfirm(false);
    },
  });

  function handleSubmit() {
    if (submitted || grade.isPending) return;
    const elapsed = Math.round(((Date.now() - quizStartTime) / 1000) * 10) / 10;
    grade.mutate(elapsed);
  }

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
        <h1 className="text-3xl font-semibold text-white">Non-Tech Event 4: Speed Quiz</h1>
        <p className="text-white/60">Not yet open</p>
        <div className="font-mono text-4xl text-primary">{countdown(event.start_at)}</div>
        <p className="text-xs text-white/40">Opens at {formatIST(event.start_at)}</p>
      </div>
    );
  }

  if (existingSubmission || result) {
    const r = result ?? {};
    const score = r.quizScore ?? existingSubmission?.score ?? null;
    const correct = r.correct ?? null;
    const wrong = r.wrong ?? null;
    const fastAnswers = r.fastAnswers ?? 0;
    const allFastBonus = r.allFastBonus ?? false;
    const total = r.total ?? questions.length;
    const totalTime = r.totalTime ?? null;

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="glass p-6">
          <div className="flex items-center gap-3">
            {correct !== null && correct > 0 ? (
              <CheckCircle2 className="h-6 w-6 text-[#22c55e]" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-[#ef4444]" />
            )}
            <h1 className="text-2xl font-semibold text-white">Speed Quiz Completed</h1>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="glass p-4 text-center">
              <Trophy className="mx-auto h-6 w-6 text-primary" />
              <div className="mt-2 text-2xl font-bold text-primary">{score ?? "—"}</div>
              <div className="text-xs text-white/50">Total Score</div>
            </div>
            <div className="glass p-4 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-[#22c55e]" />
              <div className="mt-2 text-2xl font-bold text-[#22c55e]">
                {correct !== null ? correct : "—"}
              </div>
              <div className="text-xs text-white/50">Correct (+{correct !== null ? correct * 100 : 0})</div>
            </div>
            <div className="glass p-4 text-center">
              <XCircle className="mx-auto h-6 w-6 text-[#ef4444]" />
              <div className="mt-2 text-2xl font-bold text-[#ef4444]">
                {wrong !== null ? wrong : "—"}
              </div>
              <div className="text-xs text-white/50">Wrong ({wrong !== null ? `-${wrong * 10}` : 0})</div>
            </div>
            <div className="glass p-4 text-center">
              <Bolt className="mx-auto h-6 w-6 text-[#f59e0b]" />
              <div className="mt-2 text-2xl font-bold text-[#f59e0b]">
                {fastAnswers > 0 ? `+${fastAnswers * 20}` : "0"}
              </div>
              <div className="text-xs text-white/50">Fast Bonus ({fastAnswers}×&lt;5s)</div>
            </div>
          </div>

          {allFastBonus && (
            <div className="mt-3 rounded-lg border border-[#22c55e]/30 bg-[#22c55e]/10 p-3 text-center text-sm font-semibold text-[#22c55e]">
              All 10 questions answered in under 30s! +30 bonus
            </div>
          )}

          {totalTime !== null && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-white/50">
              <Timer className="h-4 w-4" />
              Completed in {totalTime.toFixed(1)}s
            </div>
          )}

          <div className="mt-4 glass p-3 text-center text-xs text-white/40">
            Correct +100 | Wrong -10 | Fast (&lt;5s) +20 | All &lt;30s +30
          </div>

          {existingSubmission && (
            <p className="mt-3 text-xs text-white/50">Submitted at {formatIST(existingSubmission.submitted_at)}</p>
          )}
          <p className="mt-2 text-xs text-white/40">This challenge is now locked for your team.</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <Zap className="mx-auto h-8 w-8 text-white/40" />
        <h1 className="text-3xl font-semibold text-white">Non-Tech Event 4: Speed Quiz</h1>
        <p className="text-white/60">Challenge is loading...</p>
      </div>
    );
  }

  const answeredCount = Object.values(answers).filter((a) => a).length;
  const q = questions[currentQ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-white/50">Non-Tech · Event 4 · Challenge</div>
        <h1 className="mt-2 text-3xl font-semibold text-white">Speed Quiz</h1>
        <p className="mt-1 text-sm text-white/60">
          Answer {questions.length} questions as fast as you can. Speed matters!
        </p>
      </div>

      {/* Timer + Progress */}
      <div className="glass p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className={`h-5 w-5 ${timeLeft <= 10 ? "text-[#ef4444]" : "text-[#3b82f6]"}`} />
            <span className={`font-mono text-2xl font-bold ${timeLeft <= 10 ? "text-[#ef4444]" : "text-white"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/60">{answeredCount}/{questions.length} answered</span>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${timeLeft <= 10 ? "bg-[#ef4444]" : "bg-[#3b82f6]"}`}
            style={{ width: `${(timeLeft / timeLimit) * 100}%` }}
          />
        </div>
      </div>

      {/* Start Screen */}
      {!quizStarted && (
        <div className="glass-strong p-8 text-center">
          <Zap className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-4 text-xl font-bold text-white">Ready to Start?</h2>
          <p className="mt-2 text-sm text-white/60">
            You have <span className="font-bold text-white">{formatTime(timeLimit)}</span> to answer {questions.length} questions.
          </p>
          <div className="mt-4 mx-auto max-w-xs space-y-2 text-left text-sm">
            <div className="flex items-center gap-2 text-[#22c55e]">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Correct = +100 pts
            </div>
            <div className="flex items-center gap-2 text-[#ef4444]">
              <XCircle className="h-4 w-4 shrink-0" /> Wrong = -10 pts
            </div>
            <div className="flex items-center gap-2 text-[#f59e0b]">
              <Bolt className="h-4 w-4 shrink-0" /> Answered in &lt;5s = +20 bonus
            </div>
            <div className="flex items-center gap-2 text-[#3b82f6]">
              <Timer className="h-4 w-4 shrink-0" /> All 10 in &lt;30s = +30 bonus
            </div>
          </div>
          <button
            onClick={() => {
              setTimeLeft(timeLimit);
              setQuizStartTime(Date.now());
              setQuizStarted(true);
            }}
            className="mt-6 rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Start Quiz
          </button>
        </div>
      )}

      {/* Question Card */}
      {quizStarted && (
        <>
          <div className="flex flex-wrap gap-2">
            {questions.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  i === currentQ
                    ? "bg-primary text-primary-foreground"
                    : answers[i]
                    ? "bg-[#22c55e]/20 text-[#22c55e]"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="glass p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">
                {currentQ + 1}
              </span>
              <div className="flex-1">
                <p className="text-base font-medium text-white">{q.q}</p>
                <div className="mt-4 space-y-3">
                  {q.options.map((opt: string, j: number) => {
                    const letter = String.fromCharCode(65 + j);
                    const selected = answers[currentQ] === letter;
                    return (
                      <button
                        key={j}
                        onClick={() => recordAnswer(currentQ, letter)}
                        className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                          selected
                            ? "border-primary bg-primary/10 text-white"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            selected ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/50"
                          }`}
                        >
                          {letter}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              disabled={currentQ === 0}
              onClick={() => setCurrentQ((c) => c - 1)}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/15 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <span className="text-xs text-white/40">
              Question {currentQ + 1} of {questions.length}
            </span>
            {currentQ < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQ((c) => c + 1)}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/15"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={answeredCount < questions.length}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> Submit
              </button>
            )}
          </div>
        </>
      )}

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass-strong mx-4 max-w-sm p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-[#f97316]" />
            <h3 className="mt-3 text-lg font-bold text-white">Submit Quiz?</h3>
            <p className="mt-2 text-sm text-white/60">
              You have answered {answeredCount}/{questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block mt-1 text-[#f97316]">
                  {questions.length - answeredCount} unanswered = -{(questions.length - answeredCount) * 10} pts
                </span>
              )}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/15"
              >
                Go Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={grade.isPending}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                {grade.isPending ? "Submitting..." : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {err && (
        <div className="flex items-center gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5 p-3 text-sm text-[#ef4444]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {err}
        </div>
      )}
    </div>
  );
}
