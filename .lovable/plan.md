# Dr. Chem — Market-Ready Launch Plan

লক্ষ্য: অ্যাপটিকে publish-ready বানানো — Landing Page + Auth + Roles + Collaborative Notes + Google Sheets sync। কোনো নতুন experiment add হবে না আপাতত. ভবিষ্যতে আমি অ্যাড করতে পারি. 

---

## ১। নতুন রুট স্ট্রাকচার

```text
/                       → নতুন Marketing Landing Page (পাবলিক)
/lab                    → বর্তমান Dashboard + ExperimentPicker (auth-প্রোটেক্টেড)
/tutor                  → AI Tutor (auth-প্রোটেক্টেড)
/notes                  → ডেডিকেটেড Notes page (auth-প্রোটেক্টেড)
/login  /signup         → Email + Google, signup-এ role select (Student/Teacher)
/reset-password         → পাসওয়ার্ড রিসেট
/teacher                → Teacher Dashboard (শুধু teacher role)
/api/public/sheets-sync → Google Sheets-এ rows sync (cron-callable)
```

বর্তমান `routes/index.tsx`-এর সব lab logic `routes/_authenticated/lab.tsx`-এ shift হবে। নতুন `routes/index.tsx` হবে landing page।

---

## ২। Marketing Landing Page (`/`)

Khan/Coursera-style modern EdTech vibe, Bangla-first, mobile-first:

- **Hero**: বড় Bangla headline ("ক্লাস ৯-১০ রসায়ন — হাতে-কলমে শিখো"), subheading, dual CTA ("ফ্রি শুরু করো" + "ডেমো দেখো"), animated SVG beaker/molecule
- **Trust strip**: NCTB curriculum · ১২+ ভার্চুয়াল ল্যাব · AI Tutor · ফ্রি
- **Features Bento Grid**: 6 cards (Virtual Lab, AI Tutor, Notes, Viva Mode, Reports, Bilingual)
- **Experiments Showcase**: ১২ experiment grid with icons + short desc
- **How it works**: 3-step (Sign up → Choose experiment → Learn & save notes)
- **Live Demo embed**: একটা mini experiment preview (read-only)
- **For Students / For Teachers**: dual-column benefit list
- **Testimonials** placeholder (3 cards)
- **Pricing**: "এখন সম্পূর্ণ ফ্রি" single card
- **FAQ accordion** (6 Q)
- **Footer**: links, contact, social
- **SEO**: per-route `head()` — title, description, og:title/description/type, JSON-LD `EducationalOrganization`
- **Animation**: Framer Motion fade-in + scroll reveal

ফাইল: `src/routes/index.tsx` (rewrite), `src/components/landing/*` (Hero, Features, ExperimentsShowcase, HowItWorks, ForStudentsTeachers, FAQ, Footer)

---

## ৩। Auth + Roles

**Supabase migration:**

- `app_role` enum: `'student' | 'teacher' | 'admin'`
- `profiles` (user_id, display_name, email, school, class, role_label, avatar_url, created_at)
- `user_roles` (user_id, role) — **আলাদা টেবিল** (privilege escalation প্রতিরোধে)
- `has_role(uuid, app_role)` SECURITY DEFINER function
- Trigger: signup-এ profile auto-create, default role = student
- RLS: profiles নিজেরটা read/update; teachers can view student profiles (via has_role)
- Email/password + Google OAuth (Lovable broker)
- Signup form-এ role radio (Student/Teacher)

**Frontend:**

- `_authenticated` layout route (গাইড অনুসারে)
- `_authenticated/_teacher` layout (has_role check)
- `useAuth` hook → router context-এ inject
- `onAuthStateChange` listener root-এ → cache invalidate
- Header-এ user avatar dropdown (Profile, Notes, Logout)

---

## ৪। Collaborative Notes System

**Supabase migration:**

```text
notes
  id, author_id, title, content_md, experiment_id (nullable),
  visibility ('private' | 'shared' | 'public'),
  is_pinned, tags[], created_at, updated_at

note_collaborators
  note_id, user_id, permission ('view' | 'edit')

note_comments
  id, note_id, user_id, body, created_at

note_likes
  note_id, user_id, created_at
```

**RLS:**

- author সব করতে পারে
- collaborators permission অনুযায়ী view/edit
- `visibility='public'` হলে authenticated সবাই read
- teachers can view all student notes for their experiments (via has_role)
- comments/likes: যেকোনো reader create করতে পারে নিজের row

**Realtime:** `ALTER PUBLICATION supabase_realtime ADD TABLE notes, note_comments, note_likes;` — একই note multi-user edit হলে subscribe করে live update।

**Frontend components:**

- `src/routes/_authenticated/notes.tsx` — full Notion-style editor page (list sidebar + editor)
- `src/components/notes/NoteEditor.tsx` — Markdown editor (textarea + preview, KaTeX support)
- `src/components/notes/NoteList.tsx` — search, filter (tag/experiment/visibility), sort
- `src/components/notes/NoteShareDialog.tsx` — invite collaborator by email, set permission
- `src/components/notes/QuickNotePanel.tsx` — lab workspace-এ side drawer, experiment-linked quick note
- `src/components/notes/SaveToNotesButton.tsx` — Tutor MessageBubble + Lab result-এ "📝 Save to Notes" button
- `src/components/notes/CommentThread.tsx` — comment + like UI
- Export: `html2pdf.js` দিয়ে PDF, plain `.md` download
- Admin (role='admin' or teacher): bulk export selected students' notes as ZIP

**Integration:**

- Lab workspaces-এ floating "📝 Note" button → opens QuickNotePanel (experiment_id pre-linked)
- Tutor MessageBubble-এ "Save" icon → creates note with chat excerpt
- Realtime presence indicator (who's viewing/editing)

---

## ৫। Google Sheets Sync

User চান profile + notes activity Google Sheet-এও দেখতে। Approach:

1. **Connector setup**: `standard_connectors--connect` দিয়ে Google Sheets connector link (developer's own sheet — user-এর নিজের Google account)
2. ইউজার একটা spreadsheet তৈরি করে ID পেস্ট করবেন (Settings page-এ input)
3. Secret: `GOOGLE_SHEETS_SPREADSHEET_ID` (add_secret)
4. **Server function** `src/lib/sheets-sync.functions.ts`:
  - `syncSignupsToSheet()` — signup trigger / cron-এ নতুন users append করে `Users` tab-এ (id, email, name, role, school, class, signup_at)
  - `syncNotesActivityToSheet()` — note created/updated event-এ `Notes` tab-এ row append
  - Google Sheets API v4 via connector gateway (`/spreadsheets/{id}/values/{range}:append`)
5. **Trigger options** (auto-sync):
  - Realtime: signup-এ `onAuthStateChange` + note create-এ client থেকে server fn call (fire-and-forget)
  - Manual: Teacher dashboard-এ "Sync to Sheets" button
6. **Public cron endpoint** `src/routes/api/public/sheets-sync.ts` — HMAC signature verified, pg_cron বা external scheduler call করতে পারবে (incremental sync)

ফলাফল: user নিজের Google Sheet খুলে real-time student data, notes activity দেখতে পারবেন — sharing/analytics-এ সুবিধা।

---

## ৬। Teacher Dashboard (`/teacher`)

- Student list (profiles where role='student')
- Notes feed (all public + shared-to-teacher notes)
- Experiment-wise activity heatmap
- Bulk export students' notes (PDF/ZIP)
- "Sync to Google Sheets" button

---

## ৭। UI/UX Polish (publish-ready)

- Global theme: existing tokens রাখা, landing-এর জন্য hero gradient + glow tokens যোগ
- Mobile nav (hamburger), responsive Bento grid
- Loading skeletons, toast notifications (sonner)
- 404 + error pages already exist — copy polish
- Favicon + og:image (generate via imagegen)
- robots.txt + sitemap.xml (server route)
- Empty states (no notes yet, no students yet)
- Onboarding tour first-time signup-এ (optional dismiss)

---

## ৮। Implementation Phases

**Phase 1 — Auth foundation** (এক migration + auth UI)

- Migration: enums, profiles, user_roles, has_role, trigger, RLS, GRANTs
- `configure_social_auth(['google'])`
- `/login`, `/signup` (role select), `/reset-password`
- `_authenticated` + `_teacher` layout routes
- Header avatar dropdown
- Root `onAuthStateChange` listener

**Phase 2 — Landing page + route restructure**

- বর্তমান `index.tsx` → `_authenticated/lab.tsx`
- নতুন `index.tsx` = marketing landing
- All landing components + SEO meta + JSON-LD
- robots.txt + sitemap.xml server route
- Favicon + og:image

**Phase 3 — Notes system**

- Migration: notes, note_collaborators, note_comments, note_likes + RLS + realtime publication
- `/notes` route + NoteList + NoteEditor + ShareDialog + Comments
- QuickNotePanel integration in every lab workspace
- SaveToNotesButton in Tutor MessageBubble
- PDF/MD export

**Phase 4 — Google Sheets sync**

- Connect Google Sheets connector
- `sheets-sync.functions.ts` (signups + notes)
- Settings page for spreadsheet ID input
- `/api/public/sheets-sync` cron endpoint with HMAC

**Phase 5 — Teacher dashboard + final polish**

- `/teacher` page
- Bulk export
- Onboarding tour
- Final QA pass (mobile, dark mode, edge cases)
- Publish

---

## ৯। Technical Details (for the engineer)

- **Stack**: TanStack Start, server fns via `createServerFn` + `requireSupabaseAuth`. NO Supabase Edge Functions.
- **Markdown editor**: `react-markdown` + `remark-gfm` + KaTeX (already installed) + simple textarea (no heavy library for v1)
- **PDF export**: `html2pdf.js` bundle (Worker-compatible)
- **Realtime**: Supabase channels in NoteEditor useEffect
- **Google Sheets**: connector gateway `https://connector-gateway.lovable.dev/google_sheets/v4/spreadsheets/...` — NO range encoding
- **Secrets**: `GOOGLE_SHEETS_SPREADSHEET_ID`, `SHEETS_CRON_SECRET` (HMAC)
- **SEO**: per-route `head()`, leaf canonicals, JSON-LD EducationalOrganization on root, FAQPage on landing
- **start.ts**: confirm `attachSupabaseAuth` registered in `functionMiddleware`

---

## ১০। অজানা/সীমাবদ্ধতা

- Google Sheets connector developer-account-scoped — সব user-এর data এক sheet-এ জমা হবে (admin-owned)। প্রতি teacher আলাদা sheet চাইলে per-user OAuth লাগবে (Phase 6+)।
- Realtime collaborative editing simple "latest-write-wins" হবে (CRDT না) — v1-এ acceptable
- Email verification ডিফল্টে on (security best-practice); দরকার হলে auto-confirm করব

প্রস্তুত হলে বলো — Phase 1 দিয়ে শুরু করব (auth migration + login/signup UI)।