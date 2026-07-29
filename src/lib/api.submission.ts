import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---- Create signed upload URL (tiny payload, no body size limit) ----
export const createSignedUploadUrl = createServerFn({ method: "POST" })
  .validator(
    (d: { fileName: string; folder: string }) =>
      z
        .object({
          fileName: z.string().min(1),
          folder: z.string().min(1),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
    const path = `${data.folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { data: signedData, error } = await supabaseAdmin.storage
      .from("event-submissions")
      .createSignedUploadUrl(path);
    if (error) throw new Error("Failed to create upload URL: " + error.message);
    return { signedUrl: signedData.signedUrl, path, token: signedData.token };
  });

// ---- Server-side upload fallback (for small files via base64) ----
export const uploadFileServer = createServerFn({ method: "POST" })
  .validator(
    (d: { fileBase64: string; fileName: string; contentType: string; folder: string }) =>
      z
        .object({
          fileBase64: z.string().min(1),
          fileName: z.string().min(1),
          contentType: z.string().min(1),
          folder: z.string().min(1),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
    const buffer = Buffer.from(data.fileBase64, "base64");
    const path = `${data.folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabaseAdmin.storage
      .from("event-submissions")
      .upload(path, buffer, { contentType: data.contentType, upsert: false });
    if (error) throw new Error("File upload failed: " + error.message);
    const { data: urlData } = supabaseAdmin.storage.from("event-submissions").getPublicUrl(path);
    return { url: urlData.publicUrl };
  });

// ---- Get public URL from path ----
export const getPublicUrl = createServerFn({ method: "POST" })
  .validator(
    (d: { path: string }) =>
      z.object({ path: z.string().min(1) }).parse(d)
  )
  .handler(async ({ data }) => {
    const { data: urlData } = supabaseAdmin.storage
      .from("event-submissions")
      .getPublicUrl(data.path);
    return { url: urlData.publicUrl };
  });

// ---- Submit final project ----
export const submitFinalProject = createServerFn({ method: "POST" })
  .validator(
    (d: {
      teamName: string;
      teamLeadName: string;
      teamLeadContact: string;
      teamLeadEmail: string;
      teammate1: string;
      teammate2: string;
      teammate3: string;
      githubUrl: string;
      deploymentUrl: string;
      pptUrl: string;
      phasesCompleted: number;
      projectSummary: string;
      projectUniqueness: string;
      eventExperience: string;
      feedbackScreenshotUrl: string;
      videoLink: string;
    }) =>
      z
        .object({
          teamName: z.string().min(1),
          teamLeadName: z.string().min(1),
          teamLeadContact: z.string().min(1),
          teamLeadEmail: z.string().email(),
          teammate1: z.string().default(""),
          teammate2: z.string().default(""),
          teammate3: z.string().default(""),
          githubUrl: z.string().min(1),
          deploymentUrl: z.string().min(1),
          pptUrl: z.string().min(1),
          phasesCompleted: z.number().min(1).max(5),
          projectSummary: z.string().default(""),
          projectUniqueness: z.string().default(""),
          eventExperience: z.string().default(""),
          feedbackScreenshotUrl: z.string().min(1),
          videoLink: z.string().default(""),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
    const deadline = new Date("2026-07-28T11:59:00+05:30").getTime();
    if (Date.now() >= deadline) throw new Error("Submissions are closed. The deadline was 11:59 AM IST, 28 July 2026.");
    const { error } = await supabaseAdmin.from("final_submissions").insert({
      team_name: data.teamName,
      team_lead_name: data.teamLeadName,
      team_lead_contact: data.teamLeadContact,
      team_lead_email: data.teamLeadEmail,
      certificate_name: data.teamLeadName,
      teammate_1: data.teammate1,
      teammate_2: data.teammate2,
      teammate_3: data.teammate3,
      github_url: data.githubUrl,
      deployment_url: data.deploymentUrl,
      ppt_url: data.pptUrl,
      phases_completed: data.phasesCompleted,
      project_summary: data.projectSummary,
      project_uniqueness: data.projectUniqueness,
      event_experience: data.eventExperience,
      feedback_screenshot_url: data.feedbackScreenshotUrl,
      video_link: data.videoLink,
    });
    if (error) {
      if (error.code === "23505") throw new Error("A submission from this email already exists");
      throw new Error("Failed to submit. Please try again.");
    }
    return { ok: true };
  });

// ---- Get all final submissions (admin) ----
export const getFinalSubmissions = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("final_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Failed to fetch submissions");
    return data ?? [];
  });

// ---- Update any field (admin) ----
export const updateSubmissionField = createServerFn({ method: "POST" })
  .validator(
    (d: { id: string; field: string; value: string }) =>
      z
        .object({
          id: z.string().uuid(),
          field: z.string(),
          value: z.string(),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
    const allowed = [
      "team_name", "team_lead_name", "team_lead_contact", "team_lead_email", "certificate_name",
      "teammate_1", "teammate_2", "teammate_3",
      "github_url", "deployment_url", "ppt_url",
      "phases_completed", "project_summary", "project_uniqueness",
      "event_experience", "feedback_screenshot_url", "video_link",
      "round_status", "admin_notes",
    ];
    if (!allowed.includes(data.field)) throw new Error("Invalid field");
    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.field === "phases_completed") {
      update[data.field] = parseInt(data.value, 10);
    } else {
      update[data.field] = data.value;
    }
    const { error } = await supabaseAdmin
      .from("final_submissions")
      .update(update)
      .eq("id", data.id);
    if (error) throw new Error("Failed to update");
    return { ok: true };
  });

// ---- Update round status + admin notes (admin) ----
export const updateRoundStatus = createServerFn({ method: "POST" })
  .validator(
    (d: { id: string; roundStatus: string; adminNotes?: string }) =>
      z
        .object({
          id: z.string().uuid(),
          roundStatus: z.string(),
          adminNotes: z.string().optional(),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
    const update: any = {
      round_status: data.roundStatus,
      updated_at: new Date().toISOString(),
    };
    if (data.adminNotes !== undefined) update.admin_notes = data.adminNotes;
    const { error } = await supabaseAdmin
      .from("final_submissions")
      .update(update)
      .eq("id", data.id);
    if (error) throw new Error("Failed to update");
    return { ok: true };
  });

// ---- Get submission by team lead email (public results lookup) ----
export const getSubmissionByEmail = createServerFn({ method: "POST" })
  .validator((d: { email: string }) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data }) => {
    const { data: submission, error } = await supabaseAdmin
      .from("final_submissions")
      .select("*")
      .ilike("team_lead_email", data.email.toLowerCase().trim())
      .maybeSingle();
    if (error) throw new Error("Failed to fetch results");
    if (!submission) return null;
    return submission;
  });
