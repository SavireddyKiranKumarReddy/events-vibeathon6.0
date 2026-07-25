import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---- Session/me ----
export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const email = (claims.email as string | undefined) ?? null;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = !!roles?.some((r) => r.role === "admin");
    const isUser = !!roles?.some((r) => r.role === "user");
    let { data: team } = await supabase
      .from("teams")
      .select("id, name, lead_name, lead_email")
      .eq("user_id", userId)
      .maybeSingle();
    if (!team && email) {
      const { data: byEmail } = await supabase
        .from("teams")
        .select("id, name, lead_name, lead_email")
        .eq("lead_email", email.toLowerCase())
        .maybeSingle();
      team = byEmail ?? null;
    }
    return {
      userId,
      email,
      isAdmin,
      isUser,
      hasAccess: isAdmin || isUser,
      team,
    };
  });

// ---- Events (shared) ----
export const listEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("events")
      .select(
        "id, track, slot, title, question, start_at, end_at, leaderboard_visible, manual_lock, created_at, test_emails, force_live, live_at",
      )
      .order("track", { ascending: true })
      .order("slot", { ascending: true });
    if (error) throw error;
    return { events: data ?? [], now: new Date().toISOString() };
  });

export const getEvent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { track: "tech" | "nontech"; slot: number }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const authEmail = (claims.email as string | undefined)?.toLowerCase() ?? null;
    const { data: ev, error } = await supabase
      .from("events")
      .select(
        "id, track, slot, title, question, start_at, end_at, leaderboard_visible, manual_lock, created_at, test_emails, force_live, live_at",
      )
      .eq("track", data.track)
      .eq("slot", data.slot)
      .maybeSingle();
    if (error) throw error;
    if (!ev) throw new Error("Event not found");

    const { data: next } = await supabase
      .from("events")
      .select("start_at")
      .eq("track", data.track)
      .gt("start_at", ev.start_at)
      .order("start_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const locksAt = next?.start_at ?? ev.end_at ?? null;

    let { data: team } = await supabase
      .from("teams")
      .select("id, lead_email")
      .eq("user_id", userId)
      .maybeSingle();
    if (!team && authEmail) {
      const { data: byEmail } = await supabase
        .from("teams")
        .select("id, lead_email")
        .eq("lead_email", authEmail)
        .maybeSingle();
      team = byEmail ?? null;
    }

    const now = Date.now();
    const effectiveStart = ev.live_at ? new Date(ev.live_at).getTime() : new Date(ev.start_at).getTime();
    const isTestEmail = authEmail && ev.test_emails?.length
      ? ev.test_emails.map((e: string) => e.toLowerCase()).includes(authEmail)
      : false;

    const started = ev.force_live || isTestEmail || now >= effectiveStart;
    const notLocked = ev.force_live || isTestEmail
      ? !ev.end_at || now < new Date(ev.end_at).getTime()
      : !locksAt || now < new Date(locksAt).getTime();
    const open = started && notLocked && !ev.manual_lock;

    let submission = null as null | {
      id: string;
      answer: string;
      submitted_at: string;
      auto_correct: boolean;
      admin_override: boolean | null;
    };
    if (team) {
      const { data: s } = await supabase
        .from("submissions")
        .select("id, answer, submitted_at, auto_correct, admin_override")
        .eq("event_id", ev.id)
        .eq("team_id", team.id)
        .maybeSingle();
      submission = s ?? null;
    }
    return {
      event: ev,
      locksAt,
      open,
      started,
      submission,
      now: new Date().toISOString(),
    };
  });

export const submitAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { eventId: string; answer: string; score?: number }) =>
    z.object({ eventId: z.string().uuid(), answer: z.string().min(1).max(2000), score: z.number().int().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const authEmail = (claims.email as string | undefined)?.toLowerCase() ?? null;
    let { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!team && authEmail) {
      const { data: byEmail } = await supabase
        .from("teams")
        .select("id")
        .eq("lead_email", authEmail)
        .maybeSingle();
      team = byEmail ?? null;
    }
    if (!team) throw new Error("No team linked to this account");

    const insert: Record<string, any> = {
      event_id: data.eventId,
      team_id: team.id,
      answer: data.answer,
    };
    if (data.score !== undefined) insert.score = data.score;
    const { error } = await supabase.from("submissions").insert(insert);
    if (error) {
      if (error.code === "23505") throw new Error("You have already submitted for this event");
      throw new Error("Unable to submit your answer. Please try again.");
    }
    return { ok: true };
  });

// ---- Leaderboard ----
export const getLeaderboards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: roleRows } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = !!roleRows?.some((r) => r.role === "admin");

    const { data: events } = await supabaseAdmin
      .from("events")
      .select("id, track, slot, title, start_at, end_at, leaderboard_visible, manual_lock");
    const { data: subs } = await supabaseAdmin
      .from("submissions")
      .select("event_id, team_id, submitted_at, auto_correct, admin_override, score");
    const { data: teams } = await supabaseAdmin.from("teams").select("id, name, lead_name");

    return { events: events ?? [], submissions: subs ?? [], teams: teams ?? [], isAdmin };
  });

// ---- Admin: teams ----
async function assertAdmin(supabase: any, userId: string) {
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (!roles?.some((r: any) => r.role === "admin")) throw new Error("Forbidden");
}

export const adminListTeams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const allTeams: any[] = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabaseAdmin
        .from("teams")
        .select("*")
        .order("created_at", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allTeams.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return allTeams;
  });

export const adminAddTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string; leadName: string; leadEmail: string }) =>
    z
      .object({
        name: z.string().min(1),
        leadName: z.string().min(1),
        leadEmail: z.string().email(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("teams").insert({
      name: data.name,
      lead_name: data.leadName,
      lead_email: data.leadEmail.toLowerCase(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("teams").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { id: string; name?: string; leadName?: string; leadEmail?: string }) =>
      z
        .object({
          id: z.string().uuid(),
          name: z.string().min(1).optional(),
          leadName: z.string().min(1).optional(),
          leadEmail: z.string().email().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const patch: {
      name?: string;
      lead_name?: string;
      lead_email?: string;
      user_id?: string | null;
    } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.leadName !== undefined) patch.lead_name = data.leadName;
    if (data.leadEmail !== undefined) {
      patch.lead_email = data.leadEmail.toLowerCase();
      // Email is the login key — unlink prior account so the new email owner
      // can claim the team on next Google sign-in.
      patch.user_id = null;
    }
    const { error } = await context.supabase.from("teams").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Admin: events ----
export const adminListEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .order("track", { ascending: true })
      .order("slot", { ascending: true });
    if (error) throw error;
    return { events: data ?? [] };
  });

export const adminUpdateEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id: string;
      title?: string;
      question?: string;
      answer_key?: string;
      start_at?: string;
      end_at?: string | null;
      leaderboard_visible?: boolean;
      manual_lock?: boolean;
      test_emails?: string[];
      force_live?: boolean;
      live_at?: string | null;
    }) =>
      z
        .object({
          id: z.string().uuid(),
          title: z.string().optional(),
          question: z.string().optional(),
          answer_key: z.string().optional(),
          start_at: z.string().optional(),
          end_at: z.string().nullable().optional(),
          leaderboard_visible: z.boolean().optional(),
          manual_lock: z.boolean().optional(),
          test_emails: z.array(z.string()).optional(),
          force_live: z.boolean().optional(),
          live_at: z.string().nullable().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("events").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Admin: submissions ----
export const adminListSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { eventId: string }) => z.object({ eventId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: subs, error } = await context.supabase
      .from("submissions")
      .select("id, answer, submitted_at, auto_correct, admin_override, team_id, score")
      .eq("event_id", data.eventId)
      .order("submitted_at", { ascending: true });
    if (error) throw error;
    const { data: teams } = await context.supabase.from("teams").select("id, name, lead_name, lead_email");
    const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
    return (subs ?? []).map((s) => ({
      ...s,
      team: teamMap.get(s.team_id) ?? null,
      is_correct:
        s.admin_override !== null && s.admin_override !== undefined
          ? s.admin_override
          : s.auto_correct,
    }));
  });

export const adminOverrideSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; override: boolean | null }) =>
    z
      .object({ id: z.string().uuid(), override: z.boolean().nullable() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("submissions")
      .update({ admin_override: data.override })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Admin: bulk import teams ----
export const adminBulkImportTeams = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { rows: { name: string; leadName: string; leadEmail: string }[]; defaultPassword: string }) =>
      z
        .object({
          rows: z.array(
            z.object({
              name: z.string().min(1),
              leadName: z.string().min(1),
              leadEmail: z.string().email(),
            }),
          ),
          defaultPassword: z.string().min(6),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const results = { created: 0, skipped: 0, authCreated: 0, errors: [] as string[] };

    for (const row of data.rows) {
      const email = row.leadEmail.toLowerCase().trim();

      const { data: existing } = await supabaseAdmin
        .from("teams")
        .select("id")
        .eq("lead_email", email)
        .maybeSingle();

      if (existing) {
        results.skipped++;
        continue;
      }

      const { error: teamErr } = await supabaseAdmin.from("teams").insert({
        name: row.name.trim(),
        lead_name: row.leadName.trim(),
        lead_email: email,
      });

      if (teamErr) {
        results.errors.push(`${email}: ${teamErr.message}`);
        continue;
      }
      results.created++;

      const { error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: data.defaultPassword,
        email_confirm: true,
      });

      if (authErr) {
        results.errors.push(`${email} (auth): ${authErr.message}`);
      } else {
        results.authCreated++;
      }
    }

    return results;
  });