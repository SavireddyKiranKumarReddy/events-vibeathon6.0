import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { submitFinalProject } from "@/lib/api.submission";
import {
  Send,
  CheckCircle2,
  XCircle,
  Github,
  Globe,
  Users,
  FileText,
  Sparkles,
  AlertTriangle,
  Info,
} from "lucide-react";

export const Route = createFileRoute("/submission")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Final Submission — Vibeathon 6.0" },
      { name: "description", content: "Submit your final Vibeathon 6.0 project." },
    ],
  }),
  component: SubmissionPage,
});

function SubmissionPage() {
  const submitFn = useServerFn(submitFinalProject);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    teamLeadName: "",
    teamLeadContact: "",
    teamLeadEmail: "",
    certificateName: "",
    teammate1: "",
    teammate2: "",
    teammate3: "",
    githubUrl: "",
    deploymentUrl: "",
    phasesCompleted: 0,
    projectSummary: "",
    projectUniqueness: "",
  });

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const submit = useMutation({
    mutationFn: () => submitFn({ data: form }),
    onSuccess: () => {
      setSubmitted(true);
      setError("");
    },
    onError: (e: any) => {
      setError(e.message || "Submission failed. Please try again.");
    },
  });

  const canSubmit =
    form.teamLeadName.trim() &&
    form.teamLeadContact.trim() &&
    form.teamLeadEmail.trim() &&
    form.certificateName.trim() &&
    form.githubUrl.trim() &&
    form.deploymentUrl.trim() &&
    form.projectSummary.trim() &&
    form.projectUniqueness.trim();

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] p-4">
        <div className="glass mx-auto w-full max-w-lg p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-400" />
          <h1 className="text-3xl font-bold text-white">Submitted!</h1>
          <p className="mt-3 text-white/60">
            Your final project submission has been recorded. Good luck!
          </p>
          <p className="mt-2 text-sm text-white/40">
            {form.certificateName} — {form.teamLeadName}
          </p>
        </div>
      </div>
    );
  }

  const input =
    "w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-white/20 outline-none transition-colors focus:border-primary text-sm";
  const label = "block text-sm font-medium text-white/70 mb-1.5";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Vibeathon 6.0</h1>
          <p className="mt-1 text-lg text-white/60">Final Project Submission</p>
        </div>

        {/* Instructions */}
        <div className="glass mb-8 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Info className="h-5 w-5 text-primary" />
            Instructions
          </h2>
          <ol className="space-y-3 text-sm text-white/60">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 font-semibold text-primary">1.</span>
              <span>
                Must submit a <strong className="text-white/80">proper public GitHub link</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 font-semibold text-primary">2.</span>
              <span>
                Must include a <strong className="text-white/80">proper README</strong> with team name, teammate roles, and key info. If anything is not working as expected, mark it as <strong className="text-yellow-400">beta</strong>. If evaluators find a mismatch, your points will be affected.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 font-semibold text-primary">3.</span>
              <span>
                Must submit a <strong className="text-white/80">public deployment link</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 font-semibold text-primary">4.</span>
              <span>
                Make sure all mentioned features are working. If any doesn't work as expected, mark as <strong className="text-yellow-400">beta</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 font-semibold text-primary">5.</span>
              <span>
                Use the provided <strong className="text-white/80">PPT template</strong> accordingly.
              </span>
            </li>
          </ol>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit && !submit.isPending) submit.mutate();
          }}
          className="space-y-8"
        >
          {/* Team Lead Info */}
          <div className="glass p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Users className="h-5 w-5 text-primary" />
              Team Lead Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className={label}>Team Lead Name *</label>
                <input
                  type="text"
                  className={input}
                  placeholder="Full name"
                  value={form.teamLeadName}
                  onChange={(e) => update("teamLeadName", e.target.value)}
                />
              </div>
              <div>
                <label className={label}>Contact Number *</label>
                <input
                  type="tel"
                  className={input}
                  placeholder="+91 XXXXX XXXXX"
                  value={form.teamLeadContact}
                  onChange={(e) => update("teamLeadContact", e.target.value)}
                />
              </div>
              <div>
                <label className={label}>Personal Email *</label>
                <input
                  type="email"
                  className={input}
                  placeholder="you@example.com"
                  value={form.teamLeadEmail}
                  onChange={(e) => update("teamLeadEmail", e.target.value)}
                />
              </div>
              <div>
                <label className={label}>
                  Name for Certificate *{" "}
                  <span className="text-xs text-white/40">(as it should appear)</span>
                </label>
                <input
                  type="text"
                  className={input}
                  placeholder="Name on certificate"
                  value={form.certificateName}
                  onChange={(e) => update("certificateName", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Teammates */}
          <div className="glass p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Users className="h-5 w-5 text-primary" />
              Teammates <span className="text-sm font-normal text-white/40">(optional)</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className={label}>Teammate 1</label>
                <input
                  type="text"
                  className={input}
                  placeholder="Name"
                  value={form.teammate1}
                  onChange={(e) => update("teammate1", e.target.value)}
                />
              </div>
              <div>
                <label className={label}>Teammate 2</label>
                <input
                  type="text"
                  className={input}
                  placeholder="Name"
                  value={form.teammate2}
                  onChange={(e) => update("teammate2", e.target.value)}
                />
              </div>
              <div>
                <label className={label}>Teammate 3</label>
                <input
                  type="text"
                  className={input}
                  placeholder="Name"
                  value={form.teammate3}
                  onChange={(e) => update("teammate3", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="glass p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Github className="h-5 w-5 text-primary" />
              Project Links
            </h2>
            <div className="space-y-4">
              <div>
                <label className={label}>Public GitHub URL *</label>
                <input
                  type="url"
                  className={input}
                  placeholder="https://github.com/..."
                  value={form.githubUrl}
                  onChange={(e) => update("githubUrl", e.target.value)}
                />
              </div>
              <div>
                <label className={label}>Public Deployment URL *</label>
                <input
                  type="url"
                  className={input}
                  placeholder="https://your-project.vercel.app"
                  value={form.deploymentUrl}
                  onChange={(e) => update("deploymentUrl", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Phases */}
          <div className="glass p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="h-5 w-5 text-primary" />
              Phases Completed
            </h2>
            <p className="mb-3 text-xs text-white/40">
              How many phases of the given problem statement did you complete?
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={10}
                value={form.phasesCompleted}
                onChange={(e) => update("phasesCompleted", parseInt(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="min-w-[3ch] text-center text-2xl font-bold text-primary">
                {form.phasesCompleted}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-xs text-white/30">
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {/* Project Description */}
          <div className="glass p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <FileText className="h-5 w-5 text-primary" />
              Project Description
            </h2>
            <div className="space-y-4">
              <div>
                <label className={label}>
                  Explain your project shortly *{" "}
                  <span className="text-xs text-white/40">(max 3 sentences)</span>
                </label>
                <textarea
                  className={`${input} resize-none`}
                  rows={3}
                  maxLength={500}
                  placeholder="What does your project do?"
                  value={form.projectSummary}
                  onChange={(e) => update("projectSummary", e.target.value)}
                />
                <div className="mt-1 text-right text-xs text-white/30">
                  {form.projectSummary.length}/500
                </div>
              </div>
              <div>
                <label className={label}>
                  What's unique about your project? *{" "}
                  <span className="text-xs text-white/40">(max 3 sentences)</span>
                </label>
                <textarea
                  className={`${input} resize-none`}
                  rows={3}
                  maxLength={500}
                  placeholder="What makes your project stand out?"
                  value={form.projectUniqueness}
                  onChange={(e) => update("projectUniqueness", e.target.value)}
                />
                <div className="mt-1 text-right text-xs text-white/30">
                  {form.projectUniqueness.length}/500
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-md border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-400/70">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Make sure all details are correct. If evaluators find a mismatch between your submission and actual project, your points will be affected.
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || submit.isPending}
            className="w-full rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submit.isPending ? "Submitting..." : "Submit Final Project"}
          </button>
        </form>
      </div>
    </div>
  );
}
