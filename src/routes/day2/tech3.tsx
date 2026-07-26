import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { day2GetEvent, day2GetSubmissions, day2SubmitAnswer } from "@/lib/api.day2";
import { countdown, formatIST } from "@/lib/format";
import { Lock, Search, Shield, CheckCircle2, AlertTriangle, Terminal } from "lucide-react";

export const Route = createFileRoute("/day2/tech3")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tech Event 3: Scenario Challenge — Vibeathon" },
      { name: "description", content: "Find the hidden credentials left by a developer. CTF-style challenge." },
    ],
  }),
  component: TechEvent3,
});

function getTeam() {
  try {
    return JSON.parse(localStorage.getItem("day2_team") || "{}");
  } catch {
    return {};
  }
}

function TechEvent3() {
  const team = getTeam();
  const getEventFn = useServerFn(day2GetEvent);
  const getSubsFn = useServerFn(day2GetSubmissions);
  const submitFn = useServerFn(day2SubmitAnswer);

  const [flag, setFlag] = useState("");
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: event } = useQuery({
    queryKey: ["day2-event", "tech", 3],
    queryFn: () => getEventFn({ data: { track: "tech", slot: 3 } }),
    refetchInterval: 15000,
  });

  const { data: submissions } = useQuery({
    queryKey: ["day2-subs", team.teamName, team.leadName],
    queryFn: () =>
      getSubsFn({ data: { teamName: team.teamName, leadName: team.leadName } }),
    enabled: !!team.teamName,
  });

  const existingSubmission = submissions?.find((s: any) => s.event_id === event?.id);

  const submit = useMutation({
    mutationFn: async () => {
      return submitFn({
        data: {
          teamName: team.teamName,
          leadName: team.leadName,
          eventId: event!.id,
          answer: flag,
        },
      });
    },
    onSuccess: (res: any) => {
      setResult(res.autoCorrect ? "correct" : "incorrect");
    },
    onError: () => {
      setResult("incorrect");
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
        <h1 className="text-3xl font-semibold text-white">Tech Event 3: Scenario Challenge</h1>
        <p className="text-white/60">Not yet open</p>
        <div className="font-mono text-4xl text-primary">{countdown(event.start_at)}</div>
        <p className="text-xs text-white/40">Opens at {formatIST(event.start_at)}</p>
      </div>
    );
  }

  if (existingSubmission || result) {
    const isCorrect = result === "correct" || existingSubmission?.auto_correct;
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="glass p-6">
          <div className="flex items-center gap-3">
            {isCorrect ? (
              <CheckCircle2 className="h-6 w-6 text-[#22c55e]" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-[#ef4444]" />
            )}
            <h1 className="text-2xl font-semibold text-white">
              {isCorrect ? "Challenge Completed!" : "Challenge Locked"}
            </h1>
          </div>

          <div className={`mt-4 rounded-lg border p-4 ${
            isCorrect
              ? "border-[#22c55e]/20 bg-[#22c55e]/5"
              : "border-[#ef4444]/20 bg-[#ef4444]/5"
          }`}>
            <p className={`text-sm font-medium ${isCorrect ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
              {isCorrect
                ? "Flag Submitted Successfully! Auto-graded: Correct"
                : "Auto-graded: Incorrect. This challenge is locked."}
            </p>
            {existingSubmission && (
              <p className="mt-2 text-xs text-white/50">
                Submitted at {formatIST(existingSubmission.submitted_at)}
              </p>
            )}
          </div>

          <div className="mt-4 text-xs text-white/40">
            You cannot re-access this challenge.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-white/50">Tech · Event 3 · Scenario Challenge</div>
        <h1 className="mt-2 text-3xl font-semibold text-white">Find the Hidden Credentials</h1>
        <p className="mt-1 text-sm text-white/60">
          A CTF-style challenge. Hunt for hidden admin credentials across the site.
        </p>
      </div>

      <div className="glass p-6">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="h-5 w-5 text-[#3b82f6]" />
          <span className="font-semibold text-white">Mission Briefing</span>
        </div>

        <div className="space-y-4 text-sm text-white/70">
          <p>
            A developer named <strong className="text-white">Arora</strong> built this website but made a critical mistake.
          </p>
          <p>
            He left admin credentials somewhere in the page source.
          </p>
          <p>
            Can you find them? Decode what you find. Then look for the hidden admin page.
          </p>

          <div className="rounded-lg border border-[#3b82f6]/20 bg-[#3b82f6]/5 p-4">
            <p className="text-xs uppercase tracking-widest text-[#3b82f6] mb-2">Hints</p>
            <ul className="space-y-2 text-white/70">
              <li className="flex items-start gap-2">
                <Search className="h-4 w-4 mt-0.5 text-[#3b82f6] shrink-0" />
                <span>Check the source code of different pages. Look for comments that seem out of place.</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 text-[#f97316] shrink-0" />
                <span>The credentials are encoded. You'll need to decode them.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="h-4 w-4 mt-0.5 text-[#22c55e] shrink-0" />
                <span>Once decoded, navigate to the hidden admin login page.</span>
              </li>
            </ul>
          </div>

          <p>Enter the credentials. The flag will be revealed.</p>
        </div>
      </div>

      <div className="glass p-6">
        <div className="text-xs uppercase tracking-widest text-white/50 mb-3">Submit Flag</div>

        <div className="flex gap-3">
          <input
            type="text"
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            placeholder="Enter the flag..."
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && flag.trim()) submit.mutate();
            }}
          />
          <button
            disabled={!flag.trim() || submit.isPending}
            onClick={() => submit.mutate()}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
          >
            {submit.isPending ? "Submitting..." : "Submit"}
          </button>
        </div>

        {result === "incorrect" && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5 p-3 text-sm text-[#ef4444]">
            <AlertTriangle className="h-4 w-4" />
            Auto-graded: Incorrect. This challenge is locked.
          </div>
        )}

        <div className="mt-3 text-xs text-white/40">
          One submission only. The challenge locks after submitting.
        </div>
      </div>
    </div>
  );
}
