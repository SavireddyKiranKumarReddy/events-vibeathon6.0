-- Allow all authenticated users to read teams (for leaderboard, etc.)
DROP POLICY IF EXISTS "team lead sees own team" ON public.teams;
CREATE POLICY "any authenticated reads teams" ON public.teams FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to read submissions (for leaderboard)
DROP POLICY IF EXISTS "team reads own submissions" ON public.submissions;
CREATE POLICY "any authenticated reads submissions" ON public.submissions FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to read user_roles
DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
CREATE POLICY "any authenticated reads user_roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
