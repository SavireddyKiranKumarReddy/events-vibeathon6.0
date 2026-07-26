-- Day 2 tables for Vibeathon 6.0 (no-auth challenge system)

-- 1) Day 2 submissions (general for all Day 2 events)
CREATE TABLE IF NOT EXISTS public.day2_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  lead_name text NOT NULL,
  event_id uuid NOT NULL REFERENCES public.events(id),
  answer text,
  file_url text,
  score integer,
  auto_correct boolean,
  admin_override boolean,
  submitted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_day2_subs_event ON public.day2_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_day2_subs_team ON public.day2_submissions(team_name, lead_name);

-- 2) Day 2 OSINT progress (per-question tracking for Tech 4)
CREATE TABLE IF NOT EXISTS public.day2_osint_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  lead_name text NOT NULL,
  current_question integer DEFAULT 0,
  total_correct integer DEFAULT 0,
  total_skipped integer DEFAULT 0,
  skips_remaining integer DEFAULT 3,
  answers jsonb DEFAULT '[]'::jsonb,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_name, lead_name)
);

-- 3) Day 2 challenge config (admin-editable answers)
CREATE TABLE IF NOT EXISTS public.day2_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_key text NOT NULL UNIQUE,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- 4) Day 2 leaderboard visibility
CREATE TABLE IF NOT EXISTS public.day2_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Insert default Day 2 settings
INSERT INTO public.day2_settings (setting_key, setting_value) VALUES
  ('leaderboard_visible', 'true'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- 5) Insert default OSINT challenge config (Tech 4)
INSERT INTO public.day2_config (challenge_key, config) VALUES
('osint_questions', '{
  "levels": [
    {
      "level": 1,
      "name": "Company Intelligence",
      "color": "green",
      "questions": [
        {"q": "What is the full legal name of NxtGenSec?", "answer": "NxtGenSec"},
        {"q": "What is the Startup India Recognition ID?", "answer": "DIPP99872"},
        {"q": "What is the official tagline of NxtGenSec?", "answer": "Building the Future of Security"},
        {"q": "What is the official website URL?", "answer": "nxtgensec.org"}
      ]
    },
    {
      "level": 2,
      "name": "Product Intelligence",
      "color": "yellow",
      "questions": [
        {"q": "NxtGenSec has its own AI product. What is its name?", "answer": "AwMate"},
        {"q": "What is the primary purpose of this product?", "answer": "Assistive Workmate"},
        {"q": "Which technologies are mentioned on the product page?", "answer": "AI"},
        {"q": "Find one feature that makes the product unique.", "answer": "workplace assistance"}
      ]
    },
    {
      "level": 3,
      "name": "Community Investigation",
      "color": "orange",
      "questions": [
        {"q": "During Vibeathon 5.0, best performers received access to a specific AI/Vibe Coding tool. What was the tool?", "answer": "Lovable"},
        {"q": "Which college had the highest participation in Vibeathon 6.0 registrations?", "answer": "GITAM"},
        {"q": "Which internship track focuses on full-stack development?", "answer": "Full Stack Development"},
        {"q": "Find the first official announcement of Vibeathon 6.0.", "answer": "Instagram"}
      ]
    },
    {
      "level": 4,
      "name": "Social Media Investigation",
      "color": "blue",
      "questions": [
        {"q": "On what date was the first official Instagram post published?", "answer": "2025"},
        {"q": "What was the topic of that first Instagram post?", "answer": "Vibeathon"},
        {"q": "Which social platform reached the milestone first?", "answer": "Instagram"},
        {"q": "Which post has received the highest engagement so far?", "answer": "Vibeathon 6.0 announcement"}
      ]
    },
    {
      "level": 5,
      "name": "Website Investigation",
      "color": "purple",
      "questions": [
        {"q": "NxtGenSec interns developed a beautiful website. Find its URL.", "answer": "events.vibeathon.nxtgensec.org"},
        {"q": "Which intern built the frontend? (Intern ID)", "answer": "intern"},
        {"q": "Which intern built the backend? (Intern ID)", "answer": "intern"},
        {"q": "What technologies power that website?", "answer": "React"},
        {"q": "What domain or subdomain is it hosted on?", "answer": "nxtgensec.org"}
      ]
    }
  ],
  "intel_files": [
    {"file": 7, "q": "Find the NxtGenSec school website URL.", "answer": "vidvasschool.vercel.app"},
    {"file": 8, "q": "There is a small mistake on the school website. One social media icon points to a platform that does not exist for the school. Name that platform.", "answer": "Linkedin"},
    {"file": 9, "q": "Find the highest student rank mentioned in 2025 (out of 600).", "answer": "595"}
  ],
  "skip_chances": 3
}'::jsonb)
ON CONFLICT (challenge_key) DO NOTHING;

-- 6) Insert default Dev Tools CTF config (Tech 5)
INSERT INTO public.day2_config (challenge_key, config) VALUES
('devtools_ctf', '{
  "questions": [
    {"q": "What does CLI stand for?", "answer": "Command Line Interface"},
    {"q": "Which tool is used for version control?", "answer": "Git"},
    {"q": "What is the default port for HTTP?", "answer": "80"},
    {"q": "Which command lists files in Linux?", "answer": "ls"},
    {"q": "What does Docker primarily use to package applications?", "answer": "Containers"},
    {"q": "Which tool is used for package management in JavaScript?", "answer": "npm"},
    {"q": "What does CSS stand for?", "answer": "Cascading Style Sheets"},
    {"q": "Which protocol is used for secure web traffic?", "answer": "HTTPS"},
    {"q": "What is the purpose of a firewall?", "answer": "Network security"},
    {"q": "Which tool is used for continuous integration and deployment?", "answer": "Jenkins"}
  ]
}'::jsonb)
ON CONFLICT (challenge_key) DO NOTHING;

-- 7) Set answer keys for Day 2 tech events
UPDATE public.events SET answer_key = 'Congrats_you_found_M3' WHERE track = 'tech' AND slot = 3;

-- 8) RLS policies for Day 2 tables (public access, no auth needed)
ALTER TABLE public.day2_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day2_osint_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day2_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day2_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/write day2_submissions
CREATE POLICY "public read day2_submissions" ON public.day2_submissions FOR SELECT USING (true);
CREATE POLICY "public insert day2_submissions" ON public.day2_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "public update day2_submissions" ON public.day2_submissions FOR UPDATE USING (true);

-- Allow anyone to read/write day2_osint_progress
CREATE POLICY "public read day2_osint" ON public.day2_osint_progress FOR SELECT USING (true);
CREATE POLICY "public insert day2_osint" ON public.day2_osint_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "public update day2_osint" ON public.day2_osint_progress FOR UPDATE USING (true);

-- Allow anyone to read day2_config and day2_settings
CREATE POLICY "public read day2_config" ON public.day2_config FOR SELECT USING (true);
CREATE POLICY "public update day2_config" ON public.day2_config FOR UPDATE USING (true);
CREATE POLICY "public read day2_settings" ON public.day2_settings FOR SELECT USING (true);
CREATE POLICY "public update day2_settings" ON public.day2_settings FOR UPDATE USING (true);
