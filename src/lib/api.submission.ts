import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
          githubUrl: z.string().url(),
          deploymentUrl: z.string().url(),
          pptUrl: z.string().url(),
          phasesCompleted: z.number().min(1).max(5),
          projectSummary: z.string().min(1).max(500),
          projectUniqueness: z.string().min(1).max(500),
          eventExperience: z.string().min(1, "Please share your experience"),
          feedbackScreenshotUrl: z.string().min(1, "Please upload your feedback screenshot"),
          videoLink: z.string().default(""),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
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
