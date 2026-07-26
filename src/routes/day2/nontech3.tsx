import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { day2GetEvent, day2GetSubmissions, day2SubmitAnswer } from "@/lib/api.day2";
import { countdown, formatIST } from "@/lib/format";
import { CheckCircle2, Lock, Sparkles, Play, AlertTriangle, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/day2/nontech3")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Non-Tech Event 3: Brand Battle — Vibeathon" },
      { name: "description", content: "Create social media content about NxtGenSec and Vibeathon 6.0." },
    ],
  }),
  component: NonTechEvent3,
});

function getTeam() {
  try {
    return JSON.parse(localStorage.getItem("day2_team") || "{}");
  } catch {
    return {};
  }
}

function isValidUrl(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function NonTechEvent3() {
  const team = getTeam();
  const getEventFn = useServerFn(day2GetEvent);
  const getSubsFn = useServerFn(day2GetSubmissions);
  const submitFn = useServerFn(day2SubmitAnswer);

  const [videoUrl, setVideoUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: event } = useQuery({
    queryKey: ["day2-event", "nontech", 3],
    queryFn: () => getEventFn({ data: { track: "nontech", slot: 3 } }),
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
          answer: videoUrl.trim(),
        },
      });
    },
    onSuccess: () => {
      setSubmitted(true);
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
        <h1 className="text-3xl font-semibold text-white">Non-Tech Event 3: Brand Battle</h1>
        <p className="text-white/60">Not yet open</p>
        <div className="font-mono text-4xl text-primary">{countdown(event.start_at)}</div>
        <p className="text-xs text-white/40">Opens at {formatIST(event.start_at)}</p>
      </div>
    );
  }

  if (existingSubmission || submitted) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="glass p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-[#22c55e]" />
            <h1 className="text-2xl font-semibold text-white">Submission Successful!</h1>
          </div>

          <div className="mt-4 rounded-lg border border-[#22c55e]/20 bg-[#22c55e]/5 p-4">
            <p className="text-sm text-[#22c55e] font-medium">
              Your submission is successful! Our team will validate and update you soon.
            </p>
            {existingSubmission?.answer && (
              <a
                href={existingSubmission.answer}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
              >
                <ExternalLink className="h-3 w-3" /> View your submission
              </a>
            )}
            {existingSubmission && (
              <p className="mt-2 text-xs text-white/50">
                Submitted at {formatIST(existingSubmission.submitted_at)}
              </p>
            )}
          </div>

          <div className="mt-4 text-xs text-white/40">
            This challenge is now locked for your team. You cannot submit again.
          </div>
        </div>
      </div>
    );
  }

  function handleSubmit() {
    setErr(null);
    if (!videoUrl.trim()) {
      setErr("Please paste your video URL.");
      return;
    }
    if (!isValidUrl(videoUrl.trim())) {
      setErr("Please enter a valid URL (https://...).");
      return;
    }
    submit.mutate();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-white/50">Non-Tech · Event 3 · Marketing Challenge</div>
        <h1 className="mt-2 text-3xl font-semibold text-white">Brand Battle: Show Your Marketing Skills</h1>
        <p className="mt-1 text-sm text-white/60">
          Create a video about NxtGenSec and Vibeathon 6.0. Most likes wins!
        </p>
      </div>

      <div className="glass p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold text-white">Marketing Challenge — Show Us What You've Got!</span>
        </div>

        <div className="space-y-4 text-sm text-white/70">
          <p>
            At <strong className="text-white">NxtGenSec (Next Generation Security)</strong>, we're a small team with big ambitions.
            Right now, we're looking for creative, passionate, and professional marketers who can help us grow.
          </p>
          <p>Think you've got what it takes? Here's your chance to prove it.</p>

          <div className="rounded-lg border border-[#3b82f6]/20 bg-[#3b82f6]/5 p-4">
            <p className="text-xs uppercase tracking-widest text-[#3b82f6] mb-2">Challenge</p>
            <p>
              Create an engaging Instagram Reel, YouTube Short, or Facebook Reel about:
            </p>
            <ul className="mt-2 space-y-1">
              <li>• NxtGenSec</li>
              <li>• Your Vibeathon 6.0 journey and participation</li>
            </ul>
            <p className="mt-2">
              Share it on your social media and inspire others to know more about NxtGenSec and Vibeathon 6.0.
            </p>
          </div>

          <div className="rounded-lg border border-[#f97316]/20 bg-[#f97316]/5 p-4">
            <p className="text-xs uppercase tracking-widest text-[#f97316] mb-2">Requirements</p>
            <ul className="space-y-1 text-white/70">
              <li>• Minimum video length: <strong className="text-white">30 seconds</strong></li>
              <li>• Content must be original</li>
              <li>• Mention or tag <strong className="text-white">@NxtGenSec</strong> wherever applicable</li>
              <li>• Use official hashtags: <strong className="text-white">#Vibeathon6 #NxtGenSec</strong></li>
              <li>• Maintain professional and positive content</li>
            </ul>
          </div>

          <div className="rounded-lg border border-[#22c55e]/20 bg-[#22c55e]/5 p-4">
            <p className="text-xs uppercase tracking-widest text-[#22c55e] mb-2">How to Win</p>
            <p>
              The participant whose reel receives the <strong className="text-white">highest genuine engagement</strong> (likes, reach, and overall impact)
              will be declared the winner.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-widest text-white/50 mb-2">Rewards</p>
            <ul className="space-y-1 text-white/70">
              <li>🌟 Official Marketing Challenge Winner Certificate</li>
              <li>💼 An opportunity to join the Marketing Team at NxtGenSec</li>
              <li>🚀 A chance to work with the team behind one of India's growing cybersecurity and SaaS communities</li>
              <li>📢 Featured across NxtGenSec's official social media platforms</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="glass p-6">
        <div className="text-xs uppercase tracking-widest text-white/50 mb-3">Your Submission</div>
        <p className="text-sm text-white/60 mb-4">
          Paste the URL of your Instagram Reel, YouTube Short, or Facebook Reel.
        </p>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
            <Play className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-primary"
            />
          </div>
        </div>

        {videoUrl.trim() && isValidUrl(videoUrl.trim()) && (
          <a
            href={videoUrl.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> Preview your link
          </a>
        )}

        {err && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5 p-3 text-sm text-[#ef4444]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {err}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-white/50 flex items-center gap-1">
            <Lock className="h-3 w-3" />
            One submission only. Event locks after submitting.
          </div>
          <button
            disabled={!videoUrl.trim() || submit.isPending}
            onClick={handleSubmit}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
          >
            {submit.isPending ? "Submitting..." : "Submit Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}
