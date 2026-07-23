# Dr. Chem — Phases

> ফিচার গুলা কোন phase-এ ship হয়েছে বা হবে — এক নজরে টাইমলাইন।

---

## Phase 1 — Auth + Core UI ✅

**লক্ষ্য:** ইউজার ঢুকতে পারবে, নিজের role বুঝবে, বেসিক লেআউট দেখবে।

- Supabase Auth: email/password + Google OAuth
- Signup flow: `handle_new_user()` trigger → `profiles` + `user_roles` auto-create
- Role selection onboarding (`/onboarding`)
- Landing page + pricing + FAQ
- Route shell: `__root.tsx` + `/app`, `/teacher`, `/admin` layouts
- UserMenu (top-right dropdown → নিজের dashboard-এ যেতে পারে)
- Theme: dark chemistry-lab aesthetic, Tailwind v4 tokens

**Files:** `src/routes/login.tsx`, `signup.tsx`, `onboarding.tsx`, `__root.tsx`, `src/components/auth/UserMenu.tsx`

---

## Phase 2 — Virtual Labs + AI Tutor ✅

**লক্ষ্য:** কোর প্রোডাক্ট ভ্যালু — ছাত্র হাতে-কলমে শিখতে পারবে।

- ৪৮টা ইন্টার‍্যাক্টিভ ল্যাব (১২ চ্যাপ্টারে বিভক্ত)
- LabWorkspace + EquipmentPanel + StatusPanel + StepsPanel shell
- LandscapeGate (মোবাইলে ল্যান্ডস্কেপ enforce করে)
- AI Tutor chat (`/tutor`) → SSE streaming via `/api/tutor/stream`
- Lab AI Assistant (contextual, ল্যাবের ভিতরে)
- Chat history, sidebar, auto-title generation
- Knowledge Base (`kb_documents` + pgvector) — NCTB বইয়ের ready reference

**Files:** `src/components/lab/*`, `src/components/tutor/*`, `src/lib/chat.functions.ts`, `src/routes/api/tutor/stream.ts`

---

## Phase 3 — Classroom + AI Question Generator ✅

**লক্ষ্য:** শিক্ষককে টুল দাও — ছাত্র ম্যানেজ + পরীক্ষা নিতে পারবে।

- Teacher creates `classes` → 6-char join code
- Student joins via `join_class(code)` RPC
- Class detail page: Students / Lab Analytics / Lab Reports / Assignments / Viva tabs
- **AI Question Generator** (3-step wizard):
  - Step 1: Setup (chapter, difficulty, count, MCQ/CQ mix)
  - Step 2: Gemini 2.5 Flash → structured JSON generation
  - Step 3: Interactive editor → publish to class
- Student test runner (MCQ auto-grade, CQ save)
- Teacher grading UI + **AI Suggest Score** (Gemini-powered CQ grading)
- Class Assignments overview → expandable per-test student results

**Files:** `src/lib/questions.functions.ts`, `gemini-questions.server.ts`, `tests.functions.ts`, `grading.functions.ts`, `src/routes/teacher.classes.*`, `teacher.questions.*`, `app.tests.*`

---

## Phase 4 — Progress + Analytics + Billing 🚧 (চলমান)

**লক্ষ্য:** ইনগেজমেন্ট trackable + রেভিনিউ চালু।

**হয়ে গেছে:**
- Persistent Progress Tracking
  - `lab_attempts` — প্রতিটা সাবমিশন DB-তে
  - `streaks` — 21-day challenge, `streak_checkin()` RPC
  - `/app/progress` route — streak, lab count, accuracy
  - Class Leaderboard (শিক্ষকের জন্য)
- Admin Analytics dashboard
  - `analytics_sessions` + `analytics_events` (server-side write)
  - Live visitor count, 28-day chart, top pages/features
  - Per-session timeline drill-down
- Subscription plans + payment_requests + admin approve flow
- Free unlock: Chapter 1 (সব ফ্রি users এর জন্য)

**পরে আসবে:**
- Lab report submission → teacher review flow (DB wiring)
- Push notification on test publish
- PDF export for grade sheets
- Bulk student invite via SMS/email

---

## Phase 5 — Polish + Scale 🔜

**লক্ষ্য:** production-hardening, performance, growth।

- Full mobile UX pass (small screens এ table scroll, tap targets)
- Image + video lazy loading, CDN optimization
- Content expansion:
  - Chapter 2–12 এর video library (এখন শুধু Chapter 1)
  - Smart Notes বাড়ানো (এখন ৩টা)
- Onboarding tour (empty state guidance)
- Rate limiting on AI endpoints (per-user daily quota UI)
- Error boundaries + Sentry-style logging
- SEO polish: JSON-LD schema, sitemap auto-refresh
- i18n: বাংলা primary, English fallback

---

## Architecture Per Phase

| Phase | নতুন Tables | নতুন Server Fns | নতুন Routes |
|---|---|---|---|
| 1 | `profiles`, `user_roles` | `onboarding` | `/login`, `/signup`, `/onboarding` |
| 2 | `videos`, `notes`, `kb_documents` | `chat`, `tutor-title` | `/tutor`, `/app`, `/app/videos`, `/app/notes` |
| 3 | `classes`, `class_members`, `question_sets`, `questions`, `test_attempts`, `cq_grades` | `teacher`, `questions`, `tests`, `grading` | `/teacher/*`, `/app/tests/*` |
| 4 | `lab_attempts`, `streaks`, `analytics_*`, `ai_usage_logs`, `subscriptions`, `payment_requests` | `progress`, `analytics`, `subscription`, `admin` | `/app/progress`, `/admin/*`, `/billing` |
| 5 | (no new) | rate-limit, notifications | (polish only) |
