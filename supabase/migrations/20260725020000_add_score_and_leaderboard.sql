-- 1) Add score column to submissions (tech: 1=correct/0=wrong, nontech: seconds taken)
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS score integer;

-- 2) Update grade_submission trigger to also set score for tech events
CREATE OR REPLACE FUNCTION public.grade_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key text;
  ev_track event_track;
BEGIN
  SELECT lower(btrim(answer_key)), track INTO key, ev_track FROM public.events WHERE id = NEW.event_id;
  NEW.auto_correct := (key IS NOT NULL AND key <> '' AND lower(btrim(NEW.answer)) = key);
  IF ev_track = 'tech' THEN
    NEW.score := CASE WHEN NEW.auto_correct THEN 1 ELSE 0 END;
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Grant authenticated users to see score column
REVOKE SELECT ON public.submissions FROM authenticated;
GRANT SELECT (id, event_id, team_id, answer, submitted_at, auto_correct, admin_override, score) ON public.submissions TO authenticated;
GRANT SELECT ON public.submissions TO service_role;

-- 4) Force live both event 1s + enable leaderboards
UPDATE public.events
SET force_live = true, leaderboard_visible = true
WHERE (track = 'tech' AND slot = 1) OR (track = 'nontech' AND slot = 1);

-- 5) Ensure correct answer keys
UPDATE public.events SET answer_key = 'Welcome to vibeathon 6.0' WHERE track = 'tech' AND slot = 1;
UPDATE public.events SET answer_key = 'solved' WHERE track = 'nontech' AND slot = 1;

-- 6) Grade any existing tech submissions
UPDATE public.submissions s
SET auto_correct = (lower(btrim(s.answer)) = lower(btrim(e.answer_key))),
    score = CASE WHEN lower(btrim(s.answer)) = lower(btrim(e.answer_key)) THEN 1 ELSE 0 END
FROM public.events e
WHERE s.event_id = e.id AND e.track = 'tech';
