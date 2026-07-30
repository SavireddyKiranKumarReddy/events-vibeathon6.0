import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { checkR2Eligibility, submitR2Project } from "@/lib/api.r2";
import {
  CheckCircle2, XCircle, Github, Users, AlertTriangle,
  ExternalLink, FileText, Mail, Search, Lock,
} from "lucide-react";

export const Route = createFileRoute("/r2/submission")({
  ssr: false,
  head: () => ({ meta: [{ title: "R2 Submission — Vibeathon 6.0" }] }),
  component: R2SubmissionPage,
});

const inputCls = "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none transition-all focus:border-primary focus:bg-white/[0.07] focus:ring-1 focus:ring-primary/30 text-sm";
const labelCls = "block text-sm font-medium text-white/70 mb-1.5";

function R2SubmissionPage() {
  const eligibilityFn = useServerFn(checkR2Eligibility);
  const submitFn = useServerFn(submitR2Project);

  const [step, setStep] = useState<"email" | "form" | "done">("email");
  const [email, setEmail] = useState("");
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [pptState, setPptState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [pptName, setPptName] = useState("");
  const [pptSize, setPptSize] = useState("");
  const [form, setForm] = useState({
    teamName: "", teamLeadName: "", teamLeadContact: "", teamLeadEmail: "",
    teammate1: "", teammate2: "", teammate3: "",
    githubUrl: "", deploymentUrl: "", pptUrl: "", videoLink: "",
    phasesCompleted: 0,
    projectSummary: "", projectUniqueness: "", uniqueFeatures: "",
    llmsUsed: "", vibecodingTools: "", databaseUsed: "", oauthExists: "",
  });

  const update = (f: string, v: string | number) => setForm(p => ({ ...p, [f]: v }));

  const checkEmail = useMutation({
    mutationFn: () => eligibilityFn({ data: { email } }),
    onSuccess: (data) => {
      if (data) {
        setTeamInfo(data);
        setForm(p => ({
          ...p,
          teamName: data.team_name,
          teamLeadName: data.team_lead_name,
          teamLeadEmail: data.team_lead_email,
          githubUrl: data.github_url || "",
          deploymentUrl: data.deployment_url || "",
          pptUrl: data.ppt_url || "",
          videoLink: data.video_link || "",
        }));
        setLocked(true);
        setStep("form");
        setError("");
      } else {
        setError("This email is not eligible for Round 2. Make sure your team qualified.");
      }
    },
    onError: (e: any) => setError(e.message || "Failed to check eligibility"),
  });

  async function handlePpt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError(`"${file.name}" is not a PDF file.`);
      if (pptRef.current) pptRef.current.value = "";
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError(`File is ${formatSize(file.size)}. Max 50MB.`);
      if (pptRef.current) pptRef.current.value = "";
      return;
    }
    setPptName(file.name);
    setPptSize(formatSize(file.size));
    setPptState("uploading");
    try {
      const url = await uploadFile(file, "ppt");
      update("pptUrl", url);
      setPptState("done");
    } catch (err: any) {
      console.error("PPT upload error:", err);
      setError("PPT upload failed. " + (err?.message || "Please try again."));
      setPptState("error");
      setPptName("");
      setPptSize("");
    }
  }

  function removePpt() {
    update("pptUrl", "");
    setPptName("");
    setPptSize("");
    setPptState("idle");
    if (pptRef.current) pptRef.current.value = "";
  }

  const submit = useMutation({
    mutationFn: () => submitFn({ data: form }),
    onSuccess: () => setStep("done"),
    onError: (e: any) => setError(e.message || "Submission failed. Please try again."),
  });

  const canSubmit = form.teamName && form.teamLeadName && form.teamLeadEmail
    && form.teamLeadContact && form.githubUrl && form.deploymentUrl && form.pptUrl
    && form.phasesCompleted > 0;

  const lockedLinks = teamInfo ? [
    { label: "GitHub URL", value: form.githubUrl, icon: Github },
    { label: "Deployment URL", value: form.deploymentUrl, icon: ExternalLink },
    { label: "PPT", value: form.pptUrl, icon: FileText },
    { label: "Video Link", value: form.videoLink, icon: ExternalLink },
  ].filter(l => l.value) : [];

  if (step === "done") return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#0d1025] to-[#0a0a1a] p-4">
      <div className="glass mx-auto w-full max-w-lg p-10 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="h-10 w-10 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Round 2 — Submitted!</h1>
        <p className="mt-4 text-base text-white/60">Your Round 2 submission has been recorded. We'll review it soon — best of luck!</p>
        <p className="mt-3 text-sm text-white/40">{form.teamName} — {form.teamLeadName}</p>
      </div>
    </div>
  );

  if (step === "email") return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d1025] to-[#0a0a1a] text-white">
      <div className="mx-auto max-w-lg px-4 py-20">
        <div className="mb-10 text-center">
          <h1 className="text-sm font-bold text-white/40 tracking-widest uppercase">NXTGENSEC</h1>
          <h2 className="mt-4 text-3xl font-bold text-white">Vibeathon 6.0</h2>
          <p className="mt-1 text-base text-white/50">Round 2 — Project Submission</p>
        </div>
        <div className="glass p-8">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="text-sm text-white/70">Enter the email your team used in Phase 1 to start your Round 2 submission.</p>
              <div className="mt-4 flex gap-3">
                <input type="email" className={inputCls} placeholder="your@email.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && email && !checkEmail.isPending) checkEmail.mutate(); }} />
                <button onClick={() => checkEmail.mutate()} disabled={!email || checkEmail.isPending}
                  className="shrink-0 rounded-lg bg-gradient-to-r from-primary to-primary/80 px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 hover:shadow-lg hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-40">
                  {checkEmail.isPending ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</span>
                  ) : (
                    <span className="flex items-center gap-2"><Search className="h-4 w-4" /> Check</span>
                  )}
                </button>
              </div>
              {error && <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"><XCircle className="h-4 w-4 shrink-0" /> {error}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d1025] to-[#0a0a1a] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-10 text-center">
          <h1 className="text-sm font-bold text-white/40 tracking-widest uppercase">NXTGENSEC (NEXT GENERATION SECURITY)</h1>
          <p className="mt-1 text-xs text-white/30 italic">Securing Digital Assets</p>
          <h2 className="mt-4 text-3xl font-bold text-white">Vibeathon 6.0 — Round 2</h2>
          <p className="mt-1 text-base text-white/50">Refined Project Submission</p>
        </div>

        {error && <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"><XCircle className="h-4 w-4 shrink-0" /> {error}</div>}

        <form onSubmit={e => { e.preventDefault(); if (canSubmit && !submit.isPending) submit.mutate(); }} className="space-y-6">

          <div className="grid gap-6 lg:grid-cols-5">

            <div className="lg:col-span-2 space-y-4">
              <div className="glass p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-wider"><Lock className="h-4 w-4" /> Phase 1 Details</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-white/40">Team Name</div>
                    <div className="mt-0.5 text-sm font-medium text-white/90">{form.teamName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40">Team Lead</div>
                    <div className="mt-0.5 text-sm text-white/90">{form.teamLeadName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40">Email</div>
                    <div className="mt-0.5 text-sm text-white/90 break-all">{form.teamLeadEmail}</div>
                  </div>
                  <div className="border-t border-white/5 pt-3">
                    <div className="text-xs text-white/40 mb-2">Project Links</div>
                    <div className="space-y-2">
                      {lockedLinks && lockedLinks.map((l: any) => l.value ? (
                        <a key={l.label} href={l.value} target="_blank" rel="noopener"
                          className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-xs text-primary hover:bg-white/10 transition">
                          <l.icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{l.label}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 ml-auto text-white/30" />
                        </a>
                      ) : null)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-5">
              <div className="glass p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80"><Users className="h-4 w-4 text-primary" /> Contact & Team</h3>
                <div className="space-y-3">
                  <div><label className={labelCls}>Contact Number *</label><input type="tel" className={inputCls} placeholder="+91 XXXXX XXXXX" value={form.teamLeadContact} onChange={e => update("teamLeadContact", e.target.value)} /></div>
                  <div><label className={labelCls}>Teammate 1</label><input type="text" className={inputCls} placeholder="Name (leave blank if none)" value={form.teammate1} onChange={e => update("teammate1", e.target.value)} /></div>
                  <div><label className={labelCls}>Teammate 2</label><input type="text" className={inputCls} placeholder="Name (leave blank if none)" value={form.teammate2} onChange={e => update("teammate2", e.target.value)} /></div>
                  <div><label className={labelCls}>Teammate 3</label><input type="text" className={inputCls} placeholder="Name (leave blank if none)" value={form.teammate3} onChange={e => update("teammate3", e.target.value)} /></div>
                </div>
              </div>

              <div className="glass p-5">
                <h3 className="mb-4 text-sm font-semibold text-white/80">Phases Completed *</h3>
                <p className="mb-3 text-xs text-white/50">How many phases of your problem statement did you complete?</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => update("phasesCompleted", n)}
                      className={`rounded-lg border-2 py-3 text-center text-lg font-bold transition-all ${
                        form.phasesCompleted === n ? "border-primary bg-primary/15 text-primary shadow-lg shadow-primary/10" : "border-white/10 bg-white/[0.03] text-white/20 hover:border-white/25 hover:text-white/50"
                      }`}>{n}</button>
                  ))}
                </div>
                {form.phasesCompleted === 0 && <p className="mt-2 text-xs text-yellow-400/80">Please select a number above to continue.</p>}
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400/80">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Cross-check before submitting. If a phase you mark as working fails during verification, your team will <strong>not be considered</strong>.</span>
                </div>
              </div>

              <div className="glass p-5">
                <h3 className="mb-4 text-sm font-semibold text-white/80">About Your Project</h3>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>What does your project do? <span className="text-xs text-white/30">(2-3 sentences)</span></label>
                    <textarea className={`${inputCls} resize-none`} rows={2} maxLength={500} placeholder="Tell us briefly what you built..." value={form.projectSummary} onChange={e => update("projectSummary", e.target.value)} />
                    <div className="mt-1 text-right text-xs text-white/30">{form.projectSummary.length}/500</div>
                  </div>
                  <div>
                    <label className={labelCls}>What makes it unique? <span className="text-xs text-white/30">(2-3 sentences)</span></label>
                    <textarea className={`${inputCls} resize-none`} rows={2} maxLength={500} placeholder="What's the one thing that makes your project stand out?" value={form.projectUniqueness} onChange={e => update("projectUniqueness", e.target.value)} />
                    <div className="mt-1 text-right text-xs text-white/30">{form.projectUniqueness.length}/500</div>
                  </div>
                  <div>
                    <label className={labelCls}>Any unique or innovative features apart from what's mentioned above? <span className="text-xs text-white/30">(optional)</span></label>
                    <textarea className={`${inputCls} resize-none`} rows={2} maxLength={1000} placeholder="List any additional unique/innovative features your project has..." value={form.uniqueFeatures} onChange={e => update("uniqueFeatures", e.target.value)} />
                    <div className="mt-1 text-right text-xs text-white/30">{form.uniqueFeatures.length}/1000</div>
                  </div>
                </div>
              </div>

              <div className="glass p-5">
                <h3 className="mb-4 text-sm font-semibold text-white/80">Tech Stack & Tools</h3>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>LLMs used to develop your project</label>
                    <input type="text" className={inputCls} placeholder="e.g. GPT-4, Claude, Gemini..." value={form.llmsUsed} onChange={e => update("llmsUsed", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Vibecoding tools used to develop your project</label>
                    <input type="text" className={inputCls} placeholder="e.g. Lovable, Bolt, Cursor, Copilot..." value={form.vibecodingTools} onChange={e => update("vibecodingTools", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Which database have you used?</label>
                    <input type="text" className={inputCls} placeholder="e.g. Supabase, MongoDB, PostgreSQL..." value={form.databaseUsed} onChange={e => update("databaseUsed", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Does OAuth (Google or any other) exist?</label>
                    <input type="text" className={inputCls} placeholder="e.g. Google OAuth, GitHub OAuth, None..." value={form.oauthExists} onChange={e => update("oauthExists", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-400/70">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Double-check everything before submitting — <strong>no modifications will be allowed later</strong>.</span>
          </div>

          <button type="submit" disabled={!canSubmit || submit.isPending}
            className="w-full rounded-lg bg-gradient-to-r from-primary to-primary/80 px-6 py-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 hover:shadow-lg hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none">
            {submit.isPending ? "Submitting..." : "Submit My Project"}
          </button>
        </form>
      </div>
    </div>
  );
}
