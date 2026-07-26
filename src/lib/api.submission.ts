import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---- Submit final project ----
export const submitFinalProject = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      teamLeadName: string;
      teamLeadContact: string;
      teamLeadEmail: string;
      certificateName: string;
      teammate1: string;
      teammate2: string;
      teammate3: string;
      githubUrl: string;
      deploymentUrl: string;
      phasesCompleted: number;
      projectSummary: string;
      projectUniqueness: string;
    }) =>
      z
        .object({
          teamLeadName: z.string().min(1),
          teamLeadContact: z.string().min(1),
          teamLeadEmail: z.string().email(),
          certificateName: z.string().min(1),
          teammate1: z.string().default(""),
          teammate2: z.string().default(""),
          teammate3: z.string().default(""),
          githubUrl: z.string().url(),
          deploymentUrl: z.string().url(),
          phasesCompleted: z.number().min(0).max(10),
          projectSummary: z.string().min(1).max(500),
          projectUniqueness: z.string().min(1).max(500),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("final_submissions").insert({
      team_lead_name: data.teamLeadName,
      team_lead_contact: data.teamLeadContact,
      team_lead_email: data.teamLeadEmail,
      certificate_name: data.certificateName,
      teammate_1: data.teammate1,
      teammate_2: data.teammate2,
      teammate_3: data.teammate3,
      github_url: data.githubUrl,
      deployment_url: data.deploymentUrl,
      phases_completed: data.phasesCompleted,
      project_summary: data.projectSummary,
      project_uniqueness: data.projectUniqueness,
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

// ---- Update round status (admin) ----
export const updateRoundStatus = createServerFn({ method: "POST" })
  .inputValidator(
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
