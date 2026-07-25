import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  getMe,
  adminListTeams,
  adminAddTeam,
  adminDeleteTeam,
  adminUpdateTeam,
  adminListEvents,
  adminUpdateEvent,
  adminListSubmissions,
  adminOverrideSubmission,
  adminBulkImportTeams,
} from "@/lib/api.functions";
import { GlassCard } from "@/components/AppShell";
import { formatIST } from "@/lib/format";
import { Trash2, Save, CheckCircle2, XCircle, RotateCcw, Pencil, X, UserPlus, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Vibeathon" },
      { name: "description", content: "Admin controls for the Vibeathon events platform." },
    ],
  }),
  beforeLoad: async () => {
    try {
      const me = await getMe();
      if (!me.isAdmin) throw redirect({ to: "/dashboard" });
    } catch {
      throw redirect({ to: "/auth" });
    }
  },
  component: Admin,
});

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-xs text-white/60">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-primary"
      />
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition ${
        value
          ? "border-primary bg-primary/20 text-white"
          : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${value ? "bg-primary" : "bg-white/30"}`} />
      {label}: {value ? "On" : "Off"}
    </button>
  );
}

function TeamsPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListTeams);
  const addFn = useServerFn(adminAddTeam);
  const delFn = useServerFn(adminDeleteTeam);
  const updFn = useServerFn(adminUpdateTeam);
  const { data: teams } = useQuery({ queryKey: ["admin-teams"], queryFn: () => listFn() });
  const [form, setForm] = useState({ name: "", leadName: "", leadEmail: "" });
  const [err, setErr] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", leadName: "", leadEmail: "" });
  const [filter, setFilter] = useState("");
  const add = useMutation({
    mutationFn: () => addFn({ data: form }),
    onSuccess: () => {
      setForm({ name: "", leadName: "", leadEmail: "" });
      setErr(null);
      qc.invalidateQueries({ queryKey: ["admin-teams"] });
    },
    onError: (e: any) => setErr(e?.message ?? "Failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-teams"] }),
  });
  const upd = useMutation({
    mutationFn: () =>
      updFn({
        data: {
          id: editId!,
          name: editForm.name,
          leadName: editForm.leadName,
          leadEmail: editForm.leadEmail,
        },
      }),
    onSuccess: () => {
      setEditId(null);
      qc.invalidateQueries({ queryKey: ["admin-teams"] });
    },
  });
  const list = ((teams as any[]) ?? []).filter((t) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.lead_name?.toLowerCase().includes(q) ||
      t.lead_email?.toLowerCase().includes(q)
    );
  });
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <GlassCard className="lg:col-span-1">
        <h3 className="text-sm font-semibold text-white">Add team</h3>
        <div className="mt-4 space-y-3">
          <Input label="Team name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="Team lead name" value={form.leadName} onChange={(v) => setForm({ ...form, leadName: v })} />
          <Input
            label="Team lead email (Google)"
            value={form.leadEmail}
            onChange={(v) => setForm({ ...form, leadEmail: v })}
          />
          {err && <div className="text-xs text-white">{err}</div>}
          <button
            disabled={!form.name || !form.leadName || !form.leadEmail || add.isPending}
            onClick={() => add.mutate()}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {add.isPending ? "Adding…" : "Add team"}
          </button>
        </div>
      </GlassCard>
      <GlassCard className="lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">Teams ({(teams as any[])?.length ?? 0})</h3>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search name or email…"
            className="w-64 rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-primary"
          />
        </div>
        <div className="mt-4 max-h-[70vh] divide-y divide-white/10 overflow-y-auto pr-1">
          {list.map((t: any) =>
            editId === t.id ? (
              <div key={t.id} className="space-y-2 py-3">
                <Input label="Team name" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} />
                <Input label="Lead name" value={editForm.leadName} onChange={(v) => setEditForm({ ...editForm, leadName: v })} />
                <Input label="Lead email" value={editForm.leadEmail} onChange={(v) => setEditForm({ ...editForm, leadEmail: v })} />
                {editForm.leadEmail.toLowerCase() !== t.lead_email?.toLowerCase() && (
                  <div className="text-xs text-primary/80">
                    Changing email unlinks the current sign-in; new email owner must sign in with Google to claim.
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditId(null)}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                  <button
                    onClick={() => upd.mutate()}
                    disabled={upd.isPending}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" /> Save
                  </button>
                </div>
              </div>
            ) : (
              <div key={t.id} className="flex items-center justify-between py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{t.name}</div>
                  <div className="truncate text-xs text-white/50">
                    {t.lead_name} · {t.lead_email} {t.user_id ? "· linked" : "· not signed in yet"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => {
                      setEditId(t.id);
                      setEditForm({ name: t.name ?? "", leadName: t.lead_name ?? "", leadEmail: t.lead_email ?? "" });
                    }}
                    className="rounded-md border border-white/10 p-2 text-white/60 hover:bg-white/5"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => confirm(`Delete team ${t.name}?`) && del.mutate(t.id)}
                    className="rounded-md border border-white/10 p-2 text-white/60 hover:bg-white/5"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ),
          )}
          {list.length === 0 && <div className="py-3 text-sm text-white/50">No teams match.</div>}
        </div>
      </GlassCard>
    </div>
  );
}

function EventEditor({ event, onSave }: { event: any; onSave: (p: any) => void }) {
  const [title, setTitle] = useState(event.title ?? "");
  const [question, setQuestion] = useState(event.question ?? "");
  const [answerKey, setAnswerKey] = useState(event.answer_key ?? "");
  const [testEmails, setTestEmails] = useState<string[]>(event.test_emails ?? []);
  const [newEmail, setNewEmail] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const toLocal = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [startAt, setStartAt] = useState(toLocal(event.start_at));
  const [endAt, setEndAt] = useState(toLocal(event.end_at));
  const [liveAt, setLiveAt] = useState(toLocal(event.live_at));

  function addTestEmail() {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr("Invalid email format");
      return;
    }
    if (testEmails.includes(email)) {
      setEmailErr("Already added");
      return;
    }
    setTestEmails([...testEmails, email]);
    setNewEmail("");
    setEmailErr(null);
  }

  function removeTestEmail(idx: number) {
    setTestEmails(testEmails.filter((_, i) => i !== idx));
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/50">
            {event.track === "tech" ? "Tech" : "Non-Tech"} · Event {event.slot}
          </div>
          <div className="text-xs text-white/50">Starts {formatIST(event.start_at)}</div>
        </div>
        <div className="flex items-center gap-2">
          <Toggle
            label="Leaderboard"
            value={!!event.leaderboard_visible}
            onChange={(v) => onSave({ leaderboard_visible: v })}
          />
          <Toggle
            label="Manual lock"
            value={!!event.manual_lock}
            onChange={(v) => onSave({ manual_lock: v })}
          />
          <Toggle
            label="Force live"
            value={!!event.force_live}
            onChange={(v) => onSave({ force_live: v })}
          />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Input label="Title" value={title} onChange={setTitle} />
        <Input label="Correct answer" value={answerKey} onChange={setAnswerKey} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <label className="block">
          <div className="text-xs text-white/60">Start at (local time)</div>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <div className="text-xs text-white/60">End at (optional)</div>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-primary"
          />
        </label>
      </div>
      <label className="mt-3 block">
        <div className="text-xs text-white/60">Live at (overrides start_at for open check, optional)</div>
        <input
          type="datetime-local"
          value={liveAt}
          onChange={(e) => setLiveAt(e.target.value)}
          className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-primary"
        />
      </label>

      {/* Test Users Panel */}
      <div className="mt-4 rounded-md border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-yellow-400" />
          <span className="text-xs font-semibold text-white/80">Test Users</span>
          {testEmails.length > 0 && (
            <span className="ml-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
              {testEmails.length}
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-white/40">
          These users can access this event before it goes live. They lock at end_at.
        </div>
        {testEmails.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {testEmails.map((email, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-xs text-yellow-300"
              >
                <Mail className="h-3 w-3" />
                {email}
                <button
                  onClick={() => removeTestEmail(i)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-yellow-500/20"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <input
            value={newEmail}
            onChange={(e) => { setNewEmail(e.target.value); setEmailErr(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTestEmail(); } }}
            placeholder="Add email and press Enter"
            className="flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-primary"
          />
          <button
            onClick={addTestEmail}
            className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-400 hover:bg-yellow-500/20"
          >
            + Add
          </button>
        </div>
        {emailErr && <div className="mt-1 text-[11px] text-red-400">{emailErr}</div>}
      </div>

      <label className="mt-3 block">
        <div className="text-xs text-white/60">Question</div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-primary"
        />
      </label>
      <div className="mt-3 flex justify-end">
        <button
          onClick={() =>
            onSave({
              title,
              question,
              answer_key: answerKey,
              start_at: startAt ? new Date(startAt).toISOString() : undefined,
              end_at: endAt ? new Date(endAt).toISOString() : null,
              test_emails: testEmails,
              live_at: liveAt ? new Date(liveAt).toISOString() : null,
            })
          }
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Save className="h-3.5 w-3.5" /> Save
        </button>
      </div>
    </GlassCard>
  );
}

function EventsPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListEvents);
  const updFn = useServerFn(adminUpdateEvent);
  const { data } = useQuery({ queryKey: ["admin-events"], queryFn: () => listFn() });
  const events = ((data as any)?.events ?? [])
    .slice()
    .sort((a: any, b: any) => (a.track > b.track ? 1 : a.track < b.track ? -1 : a.slot - b.slot));
  const upd = useMutation({
    mutationFn: (patch: any) => updFn({ data: patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-events"] }),
  });

  const allTestUsers: { email: string; event: string; eventId: string }[] = events.flatMap((e: any) =>
    (e.test_emails ?? []).map((email: string) => ({ email, event: `${e.track === "tech" ? "Tech" : "Non-Tech"} Ev${e.slot}`, eventId: e.id })),
  );
  const uniqueTestEmails: string[] = [...new Set(allTestUsers.map((t: any) => t.email))];

  return (
    <div className="space-y-4">
      {/* Test Users Summary */}
      <GlassCard>
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-semibold text-white">All Test Users</span>
          <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
            {uniqueTestEmails.length} users · {allTestUsers.length} assignments
          </span>
        </div>
        {uniqueTestEmails.length === 0 ? (
          <div className="mt-2 text-xs text-white/40">No test users assigned to any event.</div>
        ) : (
          <div className="mt-2 space-y-1">
            {uniqueTestEmails.map((email: string) => {
              const assigned = allTestUsers.filter((t: any) => t.email === email);
              return (
                <div key={email} className="flex items-center gap-2 text-xs">
                  <Mail className="h-3 w-3 text-yellow-400" />
                  <span className="font-mono text-white/80">{email}</span>
                  <span className="text-white/40">→</span>
                  <span className="text-white/50">{assigned.map((a: any) => a.event).join(", ")}</span>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {events.map((e: any) => (
        <EventEditor key={e.id} event={e} onSave={(patch) => upd.mutate({ id: e.id, ...patch })} />
      ))}
    </div>
  );
}

function SubmissionsTable({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListSubmissions);
  const overrideFn = useServerFn(adminOverrideSubmission);
  const { data } = useQuery({
    queryKey: ["admin-subs", eventId],
    queryFn: () => listFn({ data: { eventId } }),
    refetchInterval: 5000,
  });
  const setOverride = useMutation({
    mutationFn: (p: { id: string; override: boolean | null }) => overrideFn({ data: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-subs", eventId] }),
  });
  if (!data) return <div className="text-white/60">Loading…</div>;
  const rows = data as any[];
  const firstCorrect = rows.find((s: any) => s.is_correct);
  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Submissions ({rows.length})</h3>
        {firstCorrect && (
          <div className="text-xs text-primary">
            First correct: {firstCorrect.team?.name ?? "—"} @ {formatIST(firstCorrect.submitted_at)}
          </div>
        )}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-widest text-white/40">
            <tr>
              <th className="pb-2">#</th>
              <th className="pb-2">Team</th>
              <th className="pb-2">Answer</th>
              <th className="pb-2">Submitted</th>
              <th className="pb-2">Correct</th>
              <th className="pb-2 text-right">Override</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((s: any, i: number) => (
              <tr key={s.id}>
                <td className="py-3 font-mono text-white/50">{i + 1}</td>
                <td className="py-3 text-white">{s.team?.name ?? "—"}</td>
                <td className="py-3 text-white/80">{s.answer}</td>
                <td className="py-3 font-mono text-xs text-white/60">{formatIST(s.submitted_at)}</td>
                <td className="py-3">
                  {s.is_correct ? (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <CheckCircle2 className="h-4 w-4" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-white/40">
                      <XCircle className="h-4 w-4" /> No
                    </span>
                  )}
                </td>
                <td className="py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      onClick={() => setOverride.mutate({ id: s.id, override: true })}
                      className="rounded border border-white/10 p-1.5 text-primary hover:bg-white/5"
                      title="Mark correct"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setOverride.mutate({ id: s.id, override: false })}
                      className="rounded border border-white/10 p-1.5 text-white/60 hover:bg-white/5"
                      title="Mark incorrect"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setOverride.mutate({ id: s.id, override: null })}
                      className="rounded border border-white/10 p-1.5 text-white/60 hover:bg-white/5"
                      title="Clear override"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="py-3 text-sm text-white/50">No submissions yet.</div>}
      </div>
    </GlassCard>
  );
}

function SubmissionsPanel() {
  const evFn = useServerFn(adminListEvents);
  const { data } = useQuery({ queryKey: ["admin-events"], queryFn: () => evFn() });
  const events = ((data as any)?.events ?? [])
    .slice()
    .sort((a: any, b: any) => (a.track > b.track ? 1 : a.track < b.track ? -1 : a.slot - b.slot));
  const [selected, setSelected] = useState<string | null>(null);
  const first = selected ?? events[0]?.id ?? null;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <GlassCard className="lg:col-span-1">
        <h3 className="text-sm font-semibold text-white">Events</h3>
        <div className="mt-3 space-y-1">
          {events.map((e: any) => (
            <button
              key={e.id}
              onClick={() => setSelected(e.id)}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                first === e.id ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
              }`}
            >
              <div className="text-xs uppercase tracking-widest text-white/40">
                {e.track === "tech" ? "Tech" : "Non-Tech"} · {e.slot}
              </div>
              {e.title}
            </button>
          ))}
        </div>
      </GlassCard>
      <div className="lg:col-span-3">{first && <SubmissionsTable eventId={first} />}</div>
    </div>
  );
}

function BulkImportPanel() {
  const qc = useQueryClient();
  const bulkFn = useServerFn(adminBulkImportTeams);
  const [csvText, setCsvText] = useState("");
  const [defaultPassword, setDefaultPassword] = useState("vibeathon2026");
  const [result, setResult] = useState<any>(null);

  function parseCsv(text: string) {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
    const rows: { name: string; leadName: string; leadEmail: string }[] = [];
    for (const line of lines) {
      let parts = line.split("\t").map((p) => p.trim());
      if (parts.length < 3) parts = line.split(";").map((p) => p.trim());
      if (parts.length < 3) parts = line.split(",").map((p) => p.trim());
      if (parts.length < 3) continue;

      const email = parts[2].toLowerCase();
      if (!email.includes("@")) continue;

      rows.push({ leadName: parts[0], name: parts[1], leadEmail: parts[2] });
    }
    return rows;
  }

  async function handleImport() {
    const rows = parseCsv(csvText);
    if (rows.length === 0) return;
    const r = await bulkFn({ data: { rows, defaultPassword } });
    setResult(r);
    qc.invalidateQueries({ queryKey: ["admin-teams"] });
  }

  const rows = useMemo(() => parseCsv(csvText), [csvText]);

  return (
    <div className="space-y-4">
      <GlassCard>
        <h3 className="text-sm font-semibold text-white">Bulk Import Teams</h3>
        <p className="mt-1 text-xs text-white/50">
          Upload a CSV/TSV file, or paste tab/comma/semicolon-separated data: Lead Name, Team Name, Email.
          Header rows are auto-skipped.
        </p>
        <div className="mt-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            Upload Excel / CSV
            <input
              type="file"
              accept=".csv,.tsv,.txt,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
                if (isExcel) {
                  reader.onload = (ev) => {
                    const wb = XLSX.read(ev.target?.result, { type: "array" });
                    const sheet = wb.Sheets[wb.SheetNames[0]];
                    const tsv = XLSX.utils.sheet_to_csv(sheet, { FS: "\t" });
                    setCsvText(tsv);
                  };
                  reader.readAsArrayBuffer(file);
                } else {
                  reader.onload = (ev) => setCsvText(ev.target?.result as string);
                  reader.readAsText(file);
                }
              }}
            />
          </label>
        </div>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={12}
          placeholder={"VANSH BHADANI\tSoloDeveloper\t23r11a0590@gcet.edu.in\nHaridev D Menon\thdm0617\thdm0617@gmail.com"}
          className="mt-3 w-full rounded-md border border-white/10 bg-black/40 p-3 font-mono text-xs text-white outline-none focus:border-primary"
        />
        <div className="mt-3 flex items-center gap-4">
          <label className="block flex-1">
            <div className="text-xs text-white/60">Default Password (min 6 chars)</div>
            <input
              value={defaultPassword}
              onChange={(e) => setDefaultPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-primary"
            />
          </label>
          <div className="text-right">
            <div className="text-xs text-white/50">{rows.length} rows detected</div>
            <button
              onClick={handleImport}
              disabled={rows.length === 0 || !defaultPassword || defaultPassword.length < 6}
              className="mt-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Import All
            </button>
          </div>
        </div>
      </GlassCard>

      {rows.length > 0 && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white">Preview (first 10)</h3>
          <div className="mt-3 divide-y divide-white/10">
            {rows.slice(0, 10).map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="text-white">{r.leadName}</span>
                  <span className="text-white/40"> — {r.name}</span>
                </div>
                <span className="font-mono text-xs text-white/50">{r.leadEmail}</span>
              </div>
            ))}
          </div>
          {rows.length > 10 && (
            <div className="mt-2 text-xs text-white/40">...and {rows.length - 10} more</div>
          )}
        </GlassCard>
      )}

      {result && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white">Import Result</h3>
          <div className="mt-3 space-y-1 text-sm">
            <div className="text-primary">Created: {result.created} teams</div>
            <div className="text-white/70">Auth users created: {result.authCreated}</div>
            <div className="text-white/50">Skipped (already exist): {result.skipped}</div>
            {result.errors?.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-white/40">Errors:</div>
                {result.errors.map((e: string, i: number) => (
                  <div key={i} className="text-xs text-red-400">{e}</div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function Admin() {
  const [tab, setTab] = useState<"teams" | "events" | "submissions" | "import">("teams");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Admin</h1>
        <p className="mt-1 text-sm text-white/60">Manage teams, events, and grading.</p>
      </div>
      <div className="glass inline-flex p-1">
        {(["teams", "import", "events", "submissions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm transition ${
              tab === t ? "bg-primary font-semibold text-primary-foreground" : "text-white/70 hover:text-white"
            }`}
          >
            {t === "import" ? "Bulk Import" : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === "teams" && <TeamsPanel />}
      {tab === "import" && <BulkImportPanel />}
      {tab === "events" && <EventsPanel />}
      {tab === "submissions" && <SubmissionsPanel />}
    </div>
  );
}