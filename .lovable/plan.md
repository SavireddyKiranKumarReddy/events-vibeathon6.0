
# Vibeathon Events Platform — PRD & Build Plan

A minimalist, professional events platform for running Vibeathon tech and non-tech competitions. Glassmorphism UI, pure black background, white text, orange accents only.

## 1. Users & Access

- **Auth:** Google sign-in only. No email/password, no other providers.
- **Allowlist:** Only team-lead emails pre-added by admin can sign in. Any other Google account is rejected immediately with a clean "Access denied" screen and signed out.
- **Roles:**
  - `admin` — full control. `kiransavireddy@gmail.com` is auto-granted admin on first Google login.
  - `user` (team lead) — one account per team. Cannot edit team name/lead name/email.
- **Team profile (created by admin):** team name, team lead name, team lead email (email is the login key, immutable by user).

## 2. Events Structure

Two tracks: **Tech** and **Non-Tech**. Each track has **8 events** across 3 days.

Fixed schedule (exact times, regardless of who finished what):

| # | Day | Start time |
|---|-----|------------|
| 1 | Jul 25 | 12:01 PM |
| 2 | Jul 25 | 4:00 PM |
| 3 | Jul 26 | 8:00 AM |
| 4 | Jul 26 | 4:00 PM |
| 5 | Jul 26 | 10:00 PM |
| 6 | Jul 27 | 8:00 AM |
| 7 | Jul 27 | 4:00 PM |
| 8 | Jul 27 | 10:00 PM |

- Each event **auto-unlocks** at its start time and **auto-locks** the moment the next event in that track starts. Event 8 locks at an admin-set end time.
- Times are the same for tech and non-tech tracks (parallel).
- Server-authoritative clock — no client-side bypass.

## 3. Event Format

- **1 text question, 1 text answer, single submit.**
- Admin defines: title, question text, correct answer, track, day, start time.
- Team lead sees the question only while the event window is open.
- Submission is **final** — cannot edit or resubmit.
- Submission stores: team, answer text, submitted-at (server timestamp, ms precision).

## 4. Scoring & Leaderboard

- **Auto-grading:** exact match to admin's answer key (case- and whitespace-insensitive).
- **Admin override:** admin can flip any submission's correct/incorrect flag manually.
- **Rank within an event:** first correct submission wins; then 2nd correct, 3rd correct, etc., ordered by submitted-at.
- **Leaderboards:**
  - Per-event leaderboard (visible after event closes).
  - Overall leaderboard per track (sum of wins / correct counts).
  - **Visibility toggle:** each leaderboard has an admin switch — on = visible to all team leads; off = admin-only.

## 5. Team Lead Experience

Pages (all behind login + allowlist gate):

1. **Login** — single "Sign in with Google" button. Rejects non-allowlisted emails.
2. **Dashboard** — team name/lead greeting, next event countdown (live), current open event CTA, own submission history.
3. **Events (Tech / Non-Tech tabs)** — 8 event cards per tab showing state:
   - Locked (upcoming, with countdown)
   - Open (click to enter)
   - Locked (closed, with "Submitted ✓" or "Missed")
4. **Event page** — question, single textarea, submit button. After submit → "Submitted" confirmation with timestamp. Disabled once window closes.
5. **Leaderboard** — per-event + overall, only when admin has enabled visibility for that item.

## 6. Admin Panel

- **Teams:** add / edit / remove team (name, lead name, lead email). Bulk add via pasted list.
- **Events:** create/edit the 16 events (track, day slot 1–8, title, question, answer key). Schedule is pre-seeded but editable.
- **Submissions view:** for any event, table of all submissions ordered by time, showing team, answer, auto-correct flag, override toggle, and rank.
- **First-correct highlight:** admin dashboard surfaces "first correct" team per event immediately.
- **Leaderboard visibility toggles:** per-event + overall, per track.
- **Global controls:** manually lock/unlock an event (override auto-schedule), end Event 8 window.

## 7. Design

- Pure **black** background, **white** typography, **orange** as the single accent (CTA, active state, highlights).
- **Glassmorphism** cards: translucent panels with backdrop blur, subtle white/10% borders, soft orange glow on active elements.
- Minimal, professional, dense-but-clean layout. No decorative illustrations.
- Desktop/laptop only — no mobile responsive work. Show a "Please use a laptop" screen on narrow viewports.
- One clean typography pair (sans-serif), tight spacing, restrained motion (fade + subtle scale on state changes only).

## 8. Non-Goals (explicitly out of scope)

- No email/password, no other OAuth providers.
- No file uploads, images, code sandboxes, or rich-text answers.
- No team member management beyond the single team lead.
- No mobile UI.
- No chat, comments, or notifications.
- No public/marketing pages — app is login-first.

## 9. Success Criteria

- A non-allowlisted Google user cannot access anything past login.
- Events unlock and lock exactly on schedule for every user, regardless of activity.
- Once submitted, an answer cannot be changed by anyone but flagged/overridden by admin.
- Admin can, at any moment, see who submitted first and who submitted the first correct answer for any event.
- Leaderboards appear/disappear instantly when admin toggles visibility.

---

## Technical Section (concise)

- Google OAuth via managed auth; server-side allowlist check on login callback rejects non-listed emails before session is issued.
- `teams` table (name, lead_name, lead_email unique), `user_roles` table (`admin` | `user`), `events` table (track, slot 1–8, start_at, end_at nullable, title, question, answer_key, leaderboard_visible), `submissions` table (event_id, team_id, answer, submitted_at, auto_correct bool, admin_override nullable).
- Server-authoritative event state derived from `now()` vs `events.start_at` and next event's `start_at`; also enforced in RLS + server functions so late submissions are rejected server-side.
- Bootstrap trigger auto-assigns `admin` role to `kiransavireddy@gmail.com` on user creation.
- Pre-seed the 16 events (2 tracks × 8 slots) via migration.
- Countdown timers driven by server-provided timestamps; client re-syncs periodically.
- Leaderboard queries filtered by `leaderboard_visible` for non-admin users.

Say **"looks good, build it"** (or send edits) and I'll implement.
