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
                        <a
                          href="https://chat.whatsapp.com/HcsSWwwMOKLKvc2VyUELpA"
                          target="_blank"
                          rel="noopener"
                          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-600/20 px-4 py-2.5 text-sm font-medium text-green-300 transition-all hover:bg-green-600/30"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          Join WhatsApp Group
                        </a>
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


          </>
        )}
      </div>
    </div>
  );
}
