import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { submitFinalProject } from "@/lib/api.submission";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Github, Users, Upload, Info, AlertTriangle, Star, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/submission")({
  ssr: false,
  head: () => ({ meta: [{ title: "Final Submission — Vibeathon 6.0" }] }),
  component: SubmissionPage,
});

const inputCls = "w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-white/20 outline-none transition-colors focus:border-primary text-sm";
const labelCls = "block text-sm font-medium text-white/70 mb-1.5";

function SubmissionPage() {
  const submitFn = useServerFn(submitFinalProject);
  const pptRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [uploadingPpt, setUploadingPpt] = useState(false);
  const [uploadingFeedback, setUploadingFeedback] = useState(false);
  const [pptName, setPptName] = useState("");
  const [feedbackName, setFeedbackName] = useState("");
  const [form, setForm] = useState({
    teamLeadName: "", teamLeadContact: "", teamLeadEmail: "", certificateName: "",
    teammate1: "", teammate2: "", teammate3: "",
    githubUrl: "", deploymentUrl: "", pptUrl: "",
    phasesCompleted: 0,
    projectSummary: "", projectUniqueness: "",
    eventExperience: "", feedbackScreenshotUrl: "", videoLink: "",
  });

  const update = (f: string, v: string | number) => setForm(p => ({ ...p, [f]: v }));

  async function handlePpt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { setError("Only PDF files are accepted for PPT."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File size must be under 10MB."); return; }
    setUploadingPpt(true); setError(""); setPptName(file.name);
    const path = `ppt/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
    const { data, error: upErr } = await supabase.storage.from("event-submissions").upload(path, file, { contentType: "application/pdf" });
    if (upErr) { setError("Failed to upload PPT."); setUploadingPpt(false); return; }
    const { data: urlData } = supabase.storage.from("event-submissions").getPublicUrl(data.path);
    update("pptUrl", urlData.publicUrl);
    setUploadingPpt(false);
  }

  async function handleFeedback(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please upload an image file for the feedback screenshot."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Screenshot size must be under 5MB."); return; }
    setUploadingFeedback(true); setError(""); setFeedbackName(file.name);
    const ext = file.name.split(".").pop() || "png";
    const path = `feedback/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data, error: upErr } = await supabase.storage.from("event-submissions").upload(path, file, { contentType: file.type });
    if (upErr) { setError("Failed to upload screenshot."); setUploadingFeedback(false); return; }
    const { data: urlData } = supabase.storage.from("event-submissions").getPublicUrl(data.path);
    update("feedbackScreenshotUrl", urlData.publicUrl);
    setUploadingFeedback(false);
  }

  const submit = useMutation({
    mutationFn: () => submitFn({ data: form }),
    onSuccess: () => setSubmitted(true),
    onError: (e: any) => setError(e.message || "Submission failed."),
  });

  const canSubmit = form.teamLeadName && form.teamLeadContact && form.teamLeadEmail && form.certificateName
    && form.githubUrl && form.deploymentUrl && form.pptUrl && form.phasesCompleted > 0
    && form.projectSummary && form.projectUniqueness;

  if (submitted) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] p-4">
      <div className="glass mx-auto w-full max-w-lg p-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-400" />
        <h1 className="text-3xl font-bold text-white">Submitted!</h1>
        <p className="mt-3 text-white/60">Your final project submission has been recorded. Good luck!</p>
        <p className="mt-2 text-sm text-white/40">{form.certificateName} — {form.teamLeadName}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Vibeathon 6.0</h1>
          <p className="mt-1 text-lg text-white/60">Final Project Submission</p>
        </div>

        <div className="glass mb-8 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><Info className="h-5 w-5 text-primary" /> Instructions</h2>
          <ol className="space-y-3 text-sm text-white/60">
            <li><span className="font-semibold text-primary">1.</span> Must submit a <strong className="text-white/80">proper public GitHub link</strong>.</li>
            <li><span className="font-semibold text-primary">2.</span> Must include a <strong className="text-white/80">proper README</strong> with team name, teammate roles, and key info. Mark anything not working as <strong className="text-yellow-400">beta</strong>.</li>
            <li><span className="font-semibold text-primary">3.</span> Must submit a <strong className="text-white/80">public deployment link</strong>.</li>
            <li><span className="font-semibold text-primary">4.</span> Upload your <strong className="text-white/80">PPT as PDF</strong> (max 10MB).</li>
            <li><span className="font-semibold text-primary">5.</span> Please share your feedback and upload a screenshot of your Google review.</li>
          </ol>
        </div>

        {error && <div className="mb-6 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"><XCircle className="h-4 w-4 shrink-0" /> {error}</div>}

        <form onSubmit={e => { e.preventDefault(); if (canSubmit && !submit.isPending) submit.mutate(); }} className="space-y-8">

          <div className="glass p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><Users className="h-5 w-5 text-primary" /> Team Lead Information</h2>
            <div className="space-y-4">
              <div><label className={labelCls}>Team Lead Name *</label><input type="text" className={inputCls} placeholder="Full name" value={form.teamLeadName} onChange={e => update("teamLeadName", e.target.value)} /></div>
              <div><label className={labelCls}>Contact Number *</label><input type="tel" className={inputCls} placeholder="+91 XXXXX XXXXX" value={form.teamLeadContact} onChange={e => update("teamLeadContact", e.target.value)} /></div>
              <div><label className={labelCls}>Personal Email *</label><input type="email" className={inputCls} placeholder="you@example.com" value={form.teamLeadEmail} onChange={e => update("teamLeadEmail", e.target.value)} /></div>
              <div><label className={labelCls}>Name for Certificate * <span className="text-xs text-white/40">(as it should appear)</span></label><input type="text" className={inputCls} placeholder="Name on certificate" value={form.certificateName} onChange={e => update("certificateName", e.target.value)} /></div>
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><Users className="h-5 w-5 text-primary" /> Teammates <span className="text-sm font-normal text-white/40">(if any)</span></h2>
            <div className="space-y-4">
              <div><label className={labelCls}>Teammate 1 (if any)</label><input type="text" className={inputCls} placeholder="Name" value={form.teammate1} onChange={e => update("teammate1", e.target.value)} /></div>
              <div><label className={labelCls}>Teammate 2 (if any)</label><input type="text" className={inputCls} placeholder="Name" value={form.teammate2} onChange={e => update("teammate2", e.target.value)} /></div>
              <div><label className={labelCls}>Teammate 3 (if any)</label><input type="text" className={inputCls} placeholder="Name" value={form.teammate3} onChange={e => update("teammate3", e.target.value)} /></div>
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><Github className="h-5 w-5 text-primary" /> Project Links</h2>
            <div className="space-y-4">
              <div><label className={labelCls}>Public GitHub URL *</label><input type="url" className={inputCls} placeholder="https://github.com/..." value={form.githubUrl} onChange={e => update("githubUrl", e.target.value)} /></div>
              <div><label className={labelCls}>Public Deployment URL *</label><input type="url" className={inputCls} placeholder="https://your-project.vercel.app" value={form.deploymentUrl} onChange={e => update("deploymentUrl", e.target.value)} /></div>
              <div>
                <label className={labelCls}>PPT (PDF) *</label>
                <input type="file" ref={pptRef} accept=".pdf" className="hidden" onChange={handlePpt} />
                <button type="button" onClick={() => pptRef.current?.click()} disabled={uploadingPpt} className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-white/20 bg-white/5 px-4 py-4 text-sm text-white/50 transition hover:border-primary/50 hover:bg-white/10 disabled:opacity-50">
                  <Upload className="h-4 w-4" />
                  {uploadingPpt ? "Uploading..." : form.pptUrl ? (pptName || "PDF uploaded") : "Click to upload PDF (max 10MB)"}
                </button>
                {form.pptUrl && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> PDF uploaded
                    <button type="button" onClick={() => { update("pptUrl", ""); setPptName(""); if (pptRef.current) pptRef.current.value = ""; }} className="ml-2 text-red-400 hover:underline">Remove</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><Star className="h-5 w-5 text-primary" /> Phases Completed *</h2>
            <p className="mb-4 text-xs text-white/40">How many phases of the given problem statement did you complete?</p>
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => update("phasesCompleted", n)}
                  className={`rounded-md border py-3 text-center text-lg font-bold transition ${
                    form.phasesCompleted === n
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-white/10 bg-black/30 text-white/30 hover:border-white/30 hover:text-white/60"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {form.phasesCompleted === 0 && <p className="mt-2 text-xs text-yellow-400/70">Please select the number of phases completed.</p>}
          </div>

          <div className="glass p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Project Description</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Explain your project shortly * <span className="text-xs text-white/40">(max 3 sentences)</span></label>
                <textarea className={`${inputCls} resize-none`} rows={3} maxLength={500} placeholder="What does your project do?" value={form.projectSummary} onChange={e => update("projectSummary", e.target.value)} />
                <div className="mt-1 text-right text-xs text-white/30">{form.projectSummary.length}/500</div>
              </div>
              <div>
                <label className={labelCls}>What's unique about your project? * <span className="text-xs text-white/40">(max 3 sentences)</span></label>
                <textarea className={`${inputCls} resize-none`} rows={3} maxLength={500} placeholder="What makes your project stand out?" value={form.projectUniqueness} onChange={e => update("projectUniqueness", e.target.value)} />
                <div className="mt-1 text-right text-xs text-white/30">{form.projectUniqueness.length}/500</div>
              </div>
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Experience & Feedback</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>If you participated in any Tech / Non-Tech events, share your experience or comments <span className="text-xs text-white/40">(optional)</span></label>
                <textarea className={`${inputCls} resize-none`} rows={3} maxLength={1000} placeholder="Share your Vibeathon experience..." value={form.eventExperience} onChange={e => update("eventExperience", e.target.value)} />
                <div className="mt-1 text-right text-xs text-white/30">{form.eventExperience.length}/1000</div>
              </div>
              <div>
                <label className={labelCls}>Please share your feedback <span className="text-xs text-white/40">(click below to leave a Google review)</span></label>
                <a href="https://g.page/r/CaZ6E1PLfaKgEBM/review" target="_blank" rel="noopener" className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary transition hover:bg-primary/20">
                  <Star className="h-4 w-4" /> Leave a Google Review for Vibeathon 6.0
                </a>
              </div>
              <div>
                <label className={labelCls}>Upload screenshot of your feedback <span className="text-xs text-white/40">(optional, image max 5MB)</span></label>
                <input type="file" ref={feedbackRef} accept="image/*" className="hidden" onChange={handleFeedback} />
                <button type="button" onClick={() => feedbackRef.current?.click()} disabled={uploadingFeedback} className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-white/20 bg-white/5 px-4 py-4 text-sm text-white/50 transition hover:border-primary/50 hover:bg-white/10 disabled:opacity-50">
                  <Upload className="h-4 w-4" />
                  {uploadingFeedback ? "Uploading..." : form.feedbackScreenshotUrl ? (feedbackName || "Screenshot uploaded") : "Click to upload feedback screenshot"}
                </button>
                {form.feedbackScreenshotUrl && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Screenshot uploaded
                    <button type="button" onClick={() => { update("feedbackScreenshotUrl", ""); setFeedbackName(""); if (feedbackRef.current) feedbackRef.current.value = ""; }} className="ml-2 text-red-400 hover:underline">Remove</button>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Video Link <span className="text-xs text-white/40">(YouTube / Instagram / X — optional)</span></label>
                <input type="url" className={inputCls} placeholder="https://youtube.com/... or https://instagram.com/..." value={form.videoLink} onChange={e => update("videoLink", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-400/70">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Make sure all details are correct. Mismatches between your submission and actual project will affect your points.</span>
          </div>

          <button type="submit" disabled={!canSubmit || submit.isPending} className="w-full rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            {submit.isPending ? "Submitting..." : "Submit Final Project"}
          </button>
        </form>
      </div>
    </div>
  );
}
