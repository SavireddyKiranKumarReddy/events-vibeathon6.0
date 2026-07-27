import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { submitFinalProject } from "@/lib/api.submission";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2, XCircle, Github, Users, Upload, Info, AlertTriangle,
  MessageSquare, Play, Star, ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/submission")({
  ssr: false,
  head: () => ({ meta: [{ title: "Final Submission — Vibeathon 6.0" }] }),
  component: SubmissionPage,
});

const inputCls = "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none transition-all focus:border-primary focus:bg-white/[0.07] focus:ring-1 focus:ring-primary/30 text-sm";
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
    teamLeadName: "", teamLeadContact: "", teamLeadEmail: "",
    teammate1: "", teammate2: "", teammate3: "",
    githubUrl: "", deploymentUrl: "", pptUrl: "", videoLink: "",
    phasesCompleted: 0,
    projectSummary: "", projectUniqueness: "",
    eventExperience: "", feedbackScreenshotUrl: "",
  });

  const update = (f: string, v: string | number) => setForm(p => ({ ...p, [f]: v }));

  async function handlePpt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { setError("Please upload your PPT as a PDF file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File size must be under 10MB."); return; }
    setUploadingPpt(true); setError(""); setPptName(file.name);
    const path = `ppt/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
    const { data, error: upErr } = await supabase.storage.from("event-submissions").upload(path, file, { contentType: "application/pdf" });
    if (upErr) { setError("Upload failed. Please try again."); setUploadingPpt(false); return; }
    const { data: urlData } = supabase.storage.from("event-submissions").getPublicUrl(data.path);
    update("pptUrl", urlData.publicUrl);
    setUploadingPpt(false);
  }

  async function handleFeedback(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please upload an image file (JPG, PNG, etc.)."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Screenshot must be under 5MB."); return; }
    setUploadingFeedback(true); setError(""); setFeedbackName(file.name);
    const ext = file.name.split(".").pop() || "png";
    const path = `feedback/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data, error: upErr } = await supabase.storage.from("event-submissions").upload(path, file, { contentType: file.type });
    if (upErr) { setError("Upload failed. Please try again."); setUploadingFeedback(false); return; }
    const { data: urlData } = supabase.storage.from("event-submissions").getPublicUrl(data.path);
    update("feedbackScreenshotUrl", urlData.publicUrl);
    setUploadingFeedback(false);
  }

  const submit = useMutation({
    mutationFn: () => submitFn({ data: form }),
    onSuccess: () => setSubmitted(true),
    onError: (e: any) => setError(e.message || "Submission failed. Please try again."),
  });

  const canSubmit = form.teamLeadName && form.teamLeadContact && form.teamLeadEmail
    && form.githubUrl && form.deploymentUrl && form.pptUrl && form.phasesCompleted > 0
    && form.projectSummary && form.projectUniqueness
    && form.eventExperience && form.feedbackScreenshotUrl;

  if (submitted) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#0d1025] to-[#0a0a1a] p-4">
      <div className="glass mx-auto w-full max-w-lg p-10 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="h-10 w-10 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">You're all set!</h1>
        <p className="mt-4 text-base text-white/60">Your submission has been recorded successfully. We'll review it soon — best of luck!</p>
        <p className="mt-3 text-sm text-white/40">{form.teamLeadName}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d1025] to-[#0a0a1a] text-white">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Play className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Vibeathon 6.0</h1>
          <p className="mt-2 text-base text-white/50">Final Project Submission</p>
        </div>

        <div className="glass mb-8 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white"><Info className="h-5 w-5 text-primary" /> Before you submit</h2>
          <ol className="space-y-3 text-sm text-white/60 list-none">
            <li className="pl-0"><span className="font-semibold text-primary">1. </span>Submit a <strong className="text-white/80">public GitHub link</strong> with a proper README (team name, roles, key info).</li>
            <li className="pl-0"><span className="font-semibold text-primary">2. </span>Submit a <strong className="text-white/80">public deployment link</strong> where your project is live.</li>
            <li className="pl-0"><span className="font-semibold text-primary">3. </span>Upload your <strong className="text-white/80">PPT as PDF</strong> (max 10MB).</li>
            <li className="pl-0"><span className="font-semibold text-primary">4. </span>Your <strong className="text-white/80">team lead name</strong> will appear on the certificate — double-check before submitting. <span className="text-yellow-400">No changes later.</span></li>
            <li className="pl-0"><span className="font-semibold text-primary">5. </span>Mark anything incomplete as <strong className="text-yellow-400">beta</strong> in your README.</li>
          </ol>
        </div>

        {error && <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"><XCircle className="h-4 w-4 shrink-0" /> {error}</div>}

        <form onSubmit={e => { e.preventDefault(); if (canSubmit && !submit.isPending) submit.mutate(); }} className="space-y-6">

          <div className="glass p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-white"><Users className="h-5 w-5 text-primary" /> Your Details</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Team Lead Name *</label>
                <p className="mb-1.5 text-xs text-white/30">This name will appear on your certificate — make sure it's correct!</p>
                <input type="text" className={inputCls} placeholder="Enter your full name" value={form.teamLeadName} onChange={e => update("teamLeadName", e.target.value)} />
              </div>
              <div><label className={labelCls}>Contact Number *</label><input type="tel" className={inputCls} placeholder="+91 XXXXX XXXXX" value={form.teamLeadContact} onChange={e => update("teamLeadContact", e.target.value)} /></div>
              <div><label className={labelCls}>Email *</label><input type="email" className={inputCls} placeholder="you@example.com" value={form.teamLeadEmail} onChange={e => update("teamLeadEmail", e.target.value)} /></div>
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-white"><Users className="h-5 w-5 text-primary" /> Teammates <span className="text-sm font-normal text-white/40">(if any)</span></h2>
            <div className="space-y-3">
              <div><label className={labelCls}>Teammate 1</label><input type="text" className={inputCls} placeholder="Name (leave blank if none)" value={form.teammate1} onChange={e => update("teammate1", e.target.value)} /></div>
              <div><label className={labelCls}>Teammate 2</label><input type="text" className={inputCls} placeholder="Name (leave blank if none)" value={form.teammate2} onChange={e => update("teammate2", e.target.value)} /></div>
              <div><label className={labelCls}>Teammate 3</label><input type="text" className={inputCls} placeholder="Name (leave blank if none)" value={form.teammate3} onChange={e => update("teammate3", e.target.value)} /></div>
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-white"><Github className="h-5 w-5 text-primary" /> Project Links</h2>
            <div className="space-y-4">
              <div><label className={labelCls}>GitHub Repository URL *</label><input type="url" className={inputCls} placeholder="https://github.com/username/repo" value={form.githubUrl} onChange={e => update("githubUrl", e.target.value)} /></div>
              <div><label className={labelCls}>Deployment URL *</label><input type="url" className={inputCls} placeholder="https://your-project.vercel.app" value={form.deploymentUrl} onChange={e => update("deploymentUrl", e.target.value)} /></div>
              <div>
                <label className={labelCls}>PPT (PDF only, max 10MB) *</label>
                <input type="file" ref={pptRef} accept=".pdf" className="hidden" onChange={handlePpt} />
                <button type="button" onClick={() => pptRef.current?.click()} disabled={uploadingPpt} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-5 text-sm text-white/40 transition-all hover:border-primary/40 hover:bg-white/[0.07] hover:text-white/60 disabled:opacity-50">
                  <Upload className="h-4 w-4" />
                  {uploadingPpt ? "Uploading..." : form.pptUrl ? (pptName || "PDF uploaded") : "Click to upload your PPT"}
                </button>
                {form.pptUrl && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
                    <button type="button" onClick={() => { update("pptUrl", ""); setPptName(""); if (pptRef.current) pptRef.current.value = ""; }} className="ml-2 text-red-400 hover:underline">Remove</button>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Video Link <span className="text-xs text-white/30">(YouTube / Instagram / X — optional)</span></label>
                <input type="url" className={inputCls} placeholder="https://youtube.com/..." value={form.videoLink} onChange={e => update("videoLink", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="mb-2 text-lg font-semibold text-white">Phases Completed *</h2>
            <p className="mb-4 text-sm text-white/50">How many phases of your problem statement did you complete?</p>
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => update("phasesCompleted", n)}
                  className={`rounded-lg border-2 py-4 text-center text-xl font-bold transition-all ${
                    form.phasesCompleted === n
                      ? "border-primary bg-primary/15 text-primary shadow-lg shadow-primary/10"
                      : "border-white/10 bg-white/[0.03] text-white/20 hover:border-white/25 hover:text-white/50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {form.phasesCompleted === 0 && <p className="mt-3 text-xs text-yellow-400/80">Please select a number above to continue.</p>}
          </div>

          <div className="glass p-6">
            <h2 className="mb-5 text-lg font-semibold text-white">About Your Project</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>What does your project do? * <span className="text-xs text-white/30">(2-3 sentences)</span></label>
                <textarea className={`${inputCls} resize-none`} rows={3} maxLength={500} placeholder="Tell us briefly what you built..." value={form.projectSummary} onChange={e => update("projectSummary", e.target.value)} />
                <div className="mt-1 text-right text-xs text-white/30">{form.projectSummary.length}/500</div>
              </div>
              <div>
                <label className={labelCls}>What makes it unique? * <span className="text-xs text-white/30">(2-3 sentences)</span></label>
                <textarea className={`${inputCls} resize-none`} rows={3} maxLength={500} placeholder="What's the one thing that makes your project stand out?" value={form.projectUniqueness} onChange={e => update("projectUniqueness", e.target.value)} />
                <div className="mt-1 text-right text-xs text-white/30">{form.projectUniqueness.length}/500</div>
              </div>
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white"><Star className="h-5 w-5 text-primary" /> Feedback</h2>
            <p className="mb-5 text-sm text-white/50">Your feedback matters to us! It helps us make Vibeathon even better next time.</p>
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Share your feedback (Google Review) *</label>
                <a
                  href="https://g.page/r/CaZ6E1PLfaKgEBM/review"
                  target="_blank"
                  rel="noopener"
                  className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary transition-all hover:bg-primary/20 hover:border-primary/50"
                >
                  <span className="flex items-center gap-2"><Star className="h-4 w-4" /> Leave a review on Google</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <p className="mt-2 text-xs text-white/30">Click the link above, write your review, then come back here to upload the screenshot.</p>
              </div>
              <div>
                <label className={labelCls}>Upload screenshot of your review * <span className="text-xs text-white/30">(image, max 5MB)</span></label>
                <input type="file" ref={feedbackRef} accept="image/*" className="hidden" onChange={handleFeedback} />
                <button type="button" onClick={() => feedbackRef.current?.click()} disabled={uploadingFeedback} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-5 text-sm text-white/40 transition-all hover:border-primary/40 hover:bg-white/[0.07] hover:text-white/60 disabled:opacity-50">
                  <Upload className="h-4 w-4" />
                  {uploadingFeedback ? "Uploading..." : form.feedbackScreenshotUrl ? (feedbackName || "Screenshot uploaded") : "Click to upload screenshot"}
                </button>
                {form.feedbackScreenshotUrl && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
                    <button type="button" onClick={() => { update("feedbackScreenshotUrl", ""); setFeedbackName(""); if (feedbackRef.current) feedbackRef.current.value = ""; }} className="ml-2 text-red-400 hover:underline">Remove</button>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Any additional thoughts? <span className="text-xs text-white/30">(optional)</span></label>
                <textarea className={`${inputCls} resize-none`} rows={3} maxLength={1500} placeholder="Anything else you'd like to share..." value={form.eventExperience} onChange={e => update("eventExperience", e.target.value)} />
                <div className="mt-1 text-right text-xs text-white/30">{form.eventExperience.length}/1500</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-400/70">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Double-check everything before submitting — <strong>no modifications will be allowed later</strong>.</span>
          </div>

          <button type="submit" disabled={!canSubmit || submit.isPending} className="w-full rounded-lg bg-gradient-to-r from-primary to-primary/80 px-6 py-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 hover:shadow-lg hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none">
            {submit.isPending ? "Submitting..." : "Submit My Project"}
          </button>
        </form>
      </div>
    </div>
  );
}
