-- 1) Add new columns to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS test_emails text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS force_live boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS live_at timestamptz;

-- 2) Update column-level GRANT to include new columns for authenticated users
REVOKE SELECT ON public.events FROM authenticated;
GRANT SELECT (id, track, slot, title, question, start_at, end_at, leaderboard_visible, manual_lock, created_at, test_emails, force_live, live_at) ON public.events TO authenticated;
GRANT SELECT ON public.events TO service_role;

-- 3) Update event_is_open to respect force_live, test_emails, live_at
CREATE OR REPLACE FUNCTION public.event_is_open(_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  e_track event_track;
  e_start timestamptz;
  e_end timestamptz;
  e_manual boolean;
  e_force_live boolean;
  e_live_at timestamptz;
  e_test_emails text[];
  next_start timestamptz;
  locks_at timestamptz;
  effective_start timestamptz;
  user_email text;
BEGIN
  SELECT track, start_at, end_at, manual_lock, force_live, live_at, test_emails
    INTO e_track, e_start, e_end, e_manual, e_force_live, e_live_at, e_test_emails
    FROM public.events WHERE id = _event_id;
  IF NOT FOUND OR e_manual THEN RETURN false; END IF;

  -- Check if caller is a test email (via auth.users)
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();

  -- Event is open if: force_live is on, OR user email is in test_emails, OR effective start time has passed
  IF e_force_live THEN
    -- force_live: open for everyone, lock at end_at if set
    IF e_end IS NOT NULL AND now() >= e_end THEN RETURN false; END IF;
    RETURN true;
  END IF;

  IF user_email IS NOT NULL AND e_test_emails IS NOT NULL AND user_email = ANY(e_test_emails) THEN
    -- Test email: open regardless of time, lock at end_at if set
    IF e_end IS NOT NULL AND now() >= e_end THEN RETURN false; END IF;
    RETURN true;
  END IF;

  -- Default: use live_at if set, otherwise fall back to start_at
  effective_start := COALESCE(e_live_at, e_start);
  IF now() < effective_start THEN RETURN false; END IF;

  SELECT MIN(start_at) INTO next_start FROM public.events
    WHERE track = e_track AND start_at > e_start;
  locks_at := COALESCE(next_start, e_end);
  IF locks_at IS NOT NULL AND now() >= locks_at THEN RETURN false; END IF;
  RETURN true;
END;
$$;
