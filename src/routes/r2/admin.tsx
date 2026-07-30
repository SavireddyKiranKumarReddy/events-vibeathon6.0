import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { getR2Submissions, updateR2RoundStatus, updateR2SubmissionField, verifyR2Admin } from "@/lib/api.r2";
import {
  Shield, Filter, XCircle, ExternalLink, Github, Globe, Users,
  ChevronDown, Search, Save, Pencil, Video, Download, Lock,
} from "lucide-react";

export const Route = createFileRoute("/r2/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "R2 Admin — Vibeathon 6.0" }] }),
  component: R2AdminPage,
});

const ROUND_OPTIONS = ["submitted", "round_3", "rejected"];

function EditableField({ label, value, id, field, inputFn, isTextarea }: {
  label: string; value: string; id: string; field: string;
  inputFn: (p: { id: string; field: string; value: string }) => any;
  isTextarea?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const mutate = useMutation({ mutationFn: inputFn });

  if (!editing) return (
    <div className="group">
      <div className="text-xs text-white/40">{label}</div>
      <div className="flex items-center gap-2 text-sm text-white/80">
        <span className="flex-1 break-all">{value || "—"}</span>
        <button onClick={() => { setDraft(value); setEditing(true); }} className="opacity-0 group-hover:opacity-100 transition"><Pencil className="h-3 w-3 text-white/30 hover:text-primary" /></button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="text-xs text-white/40">{label}</div>
      <div className="flex items-center gap-2">
        {isTextarea ? (
          <textarea rows={3} value={draft} onChange={e => setDraft(e.target.value)} className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-primary resize-none" />
        ) : (
          <input type="text" value={draft} onChange={e => setDraft(e.target.value)} className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-primary" />
        )}
        <button onClick={() => { mutate.mutate({ id, field, value: draft }); setEditing(false); }} disabled={mutate.isPending} className="shrink-0 rounded bg-primary/20 p-1.5 text-primary hover:bg-primary/30 disabled:opacity-50"><Save className="h-3 w-3" /></button>
        <button onClick={() => setEditing(false)} className="shrink-0 rounded bg-white/10 p-1.5 text-white/40 hover:bg-white/20"><XCircle className="h-3 w-3" /></button>
      </div>
    </div>
  );
}

function R2AdminPage() {
  const qc = useQueryClient();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("r2admin") === "1");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const loginFn = useServerFn(verifyR2Admin);

  const listFn = useServerFn(getR2Submissions);
  const updateFn = useServerFn(updateR2RoundStatus);
  const fieldFn = useServerFn(updateR2SubmissionField);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["r2-submissions"],
    queryFn: () => listFn(),
    refetchInterval: 10000,
    enabled: authed,
  });

  const updateMutation = useMutation({
    mutationFn: (p: { id: string; roundStatus: string; adminNotes?: string }) => updateFn({ data: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["r2-submissions"] }),
  });

  const fieldMutation = useMutation({
    mutationFn: (p: { id: string; field: string; value: string }) => fieldFn({ data: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["r2-submissions"] }),
  });

  const [filterPhases, setFilterPhases] = useState<string>("all");
  const [filterRound, setFilterRound] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const subs = (submissions as any[]) ?? [];

  const filtered = useMemo(() => {
    return subs.filter((s: any) => {
      if (filterPhases !== "all" && s.phases_completed !== parseInt(filterPhases)) return false;
      if (filterRound !== "all" && s.round_status !== filterRound) return false;
      if (search) {
        const q = search.toLowerCase();
        const searchable = `${s.team_name} ${s.team_lead_name} ${s.teammate_1} ${s.teammate_2} ${s.teammate_3} ${s.team_lead_email}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [subs, filterPhases, filterRound, search]);

  const stats = useMemo(() => {
    const total = subs.length;
    const round3 = subs.filter((s: any) => s.round_status === "round_3").length;
    const rejected = subs.filter((s: any) => s.round_status === "rejected").length;
    const avgPhases = total > 0 ? (subs.reduce((sum: number, s: any) => sum + s.phases_completed, 0) / total).toFixed(1) : "0";
    return { total, round3, rejected, avgPhases };
  }, [subs]);

  const input = "rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white text-sm placeholder-white/20 outline-none focus:border-primary";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr("");
    const result = await loginFn({ data: { email: loginEmail, password: loginPass } });
    if (result.ok) {
      sessionStorage.setItem("r2admin", "1");
      setAuthed(true);
    } else {
      setLoginErr("Invalid credentials");
    }
  }

  if (!authed) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] p-4">
      <div className="glass w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          <Lock className="h-8 w-8 text-white/40" />
        </div>
        <h1 className="text-2xl font-bold text-white">R2 Admin</h1>
        <p className="mt-2 text-sm text-white/50">Sign in to manage Round 2 submissions</p>
        <form onSubmit={handleLogin} className="mt-6 space-y-4 text-left">
          <label className="block">
            <div className="text-xs text-white/60">Email</div>
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-primary" placeholder="admin@example.com" />
          </label>
          <label className="block">
            <div className="text-xs text-white/60">Password</div>
            <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} required
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-primary" placeholder="Enter password" />
          </label>
          {loginErr && <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">{loginErr}</div>}
          <button type="submit" disabled={!loginEmail || !loginPass}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Round 2 Submissions Admin</h1>
              <p className="text-sm text-white/50">Manage Vibeathon 6.0 Round 2 project submissions</p>
            </div>
          </div>
          <button onClick={() => { sessionStorage.removeItem("r2admin"); setAuthed(false); }}
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/5 transition">
            Sign Out
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="glass p-3 text-center">
            <div className="text-xs text-white/40">Total</div>
            <div className="mt-1 text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="glass p-3 text-center">
            <div className="text-xs text-white/40">Round 3</div>
            <div className="mt-1 text-2xl font-bold text-green-400">{stats.round3}</div>
          </div>
          <div className="glass p-3 text-center">
            <div className="text-xs text-white/40">Rejected</div>
            <div className="mt-1 text-2xl font-bold text-red-400">{stats.rejected}</div>
          </div>
          <div className="glass p-3 text-center">
            <div className="text-xs text-white/40">Avg Phases</div>
            <div className="mt-1 text-2xl font-bold text-primary">{stats.avgPhases}</div>
          </div>
        </div>

        <div className="glass mb-6 flex flex-wrap items-center gap-3 p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-white/40" />
            <input type="text" placeholder="Search team or name..." className={`${input} w-48`} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-white/40" />
            <select className={input} value={filterPhases} onChange={(e) => setFilterPhases(e.target.value)}>
              <option value="all">All Phases</option>
              {[1, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>{n} phases</option>))}
            </select>
          </div>
          <select className={input} value={filterRound} onChange={(e) => setFilterRound(e.target.value)}>
            <option value="all">All Rounds</option>
            {ROUND_OPTIONS.map((r) => (<option key={r} value={r}>{r.replace("_", " ").toUpperCase()}</option>))}
          </select>
          <span className="text-xs text-white/40">Showing {filtered.length} of {subs.length}</span>
          <button onClick={() => {
            const rows = filtered.map((s: any) => ({
              "Team Name": s.team_name,
              "Team Lead": s.team_lead_name,
              "Email": s.team_lead_email,
              "Contact": s.team_lead_contact,
              "Teammate 1": s.teammate_1,
              "Teammate 2": s.teammate_2,
              "Teammate 3": s.teammate_3,
              "GitHub URL": s.github_url,
              "Deployment URL": s.deployment_url,
              "PPT URL": s.ppt_url,
              "Video Link": s.video_link,
              "Phases": s.phases_completed,
              "Round Status": s.round_status,
              "Admin Notes": s.admin_notes,
              "Project Summary": s.project_summary,
              "Uniqueness": s.project_uniqueness,
              "Unique Features": s.unique_features,
              "Development Flow": s.development_flow,
              "Tech Stack Used": s.tech_stack_used,
              "LLMs Used": s.llms_used,
              "Vibecoding Tools": s.vibecoding_tools,
              "Database Used": s.database_used,
              "OAuth Exists": s.oauth_exists,
              "Created At": s.created_at,
            }));
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(rows);
            ws["!cols"] = [
              { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 15 },
              { wch: 20 }, { wch: 20 }, { wch: 20 },
              { wch: 35 }, { wch: 35 }, { wch: 50 }, { wch: 35 },
              { wch: 8 }, { wch: 12 }, { wch: 30 }, { wch: 50 },
              { wch: 50 },               { wch: 50 }, { wch: 50 },
              { wch: 50 }, { wch: 30 }, { wch: 30 },
              { wch: 30 }, { wch: 30 }, { wch: 25 },
            ];
            XLSX.utils.book_append_sheet(wb, ws, "R2 Submissions");
            XLSX.writeFile(wb, `r2-submissions-${new Date().toISOString().slice(0, 10)}.xlsx`);
          }} className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition ml-auto cursor-pointer">
            <Download className="h-3.5 w-3.5" />
            Export Excel
          </button>
        </div>

        {isLoading ? (
          <div className="text-center text-white/50">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="glass p-8 text-center text-white/50">No submissions found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s: any) => {
              const expanded = expandedId === s.id;
              const roundColor =
                s.round_status === "round_3" ? "text-green-400 bg-green-500/20 border-green-500/30"
                  : s.round_status === "rejected" ? "text-red-400 bg-red-500/20 border-red-500/30"
                    : "text-white/50 bg-white/10 border-white/10";

              return (
                <div key={s.id} className="glass overflow-hidden">
                  <div className="flex cursor-pointer items-center justify-between p-4 transition hover:bg-white/5" onClick={() => setExpandedId(expanded ? null : s.id)}>
                    <div className="flex items-center gap-4">
                      <div className="min-w-[6ch] text-center">
                        <div className="text-xs text-white/40">Phases</div>
                        <div className="text-lg font-bold text-primary">{s.phases_completed}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-white">{s.team_name}</div>
                        <div className="text-xs text-white/40">{s.team_lead_name} — {s.team_lead_email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${roundColor}`}>
                        {s.round_status.replace("_", " ").toUpperCase()}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t border-white/10 p-4 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-3">
                          <EditableField label="Team Name" value={s.team_name || ""} id={s.id} field="team_name" inputFn={fieldMutation.mutate} />
                          <EditableField label="Team Lead Name" value={s.team_lead_name} id={s.id} field="team_lead_name" inputFn={fieldMutation.mutate} />
                          <EditableField label="Contact" value={s.team_lead_contact} id={s.id} field="team_lead_contact" inputFn={fieldMutation.mutate} />
                          <EditableField label="Email" value={s.team_lead_email} id={s.id} field="team_lead_email" inputFn={fieldMutation.mutate} />
                          <div>
                            <div className="text-xs text-white/40">Teammates</div>
                            <div className="text-sm text-white/80">
                              {[s.teammate_1, s.teammate_2, s.teammate_3].filter(Boolean).join(", ") || "None"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-white/40">Submitted</div>
                            <div className="text-sm text-white/80">
                              {new Date(s.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                            </div>
                          </div>
                          {s.ppt_url && (
                            <div>
                              <div className="text-xs text-white/40">PPT</div>
                              <a href={s.ppt_url} target="_blank" rel="noopener" className="flex items-center gap-1 text-sm text-primary hover:underline">
                                View PPT <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center gap-1 text-xs text-white/40"><Github className="h-3 w-3" /> GitHub</div>
                            <a href={s.github_url} target="_blank" rel="noopener" className="flex items-center gap-1 text-sm text-primary hover:underline">
                              {s.github_url} <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-xs text-white/40"><Globe className="h-3 w-3" /> Deployment</div>
                            <a href={s.deployment_url} target="_blank" rel="noopener" className="flex items-center gap-1 text-sm text-primary hover:underline">
                              {s.deployment_url} <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <EditableField label="Project Summary" value={s.project_summary} id={s.id} field="project_summary" inputFn={fieldMutation.mutate} isTextarea />
                          <EditableField label="Uniqueness" value={s.project_uniqueness} id={s.id} field="project_uniqueness" inputFn={fieldMutation.mutate} isTextarea />
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <EditableField label="Unique / Innovative Features" value={s.unique_features || ""} id={s.id} field="unique_features" inputFn={fieldMutation.mutate} isTextarea />
                          <div className="space-y-3">
                            {s.video_link && (
                              <div>
                                <div className="flex items-center gap-1 text-xs text-white/40"><Video className="h-3 w-3" /> Video Link</div>
                                <a href={s.video_link} target="_blank" rel="noopener" className="flex items-center gap-1 text-sm text-primary hover:underline">
                                  {s.video_link} <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <EditableField label="Development Flow" value={s.development_flow || ""} id={s.id} field="development_flow" inputFn={fieldMutation.mutate} isTextarea />
                          <EditableField label="Tech Stack Used" value={s.tech_stack_used || ""} id={s.id} field="tech_stack_used" inputFn={fieldMutation.mutate} isTextarea />
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <EditableField label="LLMs Used" value={s.llms_used || ""} id={s.id} field="llms_used" inputFn={fieldMutation.mutate} />
                          <EditableField label="Vibecoding Tools" value={s.vibecoding_tools || ""} id={s.id} field="vibecoding_tools" inputFn={fieldMutation.mutate} />
                          <EditableField label="Database Used" value={s.database_used || ""} id={s.id} field="database_used" inputFn={fieldMutation.mutate} />
                          <EditableField label="OAuth Exists" value={s.oauth_exists || ""} id={s.id} field="oauth_exists" inputFn={fieldMutation.mutate} />
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-4">
                        <span className="text-xs text-white/40">Set Round:</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ROUND_OPTIONS.map((r) => (
                            <button key={r}
                              onClick={() => updateMutation.mutate({ id: s.id, roundStatus: r })}
                              disabled={s.round_status === r || updateMutation.isPending}
                              className={`rounded-md border px-3 py-1 text-xs font-semibold transition ${
                                s.round_status === r ? "border-primary bg-primary/20 text-primary" : "border-white/10 text-white/50 hover:bg-white/5"
                              } disabled:opacity-50`}>
                              {r.replace("_", " ").toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input type="text" className={`${input} flex-1`} placeholder="Admin notes..."
                          value={notesMap[s.id] ?? s.admin_notes ?? ""}
                          onChange={(e) => setNotesMap((prev) => ({ ...prev, [s.id]: e.target.value }))} />
                        <button onClick={() => updateMutation.mutate({ id: s.id, roundStatus: s.round_status, adminNotes: notesMap[s.id] ?? "" })}
                          disabled={updateMutation.isPending}
                          className="rounded-md bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20 disabled:opacity-50">
                          Save Note
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
