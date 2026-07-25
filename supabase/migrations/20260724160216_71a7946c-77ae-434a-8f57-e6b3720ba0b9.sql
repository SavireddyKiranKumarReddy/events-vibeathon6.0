
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Teams
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  lead_name text NOT NULL,
  lead_email text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team lead sees own team" ON public.teams FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manages teams" ON public.teams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Events
CREATE TYPE public.event_track AS ENUM ('tech', 'nontech');

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track public.event_track NOT NULL,
  slot int NOT NULL CHECK (slot BETWEEN 1 AND 8),
  title text NOT NULL,
  question text NOT NULL DEFAULT '',
  answer_key text NOT NULL DEFAULT '',
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  leaderboard_visible boolean NOT NULL DEFAULT false,
  manual_lock boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (track, slot)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manages events" ON public.events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Helper: event open now?
CREATE OR REPLACE FUNCTION public.event_is_open(_event_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  e public.events%ROWTYPE;
  next_start timestamptz;
  locks_at timestamptz;
BEGIN
  SELECT * INTO e FROM public.events WHERE id = _event_id;
  IF NOT FOUND OR e.manual_lock THEN RETURN false; END IF;
  IF now() < e.start_at THEN RETURN false; END IF;
  SELECT MIN(start_at) INTO next_start FROM public.events
    WHERE track = e.track AND start_at > e.start_at;
  locks_at := COALESCE(next_start, e.end_at);
  IF locks_at IS NOT NULL AND now() >= locks_at THEN RETURN false; END IF;
  RETURN true;
END;
$$;

-- Submissions
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  answer text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  auto_correct boolean NOT NULL DEFAULT false,
  admin_override boolean,
  UNIQUE (event_id, team_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team reads own submissions" ON public.submissions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
  );
CREATE POLICY "team inserts own submission when open" ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (
    team_id IN (SELECT id FROM public.teams WHERE user_id = auth.uid())
    AND public.event_is_open(event_id)
  );
CREATE POLICY "admin updates submissions" ON public.submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-grade + link user trigger on submission insert
CREATE OR REPLACE FUNCTION public.grade_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  key text;
BEGIN
  SELECT lower(btrim(answer_key)) INTO key FROM public.events WHERE id = NEW.event_id;
  NEW.auto_correct := (key IS NOT NULL AND key <> '' AND lower(btrim(NEW.answer)) = key);
  RETURN NEW;
END;
$$;
CREATE TRIGGER grade_submission_trigger BEFORE INSERT ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.grade_submission();

-- New-user trigger: assign role, link team
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  em text := lower(NEW.email);
BEGIN
  IF em = 'kiransavireddy@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  ELSIF EXISTS (SELECT 1 FROM public.teams WHERE lower(lead_email) = em) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
      ON CONFLICT DO NOTHING;
    UPDATE public.teams SET user_id = NEW.id WHERE lower(lead_email) = em;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Pre-seed 16 events. Times in Asia/Kolkata (IST, UTC+5:30).
INSERT INTO public.events (track, slot, title, start_at) VALUES
  ('tech',    1, 'Tech Event 1',    '2026-07-25 12:01:00+05:30'),
  ('tech',    2, 'Tech Event 2',    '2026-07-25 16:00:00+05:30'),
  ('tech',    3, 'Tech Event 3',    '2026-07-26 08:00:00+05:30'),
  ('tech',    4, 'Tech Event 4',    '2026-07-26 16:00:00+05:30'),
  ('tech',    5, 'Tech Event 5',    '2026-07-26 22:00:00+05:30'),
  ('tech',    6, 'Tech Event 6',    '2026-07-27 08:00:00+05:30'),
  ('tech',    7, 'Tech Event 7',    '2026-07-27 16:00:00+05:30'),
  ('tech',    8, 'Tech Event 8',    '2026-07-27 22:00:00+05:30'),
  ('nontech', 1, 'Non-Tech Event 1','2026-07-25 12:01:00+05:30'),
  ('nontech', 2, 'Non-Tech Event 2','2026-07-25 16:00:00+05:30'),
  ('nontech', 3, 'Non-Tech Event 3','2026-07-26 08:00:00+05:30'),
  ('nontech', 4, 'Non-Tech Event 4','2026-07-26 16:00:00+05:30'),
  ('nontech', 5, 'Non-Tech Event 5','2026-07-26 22:00:00+05:30'),
  ('nontech', 6, 'Non-Tech Event 6','2026-07-27 08:00:00+05:30'),
  ('nontech', 7, 'Non-Tech Event 7','2026-07-27 16:00:00+05:30'),
  ('nontech', 8, 'Non-Tech Event 8','2026-07-27 22:00:00+05:30');

-- Event 8 end_at (24h after start) as default
UPDATE public.events SET end_at = start_at + interval '24 hours' WHERE slot = 8;
