import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---- Day 2: Get event info (no auth) ----
export const day2GetEvent = createServerFn({ method: "GET" })
  .inputValidator((d: { track: string; slot: number }) =>
    z.object({ track: z.string(), slot: z.number() }).parse(d)
  )
  .handler(async ({ data }) => {
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("id, track, slot, title, start_at, end_at, force_live, manual_lock, answer_key, leaderboard_visible")
      .eq("track", data.track)
      .eq("slot", data.slot)
      .single();
    return event;
  });

// ---- Day 2: Submit answer (simple events: tech3, nontech3, tech5) ----
export const day2SubmitAnswer = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { teamName: string; leadName: string; eventId: string; answer: string; fileUrl?: string }) =>
      z
        .object({
          teamName: z.string().min(1),
          leadName: z.string().min(1),
          eventId: z.string().uuid(),
          answer: z.string().min(1),
          fileUrl: z.string().optional(),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("id, answer_key, track")
      .eq("id", data.eventId)
      .single();
    if (!event) throw new Error("Event not found");

    let autoCorrect: boolean | null = null;
    let score: number | null = null;
    if (event.track === "tech" && event.answer_key) {
      autoCorrect = data.answer.trim().toLowerCase() === event.answer_key.trim().toLowerCase();
      score = autoCorrect ? 1 : 0;
    }

    const insert: any = {
      team_name: data.teamName,
      lead_name: data.leadName,
      event_id: data.eventId,
      answer: data.answer,
      auto_correct: autoCorrect,
      score,
    };
    if (data.fileUrl) insert.file_url = data.fileUrl;

    const { error } = await supabaseAdmin.from("day2_submissions").insert(insert);
    if (error) {
      if (error.code === "23505") throw new Error("You have already submitted for this event");
      throw new Error("Unable to submit. Please try again.");
    }
    return { ok: true, autoCorrect };
  });

// ---- Day 2: Get team's submissions ----
export const day2GetSubmissions = createServerFn({ method: "GET" })
  .inputValidator((d: { teamName: string; leadName: string }) =>
    z.object({ teamName: z.string(), leadName: z.string() }).parse(d)
  )
  .handler(async ({ data }) => {
    const { data: subs } = await supabaseAdmin
      .from("day2_submissions")
      .select("id, event_id, answer, file_url, score, auto_correct, admin_override, submitted_at")
      .eq("team_name", data.teamName)
      .eq("lead_name", data.leadName);
    return subs ?? [];
  });

// ---- Day 2: OSINT - Get progress ----
export const day2GetOsintProgress = createServerFn({ method: "GET" })
  .inputValidator((d: { teamName: string; leadName: string }) =>
    z.object({ teamName: z.string(), leadName: z.string() }).parse(d)
  )
  .handler(async ({ data }) => {
    const { data: progress } = await supabaseAdmin
      .from("day2_osint_progress")
      .select("*")
      .eq("team_name", data.teamName)
      .eq("lead_name", data.leadName)
      .single();
    return progress ?? null;
  });

// ---- Day 2: OSINT - Get questions (without answers) ----
export const day2GetOsintQuestions = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: config } = await supabaseAdmin
      .from("day2_config")
      .select("config")
      .eq("challenge_key", "osint_questions")
      .single();
    if (!config) return null;
    const cfg = config.config as any;
    return {
      levels: (cfg.levels ?? []).map((l: any) => ({
        level: l.level,
        name: l.name,
        color: l.color,
        questions: l.questions.map((q: any) => ({ q: q.q })),
      })),
      intelFiles: (cfg.intel_files ?? []).map((f: any) => ({
        file: f.file,
        q: f.q,
      })),
      skipChances: cfg.skip_chances ?? 3,
    };
  });

// ---- Day 2: OSINT - Submit answer ----
export const day2SubmitOsintAnswer = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { teamName: string; leadName: string; questionIndex: number; answer: string }) =>
      z
        .object({
          teamName: z.string().min(1),
          leadName: z.string().min(1),
          questionIndex: z.number().min(0),
          answer: z.string().min(1),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
    const { data: config } = await supabaseAdmin
      .from("day2_config")
      .select("config")
      .eq("challenge_key", "osint_questions")
      .single();
    if (!config) throw new Error("OSINT config not found");

    const cfg = config.config as any;
    const allQuestions: { q: string; answer: string }[] = [];
    for (const level of cfg.levels ?? []) {
      for (const question of level.questions ?? []) {
        allQuestions.push({ q: question.q, answer: question.answer });
      }
    }
    for (const intel of cfg.intel_files ?? []) {
      allQuestions.push({ q: intel.q, answer: intel.answer });
    }

    if (data.questionIndex >= allQuestions.length) throw new Error("Invalid question index");

    const correctAnswer = allQuestions[data.questionIndex].answer;
    const isCorrect = data.answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

    const { data: existing } = await supabaseAdmin
      .from("day2_osint_progress")
      .select("*")
      .eq("team_name", data.teamName)
      .eq("lead_name", data.leadName)
      .single();

    const totalQuestions = allQuestions.length;

    if (!existing) {
      const answers = [{ index: data.questionIndex, answer: data.answer, correct: isCorrect }];
      const nextQ = isCorrect ? data.questionIndex + 1 : data.questionIndex;
      const completed = nextQ >= totalQuestions;
      await supabaseAdmin.from("day2_osint_progress").insert({
        team_name: data.teamName,
        lead_name: data.leadName,
        current_question: nextQ,
        total_correct: isCorrect ? 1 : 0,
        total_skipped: 0,
        skips_remaining: cfg.skip_chances ?? 3,
        answers,
        completed,
      });
      return { correct: isCorrect, nextQuestion: nextQ, completed, skipsRemaining: cfg.skip_chances ?? 3, totalCorrect: isCorrect ? 1 : 0 };
    }

    const prevAnswers = (existing.answers as any[]) ?? [];
    const newAnswer = { index: data.questionIndex, answer: data.answer, correct: isCorrect };
    const answers = [...prevAnswers, newAnswer];
    const totalCorrect = answers.filter((a: any) => a.correct).length;
    const nextQ = isCorrect ? Math.max(existing.current_question, data.questionIndex + 1) : existing.current_question;
    const completed = nextQ >= totalQuestions;

    await supabaseAdmin
      .from("day2_osint_progress")
      .update({
        current_question: nextQ,
        total_correct: totalCorrect,
        answers,
        completed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    return {
      correct: isCorrect,
      nextQuestion: nextQ,
      completed,
      skipsRemaining: existing.skips_remaining,
      totalCorrect,
    };
  });

// ---- Day 2: OSINT - Skip question ----
export const day2SkipOsintQuestion = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { teamName: string; leadName: string; questionIndex: number }) =>
      z
        .object({
          teamName: z.string().min(1),
          leadName: z.string().min(1),
          questionIndex: z.number().min(0),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
    const { data: existing } = await supabaseAdmin
      .from("day2_osint_progress")
      .select("*")
      .eq("team_name", data.teamName)
      .eq("lead_name", data.leadName)
      .single();

    if (!existing) throw new Error("No OSINT session found. Answer at least one question first.");
    if (existing.completed) throw new Error("Challenge already completed.");
    if (existing.skips_remaining <= 0) throw new Error("No skips remaining.");

    const prevAnswers = (existing.answers as any[]) ?? [];
    const answers = [...prevAnswers, { index: data.questionIndex, answer: "__SKIPPED__", correct: false, skipped: true }];

    await supabaseAdmin
      .from("day2_osint_progress")
      .update({
        total_skipped: existing.total_skipped + 1,
        skips_remaining: existing.skips_remaining - 1,
        answers,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    return { ok: true, skipsRemaining: existing.skips_remaining - 1 };
  });

// ---- Day 2: Get challenge config (strips answers) ----
export const day2GetChallengeConfig = createServerFn({ method: "GET" })
  .inputValidator((d: { challengeKey: string }) =>
    z.object({ challengeKey: z.string() }).parse(d)
  )
  .handler(async ({ data }) => {
    const { data: config } = await supabaseAdmin
      .from("day2_config")
      .select("config")
      .eq("challenge_key", data.challengeKey)
      .single();
    if (!config) return null;
    const cfg = JSON.parse(JSON.stringify(config.config));
    if (Array.isArray(cfg.questions)) {
      cfg.questions = cfg.questions.map((q: any) => {
        const { answer, ...rest } = q;
        return rest;
      });
    }
    return cfg;
  });

// ---- Day 2: Grade DevTools CTF answers server-side ----
export const day2GradeDevToolsCtf = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { teamName: string; leadName: string; eventId: string; answers: string[] }) =>
      z
        .object({
          teamName: z.string().min(1),
          leadName: z.string().min(1),
          eventId: z.string().uuid(),
          answers: z.array(z.string()),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
    const { data: config } = await supabaseAdmin
      .from("day2_config")
      .select("config")
      .eq("challenge_key", "devtools_ctf")
      .single();
    if (!config) throw new Error("DevTools CTF config not found");

    const cfg = config.config as any;
    const questions: { q: string; answer: string }[] = cfg.questions ?? [];
    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      const userAns = (data.answers[i] ?? "").trim().toLowerCase();
      const correctAns = questions[i].answer.trim().toLowerCase();
      if (userAns === correctAns) score++;
    }

    const insert: any = {
      team_name: data.teamName,
      lead_name: data.leadName,
      event_id: data.eventId,
      answer: JSON.stringify({ answers: data.answers, score }),
      auto_correct: score === questions.length,
      score,
    };

    const { error } = await supabaseAdmin.from("day2_submissions").insert(insert);
    if (error) {
      if (error.code === "23505") throw new Error("You have already submitted for this event");
      throw new Error("Unable to submit. Please try again.");
    }
    return { ok: true, score, total: questions.length };
  });

// ---- Day 2: Grade Speed Quiz (server-side) ----
export const day2GradeSpeedQuiz = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { teamName: string; leadName: string; eventId: string; answers: string[]; timeTaken: number }) =>
      z
        .object({
          teamName: z.string().min(1),
          leadName: z.string().min(1),
          eventId: z.string().uuid(),
          answers: z.array(z.string()),
          timeTaken: z.number().min(0),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
    const { data: config } = await supabaseAdmin
      .from("day2_config")
      .select("config")
      .eq("challenge_key", "speed_quiz")
      .single();
    if (!config) throw new Error("Speed Quiz config not found");

    const cfg = config.config as any;
    const questions: { q: string; options: string[]; answer: string }[] = cfg.questions ?? [];
    const timeLimit = cfg.time_limit ?? 300;

    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      const userAns = (data.answers[i] ?? "").trim().toLowerCase();
      const correctAns = questions[i].answer.trim().toLowerCase();
      if (userAns === correctAns) correct++;
    }

    const timeRemaining = Math.max(0, timeLimit - data.timeTaken);
    const quizScore = correct * 10 + timeRemaining * 2;

    const insert: any = {
      team_name: data.teamName,
      lead_name: data.leadName,
      event_id: data.eventId,
      answer: JSON.stringify({ answers: data.answers, correct, timeTaken: data.timeTaken, timeRemaining }),
      auto_correct: correct === questions.length,
      score: quizScore,
    };

    const { error } = await supabaseAdmin.from("day2_submissions").insert(insert);
    if (error) {
      if (error.code === "23505") throw new Error("You have already submitted for this event");
      throw new Error("Unable to submit. Please try again.");
    }
    return { ok: true, correct, total: questions.length, timeRemaining, quizScore };
  });

// ---- Day 2: Leaderboard ----
export const day2GetLeaderboard = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: settings } = await supabaseAdmin
      .from("day2_settings")
      .select("setting_value")
      .eq("setting_key", "leaderboard_visible")
      .single();
    const visible = (settings?.setting_value as any)?.visible ?? true;
    if (!visible) return { visible: false, events: [], submissions: [], osintProgress: [] };

    const { data: events } = await supabaseAdmin
      .from("events")
      .select("id, track, slot, title")
      .in("slot", [3, 4, 5]);

    const { data: subs } = await supabaseAdmin
      .from("day2_submissions")
      .select("event_id, team_name, lead_name, score, auto_correct, admin_override, submitted_at");

    const { data: osintProgress } = await supabaseAdmin
      .from("day2_osint_progress")
      .select("team_name, lead_name, total_correct, total_skipped, completed");

    return { visible: true, events: events ?? [], submissions: subs ?? [], osintProgress: osintProgress ?? [] };
  });

// ---- Day 2: Admin - List all submissions ----
export const day2AdminListSubmissions = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: subs } = await supabaseAdmin
      .from("day2_submissions")
      .select("id, team_name, lead_name, event_id, answer, file_url, score, auto_correct, admin_override, submitted_at")
      .order("submitted_at", { ascending: true });

    const { data: events } = await supabaseAdmin
      .from("events")
      .select("id, track, slot, title, answer_key");

    const { data: osintProgress } = await supabaseAdmin
      .from("day2_osint_progress")
      .select("*")
      .order("created_at", { ascending: true });

    const { data: lbSetting } = await supabaseAdmin
      .from("day2_settings")
      .select("setting_value")
      .eq("setting_key", "leaderboard_visible")
      .single();

    const leaderboardVisible = (lbSetting?.setting_value as any)?.visible ?? true;

    return { submissions: subs ?? [], events: events ?? [], osintProgress: osintProgress ?? [], leaderboardVisible };
  });

// ---- Day 2: Admin - Override submission ----
export const day2AdminOverrideSubmission = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { id: string; override: boolean | null; score?: number }) =>
      z
        .object({
          id: z.string().uuid(),
          override: z.boolean().nullable(),
          score: z.number().optional(),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
    const update: any = { admin_override: data.override };
    if (data.score !== undefined) update.score = data.score;
    const { error } = await supabaseAdmin
      .from("day2_submissions")
      .update(update)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Day 2: Admin - Update config ----
export const day2AdminUpdateConfig = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { challengeKey: string; config: any }) =>
      z
        .object({
          challengeKey: z.string(),
          config: z.any(),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("day2_config")
      .upsert({ challenge_key: data.challengeKey, config: data.config, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Day 2: Admin - Update settings ----
export const day2AdminUpdateSetting = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { settingKey: string; value: any }) =>
      z
        .object({
          settingKey: z.string(),
          value: z.any(),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("day2_settings")
      .upsert({ setting_key: data.settingKey, setting_value: data.value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
