import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getSubmissionByEmail } from "@/lib/api.submission";
import { Mail, Search, CheckCircle2, XCircle, Users, FileText, ExternalLink, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/phase1-results")({
  ssr: false,
  head: () => ({ meta: [{ title: "Phase 1 Results — Vibeathon 6.0" }] }),
  component: Phase1ResultsPage,
});

const inputCls = "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none transition-all focus:border-primary focus:bg-white/[0.07] focus:ring-1 focus:ring-primary/30 text-sm";

function Phase1ResultsPage() {
  const searchFn = useServerFn(getSubmissionByEmail);
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  const search = useMutation({
    mutationFn: () => searchFn({ data: { email } }),
    onSuccess: (data) => {
      if (data) {
        setResult(data);
        setNotFound(false);
      } else {
        setResult(null);
        setNotFound(true);
      }
    },
    onError: () => {
      setResult(null);
      setNotFound(true);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d1025] to-[#0a0a1a] text-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-10 text-center">
          <h1 className="text-sm font-bold text-white/40 tracking-widest uppercase">NXTGENSEC (NEXT GENERATION SECURITY)</h1>
          <p className="mt-1 text-xs text-white/30 italic">Securing Digital Assets</p>
          <h2 className="mt-4 text-3xl font-bold text-white">Vibeathon 6.0</h2>
          <p className="mt-1 text-base text-white/50">Phase 1 — Review Results</p>
        </div>

        <div className="glass mb-8 p-6">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="text-sm text-white/70">Enter the email you used during registration to view your review results.</p>
              <div className="mt-4 flex gap-3">
                <input
                  type="email"
                  className={inputCls}
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && email && !search.isPending) search.mutate(); }}
                />
                <button
                  onClick={() => search.mutate()}
                  disabled={!email || search.isPending}
                  className="shrink-0 rounded-lg bg-gradient-to-r from-primary to-primary/80 px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 hover:shadow-lg hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {search.isPending ? (
                    <span className="flex items-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Searching...</span>
                  ) : (
                    <span className="flex items-center gap-2"><Search className="h-4 w-4" /> Search</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {notFound && (
          <div className="glass mb-8 p-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-lg font-medium text-white">No results found</p>
            <p className="mt-1 text-sm text-white/50">We couldn't find a submission linked to this email. Make sure you entered the email your team used to register.</p>
          </div>
        )}

        {result && (
          <>
            <div className="glass mb-6 overflow-hidden">
              <div className="border-b border-white/10 bg-white/[0.03] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{result.team_name}</h3>
                    <p className="text-sm text-white/50">{result.team_lead_name}</p>
                  </div>
                  <div className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                    result.round_status === "round_2"
                      ? "bg-green-500/15 text-green-400"
                      : result.round_status === "rejected"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-yellow-500/15 text-yellow-400"
                  }`}>
                    {result.round_status === "round_2" ? "Qualified" : result.round_status === "rejected" ? "Not Selected" : result.round_status}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {result.round_status === "round_2" && (
                  <div className="bg-green-500/5 px-6 py-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-green-300">Congratulations! You've qualified for Round 2.</p>
                        <p className="mt-1.5 text-sm text-white/60">Please check the review given below and refine accordingly. Further updates will be given by the NxtGensec team.</p>
                      </div>
                    </div>
                  </div>
                )}

                {result.admin_notes && (
                  <div className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="mb-2 text-sm font-medium text-white/70">Review Notes</p>
                        <div className="space-y-1">
                          {result.admin_notes.split("|").map((part: string, i: number) => {
                            const t = part.trim();
                            if (!t) return null;
                            return (
                              <div key={i} className="flex items-start gap-2 text-sm text-white/60">
                                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/60" />
                                <span>{t}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="mb-2 text-sm font-medium text-white/70">Team Details</p>
                      <div className="space-y-1 text-sm text-white/60">
                        <p><span className="text-white/40">Team Lead:</span> {result.team_lead_name}</p>
                        <p><span className="text-white/40">Email:</span> {result.team_lead_email}</p>
                        {result.teammate_1 && <p><span className="text-white/40">Teammates:</span> {[result.teammate_1, result.teammate_2, result.teammate_3].filter(Boolean).join(", ")}</p>}
                        <p><span className="text-white/40">Phases Completed:</span> {result.phases_completed}/5</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 bg-white/[0.02] px-6 py-3">
                  <div className="flex flex-wrap gap-3 text-xs">
                    <a href={result.github_url} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-2 text-white/50 transition-all hover:bg-white/10 hover:text-white/80">
                      <ExternalLink className="h-3.5 w-3.5" /> GitHub
                    </a>
                    <a href={result.deployment_url} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-2 text-white/50 transition-all hover:bg-white/10 hover:text-white/80">
                      <ExternalLink className="h-3.5 w-3.5" /> Deployment
                    </a>
                    {result.ppt_url && (
                      <a href={result.ppt_url} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-2 text-white/50 transition-all hover:bg-white/10 hover:text-white/80">
                        <ExternalLink className="h-3.5 w-3.5" /> PPT
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-400/70">
              <span>If you have any questions regarding your review, please contact the NxtGensec team.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
