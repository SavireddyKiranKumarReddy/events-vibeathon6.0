import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useMemo } from "react";
import {
  day2GetEvent,
  day2GetOsintProgress,
  day2GetOsintQuestions,
  day2SubmitOsintAnswer,
  day2SkipOsintQuestion,
} from "@/lib/api.day2";
import { countdown } from "@/lib/format";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Lock,
  AlertTriangle,
  Eye,
  SkipForward,
  ChevronRight,
  Trophy,
} from "lucide-react";

export const Route = createFileRoute("/day2/tech4")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "OSINT Challenge \u2014 Vibeathon" },
      { name: "description", content: "NxtGenSec OSINT multi-level challenge." },
    ],
  }),
  component: Tech4Page,
});

const LEVEL_COLORS: Record<string, { badge: string; ring: string }> = {
  green: { badge: "bg-green-500/20 text-green-400 border-green-500/30", ring: "ring-green-500/40" },
  yellow: { badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", ring: "ring-yellow-500/40" },
  orange: { badge: "bg-orange-500/20 text-orange-400 border-orange-500/30", ring: "ring-orange-500/40" },
  blue: { badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", ring: "ring-blue-500/40" },
  purple: { badge: "bg-purple-500/20 text-purple-400 border-purple-500/30", ring: "ring-purple-500/40" },
  red: { badge: "bg-red-500/20 text-red-400 border-red-500/30", ring: "ring-red-500/40" },
};

type FlatQ = {
  index: number;
  q: string;
  level: number;
  levelName: string;
  levelColor: string;
  isIntel: boolean;
  intelFile?: string;
};

function Tech4Page() {
  const raw = JSON.parse(localStorage.getItem("day2_team") || "{}") as Record<string, string>;
  const teamName = raw.teamName ?? "";
  const leadName = raw.leadName ?? "";

  const [answer, setAnswer] = useState("");
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [levelIntroDismissed, setLevelIntroDismissed] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!teamName || !leadName) {
      window.location.href = "/";
    }
  }, []);

  const getEventFn = useServerFn(day2GetEvent);
  const getQuestionsFn = useServerFn(day2GetOsintQuestions);
  const getProgressFn = useServerFn(day2GetOsintProgress);
  const submitFn = useServerFn(day2SubmitOsintAnswer);
  const skipFn = useServerFn(day2SkipOsintQuestion);

  const { data: event } = useQuery({
    queryKey: ["day2-event-tech4"],
    queryFn: () => getEventFn({ data: { track: "tech", slot: 4 } }),
  });

  const { data: questions } = useQuery({
    queryKey: ["day2-osint-questions"],
    queryFn: () => getQuestionsFn(),
  });

  const { data: rawProgress, refetch: refetchProgress } = useQuery({
    queryKey: ["day2-osint-progress", teamName, leadName],
    queryFn: () => getProgressFn({ data: { teamName, leadName } }),
    enabled: !!teamName && !!leadName,
  });
  const progress = rawProgress as any as {
    answers?: any[];
    completed?: boolean;
    skips_remaining?: number;
    total_correct?: number;
    total_skipped?: number;
  } | null;

  const flatQuestions = useMemo<FlatQ[]>(() => {
    if (!questions) return [];
    const list: FlatQ[] = [];
    let idx = 0;
    for (const level of questions.levels) {
      for (const q of level.questions) {
        list.push({
          index: idx,
          q: q.q,
          level: level.level,
          levelName: level.name,
          levelColor: level.color,
          isIntel: false,
        });
        idx++;
      }
    }
    for (const intel of questions.intelFiles) {
      list.push({
        index: idx,
        q: intel.q,
        level: -1,
        levelName: "Intel Extraction",
        levelColor: "red",
        isIntel: true,
        intelFile: intel.file,
      });
      idx++;
    }
    return list;
  }, [questions]);

  const currentIndex = useMemo(() => {
    if (!progress?.answers) return 0;
    const done = new Set((progress.answers as any[]).map((a: any) => a.index));
    for (let i = 0; i < flatQuestions.length; i++) {
      if (!done.has(i)) return i;
    }
    return flatQuestions.length;
  }, [progress, flatQuestions]);

  const totalQuestions = flatQuestions.length;
  const isComplete =
    totalQuestions === 0 || !!progress?.completed || currentIndex >= totalQuestions;
  const currentQ = flatQuestions[currentIndex];
  const skipsRemaining = progress?.skips_remaining ?? questions?.skipChances ?? 3;
  const totalCorrect = progress?.total_correct ?? 0;
  const totalSkipped = progress?.total_skipped ?? 0;
  const answeredCount = (progress?.answers as any[])?.length ?? 0;

  const isFirstInLevel =
    !!currentQ &&
    !currentQ.isIntel &&
    (currentIndex === 0 || flatQuestions[currentIndex - 1]?.level !== currentQ.level);

  const showLevelIntro = !levelIntroDismissed && isFirstInLevel && !isComplete;

  useEffect(() => {
    if (!currentQ) return;
    if (currentQ.isIntel) {
      setLevelIntroDismissed(true);
      return;
    }
    setLevelIntroDismissed(!isFirstInLevel);
  }, [currentQ, isFirstInLevel]);

  const submit = useMutation({
    mutationFn: (ans: string) =>
      submitFn({ data: { teamName, leadName, questionIndex: currentIndex, answer: ans } }),
    onSuccess: (result: any) => {
      setAnswer("");
      if (result.correct) {
        setFlash("correct");
        setTimeout(() => {
          setFlash(null);
          refetchProgress();
        }, 1500);
      } else {
        setFlash("wrong");
        setTimeout(() => setFlash(null), 1500);
      }
    },
    onError: () => {
      setFlash("wrong");
      setTimeout(() => setFlash(null), 1500);
    },
  });

  const skip = useMutation({
    mutationFn: () =>
      skipFn({ data: { teamName, leadName, questionIndex: currentIndex } }),
    onSuccess: () => {
      setShowSkipConfirm(false);
      setAnswer("");
      refetchProgress();
    },
    onError: () => {
      setShowSkipConfirm(false);
    },
  });

  if (!teamName || !leadName) return null;

  if (!event || !questions) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white/60">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-primary" />
          Loading challenge...
        </div>
      </div>
    );
  }

  const now = Date.now();
  const eventStart = new Date(event.start_at).getTime();
  const eventEnd = event.end_at ? new Date(event.end_at).getTime() : null;
  const started = now >= eventStart;
  const isLocked = !!event.manual_lock || (!!eventEnd && now >= eventEnd);

  if (!started) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] p-4 text-center text-white">
        <Lock className="mb-6 h-12 w-12 text-white/30" />
        <h1 className="text-4xl font-bold">NxtGenSec OSINT Challenge</h1>
        <p className="mt-3 text-white/50">This challenge has not started yet.</p>
        <div className="mt-6 font-mono text-5xl text-primary">{countdown(event.start_at)}</div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] p-4 text-center text-white">
        <Lock className="mb-6 h-12 w-12 text-white/30" />
        <h1 className="text-4xl font-bold">Challenge Closed</h1>
        <p className="mt-3 text-white/50">This event has ended.</p>
      </div>
    );
  }

  if (isComplete) {
    const skippedAnswers = ((progress?.answers as any[]) ?? []).filter(
      (a: any) => a.skipped,
    );
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] p-4">
        <div className="glass mx-auto w-full max-w-lg p-8 text-center">
          <Trophy className="mx-auto mb-4 h-16 w-16 text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">Challenge Complete!</h1>
          <p className="mt-2 text-sm text-white/50">{teamName}</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-white/5 p-4">
              <div className="text-xs text-white/40">Correct</div>
              <div className="mt-1 text-2xl font-bold text-green-400">{totalCorrect}</div>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <div className="text-xs text-white/40">Skipped</div>
              <div className="mt-1 text-2xl font-bold text-yellow-400">{totalSkipped}</div>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <div className="text-xs text-white/40">Total</div>
              <div className="mt-1 text-2xl font-bold text-white">{totalQuestions}</div>
            </div>
          </div>
          {skippedAnswers.length > 0 && (
            <div className="mt-6 text-left">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                Skipped Questions
              </h3>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {skippedAnswers.map((a: any, i: number) => {
                  const q = flatQuestions[a.index];
                  const text = q?.q ?? "Unknown";
                  return (
                    <div key={i} className="rounded bg-white/5 px-3 py-2 text-xs text-white/50">
                      <span className="text-white/30">Q{a.index + 1}</span>{" "}
                      {text.length > 100 ? text.slice(0, 100) + "..." : text}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <p className="mt-6 text-sm text-white/40">
            Your results have been recorded. Good luck!
          </p>
        </div>
      </div>
    );
  }

  if (showLevelIntro && currentQ) {
    const style = LEVEL_COLORS[currentQ.levelColor] ?? LEVEL_COLORS.blue;
    const levelQCount = flatQuestions.filter(
      (q) => q.level === currentQ.level && !q.isIntel,
    ).length;
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] p-4">
        <div className="glass mx-auto w-full max-w-md p-8 text-center">
          <div
            className={`mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${style.badge}`}
          >
            {currentQ.isIntel ? <Eye className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            {currentQ.isIntel ? "Intel Phase" : `Level ${currentQ.level + 1}`}
          </div>
          <h1 className="text-2xl font-bold text-white">{currentQ.levelName}</h1>
          <p className="mt-2 text-sm text-white/50">
            {currentQ.isIntel
              ? "Answer intel file extraction questions"
              : `${levelQCount} question${levelQCount !== 1 ? "s" : ""} in this level`}
          </p>
          <button
            onClick={() => setLevelIntroDismissed(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >
            Begin <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center justify-between text-xs text-white/50">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-semibold text-white/80">NxtGenSec OSINT</span>
            </div>
            <span>
              Question {currentIndex + 1} of {totalQuestions}
            </span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{
                width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-green-400">
                <CheckCircle2 className="mr-1 inline h-3 w-3" />
                {totalCorrect}
              </span>
              <span className="text-yellow-400">
                <SkipForward className="mr-1 inline h-3 w-3" />
                {totalSkipped}
              </span>
              <span className="text-white/40">
                {skipsRemaining} skip{skipsRemaining !== 1 ? "s" : ""} left
              </span>
            </div>
            {currentQ && (
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                  LEVEL_COLORS[currentQ.levelColor]?.badge ?? LEVEL_COLORS.blue.badge
                }`}
              >
                {currentQ.levelName}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {currentQ && (
          <div
            className={`glass p-6 transition-all duration-300 ${
              flash === "correct"
                ? "ring-2 ring-green-500/50 bg-green-500/5"
                : flash === "wrong"
                  ? "ring-2 ring-red-500/50 bg-red-500/5"
                  : ""
            }`}
          >
            {currentQ.isIntel && currentQ.intelFile && (
              <div className="mb-4 rounded-md border border-white/10 bg-white/5 p-3">
                <div className="mb-1 flex items-center gap-2 text-xs text-white/50">
                  <Eye className="h-3.5 w-3.5" />
                  Intel File
                </div>
                <div className="font-mono text-sm text-primary">{currentQ.intelFile}</div>
              </div>
            )}

            <div className="whitespace-pre-wrap text-lg leading-relaxed text-white/90">
              {currentQ.q}
            </div>

            <div className="mt-6">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && answer.trim() && !submit.isPending && !flash) {
                    submit.mutate(answer.trim());
                  }
                }}
                disabled={submit.isPending || flash === "correct"}
                className="w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-white/20 outline-none transition-colors focus:border-primary"
                placeholder="Enter your answer..."
                autoFocus
              />
            </div>

            {flash === "wrong" && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-400">
                <XCircle className="h-4 w-4" />
                Incorrect. Try again.
              </div>
            )}

            {flash === "correct" && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Correct! Advancing...
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() => setShowSkipConfirm(true)}
                disabled={skipsRemaining <= 0 || skip.isPending || !!flash}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Skip ({skipsRemaining} remaining)
              </button>

              <button
                onClick={() => submit.mutate(answer.trim())}
                disabled={!answer.trim() || submit.isPending || flash === "correct"}
                className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submit.isPending ? "Checking..." : "Submit"}
              </button>
            </div>
          </div>
        )}

        {!currentQ && !isComplete && (
          <div className="glass p-8 text-center text-white/50">Loading question...</div>
        )}
      </div>

      {showSkipConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass mx-auto w-full max-w-sm p-6">
            <div className="mb-3 flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Skip Question?</span>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              There might be more complex questions ahead. Do you feel this is complex and
              you want to skip?
            </p>
            <div className="mt-3 text-xs text-white/40">
              Skips remaining after this: {Math.max(0, skipsRemaining - 1)}
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => skip.mutate()}
                disabled={skip.isPending}
                className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-500/20 disabled:opacity-50"
              >
                {skip.isPending ? "Skipping..." : "Skip Question"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
