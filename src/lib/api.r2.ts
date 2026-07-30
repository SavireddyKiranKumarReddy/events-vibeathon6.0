import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const checkR2Eligibility = createServerFn({ method: "POST" })
  .validator((d: { email: string }) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data }) => {
    const { data: submission, error } = await supabaseAdmin
      .from("final_submissions")
      .select("id, team_name, team_lead_name, team_lead_email, team_lead_contact, teammate_1, teammate_2, teammate_3, github_url, deployment_url, ppt_url, video_link, phases_completed, project_summary, project_uniqueness")
      .ilike("team_lead_email", data.email.toLowerCase().trim())
      .eq("round_status", "round_2")
      .maybeSingle();
    if (error) throw new Error("Failed to check eligibility");
    if (!submission) return null;
    return submission;
  });

export const submitR2Project = createServerFn({ method: "POST" })
  .validator(
    (d: {
      teamName: string; teamLeadName: string; teamLeadContact: string; teamLeadEmail: string;
      teammate1: string; teammate2: string; teammate3: string;
      githubUrl: string; deploymentUrl: string; pptUrl: string;
      phasesCompleted: number;
      projectSummary: string; projectUniqueness: string; uniqueFeatures: string;
      videoLink: string;
      llmsUsed: string; vibecodingTools: string; databaseUsed: string; oauthExists: string;
      developmentFlow: string; techStackUsed: string;
    }) =>
      z.object({
        teamName: z.string().min(1), teamLeadName: z.string().min(1),
        teamLeadContact: z.string().min(1), teamLeadEmail: z.string().email(),
        teammate1: z.string().default(""), teammate2: z.string().default(""), teammate3: z.string().default(""),
        githubUrl: z.string().min(1), deploymentUrl: z.string().min(1), pptUrl: z.string().min(1),
        phasesCompleted: z.number().min(1).max(5),
        projectSummary: z.string().default(""), projectUniqueness: z.string().default(""), uniqueFeatures: z.string().default(""),
        videoLink: z.string().default(""),
        llmsUsed: z.string().default(""), vibecodingTools: z.string().default(""),
        databaseUsed: z.string().default(""), oauthExists: z.string().default(""),
        developmentFlow: z.string().default(""), techStackUsed: z.string().default(""),
      }).parse(d)
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("r2_submissions").insert({
      team_name: data.teamName, team_lead_name: data.teamLeadName,
      team_lead_contact: data.teamLeadContact, team_lead_email: data.teamLeadEmail,
      teammate_1: data.teammate1, teammate_2: data.teammate2, teammate_3: data.teammate3,
      github_url: data.githubUrl, deployment_url: data.deploymentUrl, ppt_url: data.pptUrl,
      phases_completed: data.phasesCompleted,
      project_summary: data.projectSummary, project_uniqueness: data.projectUniqueness,
      unique_features: data.uniqueFeatures,
      video_link: data.videoLink,
      llms_used: data.llmsUsed, vibecoding_tools: data.vibecodingTools,
      database_used: data.databaseUsed, oauth_exists: data.oauthExists,
      development_flow: data.developmentFlow, tech_stack_used: data.techStackUsed,
    });
    if (error) {
      if (error.code === "23505") throw new Error("A submission from this email already exists");
      throw new Error("Failed to submit. Please try again.");
    }
    return { ok: true };
  });

export const getR2Submissions = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("r2_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Failed to fetch submissions");
    return data ?? [];
  });

export const updateR2SubmissionField = createServerFn({ method: "POST" })
  .validator((d: { id: string; field: string; value: string }) =>
    z.object({ id: z.string().uuid(), field: z.string(), value: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const allowed = [
      "team_name", "team_lead_name", "team_lead_contact", "team_lead_email",
      "teammate_1", "teammate_2", "teammate_3",
      "github_url", "deployment_url", "ppt_url",
      "phases_completed", "project_summary", "project_uniqueness", "unique_features",
      "video_link", "llms_used", "vibecoding_tools", "database_used", "oauth_exists",
      "development_flow", "tech_stack_used",
      "round_status", "admin_notes",
    ];
    if (!allowed.includes(data.field)) throw new Error("Invalid field");
    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.field === "phases_completed") {
      update[data.field] = parseInt(data.value, 10);
    } else {
      update[data.field] = data.value;
    }
    const { error } = await supabaseAdmin.from("r2_submissions").update(update).eq("id", data.id);
    if (error) throw new Error("Failed to update");
    return { ok: true };
  });

export const updateR2RoundStatus = createServerFn({ method: "POST" })
  .validator((d: { id: string; roundStatus: string; adminNotes?: string }) =>
    z.object({ id: z.string().uuid(), roundStatus: z.string(), adminNotes: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const update: any = { round_status: data.roundStatus, updated_at: new Date().toISOString() };
    if (data.adminNotes !== undefined) update.admin_notes = data.adminNotes;
    const { error } = await supabaseAdmin.from("r2_submissions").update(update).eq("id", data.id);
    if (error) throw new Error("Failed to update");
    return { ok: true };
  });

export const verifyR2Admin = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) =>
    z.object({ email: z.string().email(), password: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    if (data.email.toLowerCase() === "kiransavireddy@gmail.com" && data.password === "R2adminR2") {
      return { ok: true };
    }
    return { ok: false };
  });
