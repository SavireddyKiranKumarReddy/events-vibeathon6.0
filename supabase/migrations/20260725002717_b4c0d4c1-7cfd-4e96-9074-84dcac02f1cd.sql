
-- 1) Restrict answer_key column on events to admins/service_role
REVOKE SELECT ON public.events FROM authenticated;
GRANT SELECT (id, track, slot, title, question, start_at, end_at, leaderboard_visible, manual_lock, created_at) ON public.events TO authenticated;
GRANT SELECT ON public.events TO service_role;

-- 2) Convert helper functions to SECURITY INVOKER (they only read data the caller can already read under RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

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
  next_start timestamptz;
  locks_at timestamptz;
BEGIN
  SELECT track, start_at, end_at, manual_lock
    INTO e_track, e_start, e_end, e_manual
    FROM public.events WHERE id = _event_id;
  IF NOT FOUND OR e_manual THEN RETURN false; END IF;
  IF now() < e_start THEN RETURN false; END IF;
  SELECT MIN(start_at) INTO next_start FROM public.events
    WHERE track = e_track AND start_at > e_start;
  locks_at := COALESCE(next_start, e_end);
  IF locks_at IS NOT NULL AND now() >= locks_at THEN RETURN false; END IF;
  RETURN true;
END;
$$;

-- 3) Revoke execute on internal trigger-only functions from public/authenticated
REVOKE ALL ON FUNCTION public.grade_submission() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
