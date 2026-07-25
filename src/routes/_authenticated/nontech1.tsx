import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getEvent, submitAnswer } from "@/lib/api.functions";
import { GlassCard } from "@/components/AppShell";
import { countdown, formatIST } from "@/lib/format";
import { CheckCircle2, Lock, Timer, RotateCcw, Trophy, X, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/nontech1")({
  head: () => ({
    meta: [
      { title: "Non-Tech Event 1: Memory Match — Vibeathon" },
      { name: "description", content: "Match all icon pairs as fast as you can!" },
    ],
  }),
  component: NonTechEvent1,
});

const EMOJIS = [
  "🍎", "🍊", "🍋", "🍇", "🍉", "🍓", "🫐", "🍑",
  "🥭", "🍍", "🥝", "🍅", "🍆", "🥑", "🌽", "🥕",
  "🌶️", "🍄", "🌰", "🍞", "🧀", "🥜", "🧅", "🍈",
];

const GRID_COLS = 7;
const TOTAL_CARDS = GRID_COLS * GRID_COLS;
const POINTS_PER_MATCH = 10;
const POINTS_PER_WRONG = -1;
const MAX_TIME = 180; // 3 minutes in seconds

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initCards(): Card[] {
  const pairs = shuffleArray([...EMOJIS, ...EMOJIS]);
  const cards: Card[] = pairs.map((emoji, i) => ({
    id: i,
    emoji,
    isFlipped: false,
    isMatched: false,
  }));
  while (cards.length < TOTAL_CARDS) {
    cards.push({ id: cards.length, emoji: "", isFlipped: true, isMatched: true });
  }
  return cards;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function NonTechEvent1() {
  const getFn = useServerFn(getEvent);
  const subFn = useServerFn(submitAnswer);
  const { data, refetch } = useQuery({
    queryKey: ["event", "nontech", 1],
    queryFn: () => getFn({ data: { track: "nontech", slot: 1 } }),
    refetchInterval: 15000,
  });

  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [correctMatches, setCorrectMatches] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSubmittedRef = useRef(false);

  const parsed = useMemo(() => {
    if (!data) return null;
    return {
      event: (data as any).event,
      open: (data as any).open,
      started: (data as any).started,
      submission: (data as any).submission,
    };
  }, [data]);

  const submit = useMutation({
    mutationFn: ({ answer, score }: { answer: string; score: number }) =>
      subFn({ data: { eventId: parsed!.event.id, answer, score } }),
    onSuccess: () => { refetch(); },
  });

  useEffect(() => {
    setCards(initCards());
  }, []);

  // Countdown timer
  useEffect(() => {
    if (gameStarted && !gameComplete) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            // Time's up — auto submit
            if (timerRef.current) clearInterval(timerRef.current);
            setGameComplete(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameStarted, gameComplete]);

  // Auto-submit on game complete (time up or all matched)
  useEffect(() => {
    if (gameComplete && parsed && !parsed.submission && !hasSubmittedRef.current) {
      hasSubmittedRef.current = true;
      submit.mutate({ answer: "solved", score });
    }
  }, [gameComplete, score, parsed]);

  const handleCardClick = useCallback((index: number) => {
    if (isChecking || flipped.includes(index) || cards[index].isMatched || cards[index].isFlipped || gameComplete) return;

    if (!gameStarted) setGameStarted(true);

    const newCards = cards.map((c, i) => (i === index ? { ...c, isFlipped: true } : c));
    const newFlipped = [...flipped, index];
    setCards(newCards);
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      const [first, second] = newFlipped;

      if (newCards[first].emoji === newCards[second].emoji) {
        // Correct match
        setTimeout(() => {
          const matched = newCards.map((c, i) =>
            i === first || i === second ? { ...c, isMatched: true } : c,
          );
          setCards(matched);
          setFlipped([]);
          setIsChecking(false);
          const newPairs = matchedPairs + 1;
          setMatchedPairs(newPairs);
          setCorrectMatches((c) => c + 1);
          setScore((s) => s + POINTS_PER_MATCH);
          if (newPairs >= EMOJIS.length) {
            setGameComplete(true);
          }
        }, 300);
      } else {
        // Wrong match
        setTimeout(() => {
          const reset = newCards.map((c, i) =>
            i === first || i === second ? { ...c, isFlipped: false } : c,
          );
          setCards(reset);
          setFlipped([]);
          setIsChecking(false);
          setWrongAttempts((w) => w + 1);
          setScore((s) => Math.max(0, s + POINTS_PER_WRONG));
        }, 900);
      }
    }
  }, [cards, flipped, isChecking, gameStarted, gameComplete, matchedPairs]);

  function resetGame() {
    if (timerRef.current) clearInterval(timerRef.current);
    setCards(initCards());
    setFlipped([]);
    setIsChecking(false);
    setTimeLeft(MAX_TIME);
    setGameStarted(false);
    setGameComplete(false);
    setMatchedPairs(0);
    setScore(0);
    setWrongAttempts(0);
    setCorrectMatches(0);
    hasSubmittedRef.current = false;
  }

  if (!parsed) return <div className="text-white/60">Loading…</div>;
  const { event: ev, open, started: evStarted, submission } = parsed;

  if (!evStarted) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 text-center">
        <Lock className="mx-auto h-8 w-8 text-white/40" />
        <h1 className="text-3xl font-semibold text-white">Non-Tech Event 1: Memory Match</h1>
        <p className="text-white/60">Not yet open</p>
        <div className="font-mono text-4xl text-primary">{countdown(ev.start_at)}</div>
      </div>
    );
  }

  if (submission) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        <GlassCard>
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Already Submitted</span>
          </div>
          <div className="mt-2 text-sm text-white/50">Submitted at {formatIST(submission.submitted_at)}</div>
          <p className="mt-3 text-xs text-white/50">Submissions are final.</p>
        </GlassCard>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        <GlassCard>
          <div className="text-center text-white/60">
            <Lock className="mx-auto h-6 w-6" />
            <div className="mt-3 font-semibold">This event is closed</div>
            <p className="mt-1 text-sm">You did not submit within the window.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  const timePercent = (timeLeft / MAX_TIME) * 100;
  const isLowTime = timeLeft <= 30;
  const isTimeUp = timeLeft === 0;
  const progressPercent = (matchedPairs / EMOJIS.length) * 100;

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-widest text-white/50">Non-Tech · Event 1 · Game</div>
        <h1 className="mt-1 text-2xl font-bold text-white">Memory Match</h1>
        <p className="mt-1 text-sm text-white/50">
          Match all {EMOJIS.length} pairs before time runs out. +{POINTS_PER_MATCH} per match, {POINTS_PER_WRONG} per miss.
        </p>
      </div>

      {/* Stats Bar */}
      <GlassCard>
        <div className="flex items-center justify-between">
          {/* Timer */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${isLowTime ? "bg-red-500/20" : "bg-primary/10"}`}>
              <Timer className={`h-4 w-4 ${isLowTime ? "text-red-400" : "text-primary"}`} />
              <span className={`font-mono text-xl font-bold ${isLowTime ? "text-red-400" : "text-primary"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <span className="text-xs text-white/30">/ {formatTime(MAX_TIME)}</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-xs text-white/40">
                <Trophy className="h-3 w-3" />
                Score
              </div>
              <div className="font-mono text-lg font-bold text-white">{score}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-xs text-white/40">
                <Zap className="h-3 w-3" />
                Match
              </div>
              <div className="font-mono text-lg font-bold text-green-400">{correctMatches}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-xs text-white/40">
                <X className="h-3 w-3" />
                Miss
              </div>
              <div className="font-mono text-lg font-bold text-red-400">{wrongAttempts}</div>
            </div>
          </div>

          {/* Restart */}
          {gameStarted && !gameComplete && (
            <button onClick={resetGame} className="rounded-md border border-white/10 p-2 text-white/40 hover:bg-white/5" title="Restart">
              <RotateCcw className="h-4 w-4" />
            </button>
          )}

          {gameComplete && (
            <div className="text-right">
              <div className="text-sm font-semibold text-primary">Done!</div>
            </div>
          )}
        </div>

        {/* Timer bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isLowTime ? "bg-red-500" : "bg-primary"}`}
            style={{ width: `${timePercent}%` }}
          />
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-green-500/60 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-1 text-right text-xs text-white/30">
          {matchedPairs}/{EMOJIS.length} pairs matched
        </div>
      </GlassCard>

      {/* Game Grid */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="grid grid-cols-7 gap-2">
          {cards.map((card, i) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(i)}
              disabled={card.isMatched || card.isFlipped || isChecking || gameComplete}
              className={`flex aspect-square items-center justify-center rounded-lg border text-xl font-bold transition-all duration-200 select-none ${
                card.isMatched
                  ? "border-primary/30 bg-primary/10 text-primary shadow-inner"
                  : card.isFlipped
                    ? "border-white/20 bg-white/10 text-white shadow-lg"
                    : "cursor-pointer border-white/10 bg-white/5 text-transparent hover:border-white/25 hover:bg-white/10 hover:shadow-md active:scale-95"
              }`}
            >
              {card.isFlipped || card.isMatched ? card.emoji : "?"}
            </button>
          ))}
        </div>
      </div>

      {/* Game Complete Card */}
      {gameComplete && (
        <GlassCard>
          <div className="text-center space-y-2">
            <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
            <div className="text-lg font-bold text-white">
              {matchedPairs >= EMOJIS.length ? "All pairs matched!" : "Time's up!"}
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-white/60">
              <span>Score: <strong className="text-white">{score}</strong></span>
              <span>Matches: <strong className="text-green-400">{correctMatches}</strong></span>
              <span>Misses: <strong className="text-red-400">{wrongAttempts}</strong></span>
              <span>Time: <strong className="text-primary">{formatTime(MAX_TIME - timeLeft)}</strong></span>
            </div>
            <p className="text-xs text-white/40">Your result has been submitted automatically.</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
