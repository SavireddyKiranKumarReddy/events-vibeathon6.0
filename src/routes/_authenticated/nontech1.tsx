import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getEvent, submitAnswer } from "@/lib/api.functions";
import { GlassCard } from "@/components/AppShell";
import { countdown, formatIST } from "@/lib/format";
import { CheckCircle2, Lock, Timer, RotateCcw } from "lucide-react";

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
  const [time, setTime] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    mutationFn: (ans: string) => subFn({ data: { eventId: parsed!.event.id, answer: ans } }),
    onSuccess: () => { refetch(); },
  });

  useEffect(() => {
    setCards(initCards());
  }, []);

  useEffect(() => {
    if (gameStarted && !gameComplete) {
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameStarted, gameComplete]);

  useEffect(() => {
    if (gameComplete && parsed && !parsed.submission) {
      submit.mutate("solved");
    }
  }, [gameComplete]);

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
        setTimeout(() => {
          const matched = newCards.map((c, i) =>
            i === first || i === second ? { ...c, isMatched: true } : c,
          );
          setCards(matched);
          setFlipped([]);
          setIsChecking(false);
          const newPairs = matchedPairs + 1;
          setMatchedPairs(newPairs);
          if (newPairs >= EMOJIS.length) {
            setGameComplete(true);
          }
        }, 300);
      } else {
        setTimeout(() => {
          const reset = newCards.map((c, i) =>
            i === first || i === second ? { ...c, isFlipped: false } : c,
          );
          setCards(reset);
          setFlipped([]);
          setIsChecking(false);
        }, 900);
      }
    }
  }, [cards, flipped, isChecking, gameStarted, gameComplete, matchedPairs]);

  function resetGame() {
    setCards(initCards());
    setFlipped([]);
    setIsChecking(false);
    setTime(0);
    setGameStarted(false);
    setGameComplete(false);
    setMatchedPairs(0);
  }

  if (!parsed) return <div className="text-white/60">Loading…</div>;
  const { event: ev, open, started: evStarted, submission } = parsed;

  if (!evStarted) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 text-center">
        <Lock className="mx-auto h-8 w-8 text-white/40" />
        <h1 className="text-3xl font-semibold text-white">Non-Tech Event 1: Memory Match</h1>
        <p className="text-white/60">Not yet open</p>
        <div className="font-mono text-4xl text-primary">{countdown(ev.start_at)}</div>
      </div>
    );
  }

  if (submission) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4">
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
      <div className="mx-auto max-w-5xl space-y-6 px-4">
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

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-white/50">Non-Tech · Event 1 · Game</div>
        <h1 className="mt-2 text-3xl font-semibold text-white">Memory Match</h1>
        <p className="mt-1 text-sm text-white/60">
          Flip two cards at a time. If they match, they stay open. Match all {EMOJIS.length} pairs as fast as possible!
        </p>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              <span className="font-mono text-2xl font-bold text-primary">{formatTime(time)}</span>
            </div>
            <div className="text-sm text-white/50">
              {matchedPairs}/{EMOJIS.length} pairs
            </div>
          </div>
          {gameStarted && !gameComplete && (
            <button onClick={resetGame} className="rounded-md border border-white/10 p-2 text-white/40 hover:bg-white/5" title="Restart">
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          {gameComplete && (
            <div className="text-sm font-semibold text-primary">
              Completed in {formatTime(time)}!
            </div>
          )}
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(matchedPairs / EMOJIS.length) * 100}%` }}
          />
        </div>
      </GlassCard>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {cards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(i)}
            disabled={card.isMatched || card.isFlipped || isChecking || gameComplete}
            className={`flex aspect-square items-center justify-center rounded-lg border text-base font-bold transition-all duration-200 sm:text-xl md:text-2xl ${
              card.isMatched
                ? "border-primary/30 bg-primary/10 text-primary"
                : card.isFlipped
                  ? "border-white/20 bg-white/10 text-white"
                  : "cursor-pointer border-white/10 bg-white/5 text-transparent hover:border-white/20 hover:bg-white/10 active:scale-95"
            }`}
          >
            {card.isFlipped || card.isMatched ? card.emoji : "?"}
          </button>
        ))}
      </div>

      {gameComplete && (
        <GlassCard>
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
            <div className="mt-2 text-lg font-semibold text-white">All pairs matched!</div>
            <div className="mt-1 text-sm text-white/60">Your time: {formatTime(time)}</div>
            <p className="mt-3 text-xs text-white/50">Your result has been submitted automatically.</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
