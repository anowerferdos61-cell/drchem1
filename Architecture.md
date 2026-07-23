# Dr. Chem — Architecture

> এই ডকুমেন্ট পড়লেই বোঝা যাবে অ্যাপটা কিভাবে কাজ করে — কোন লেয়ার কোথায়, ডেটা কিভাবে যায়, আর কোন API কোথায় থেকে কল হয়।

---

## 1. Solution Design

### 1.1 এক নজরে

Dr. Chem হলো ক্লাস ৯-১০ এর NCTB রসায়ন সিলেবাসের একটা ইন্টার‍্যাক্টিভ লার্নিং অ্যাপ। ৩ ধরনের ইউজার:

| Role | কি করতে পারে |
|---|---|
| **Student** | ভার্চুয়াল ল্যাব, AI টিউটর, টেস্ট দেওয়া, প্রগ্রেস দেখা |
| **Teacher** | ক্লাসরুম বানানো, AI দিয়ে প্রশ্ন জেনারেট, ছাত্রদের ফলাফল ও গ্রেড দেখা |
| **Admin** | সাবস্ক্রিপশন, পেমেন্ট রিকোয়েস্ট, অ্যানালিটিক্স দেখা |

### 1.2 লেয়ার আর্কিটেকচার

```
┌──────────────────────────────────────────────────┐
│  Client (React 19 + TanStack Router + Tailwind)  │  ← ব্রাউজারে চলে
├──────────────────────────────────────────────────┤
│  TanStack Start Server Functions                 │  ← Cloudflare Worker এ চলে
│  (createServerFn — /src/lib/*.functions.ts)      │
├──────────────────────────────────────────────────┤
│  Supabase (Lovable Cloud)                        │  ← ডেটাবেস + অথ
│  - Postgres + RLS                                │
│  - Auth (email + Google)                         │
│  - pgvector (KB embeddings)                      │
├──────────────────────────────────────────────────┤
│  External: Lovable AI Gateway → Gemini 2.5       │  ← AI কল
└──────────────────────────────────────────────────┘
```

### 1.3 Tech Stack

- **Frontend:** React 19, TanStack Router v1 (file-based routing), Tailwind v4, shadcn/ui
- **Backend:** TanStack Start server functions (Cloudflare Workers runtime)
- **Database:** Supabase Postgres — RLS-first, ১৬টা টেবিল
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **AI:** Gemini 2.5 Flash (default), Flash-Lite (cheap), Pro (heavy) via Lovable AI Gateway
- **Deployment:** Lovable Publish (primary) + optional Vercel (personal Supabase দিয়ে)

### 1.4 ফোল্ডার স্ট্রাকচার

```
src/
├── routes/                      # TanStack file-based routes
│   ├── __root.tsx              # global shell + AnalyticsTracker
│   ├── index.tsx               # landing page
│   ├── app.*                   # student area (/app/...)
│   ├── teacher.*               # teacher dashboard
│   ├── admin.*                 # admin panel
│   └── api/                    # public HTTP endpoints (webhooks, streaming)
│       └── tutor/stream.ts     # SSE stream for AI tutor
├── lib/
│   ├── *.functions.ts          # client-safe server functions (createServerFn)
│   ├── *.server.ts             # server-only helpers (imports supabaseAdmin)
│   └── analytics-tracker.tsx   # client-side page view tracker
├── components/
│   ├── lab/                    # ৪৮টা virtual lab component
│   ├── tutor/                  # AI chat UI
│   ├── viva/                   # oral exam UI
│   └── ui/                     # shadcn primitives
└── integrations/supabase/
    ├── client.ts               # browser client (anon key, RLS applies)
    ├── client.server.ts        # admin client (service role, bypasses RLS)
    ├── auth-middleware.ts      # requireSupabaseAuth for server fns
    └── types.ts                # auto-generated DB types
```

---

## 2. Data Flow

### 2.1 ক্লায়েন্ট → সার্ভার → ডিবি (ডিফল্ট প্যাটার্ন)

সব app-internal কলই `createServerFn` দিয়ে হয় — REST/edge function নয়।

```
Component (useServerFn)
   │
   ▼
createServerFn handler          ← Cloudflare Worker
   │  ┌── requireSupabaseAuth middleware (bearer token → context.supabase)
   │  ▼
   ├── context.supabase  ────►  Postgres (RLS হিসেব: caller = auth.uid())
   │                             ↑ user-scoped কাজের জন্য
   │
   └── supabaseAdmin    ────►  Postgres (RLS bypass)
                                ↑ শুধু privileged কাজের জন্য (has_role চেক করে)
```

**নিয়ম:**
- Route loader-এ TanStack Query দিয়ে prefetch, কম্পোনেন্টে `useSuspenseQuery`
- Protected server fn → শুধু `_authenticated` layout এর নিচে বা কম্পোনেন্ট থেকে কল
- Public route loader-এ কখনো protected fn ডাকা হয় না (SSR-এ 401 হয়)

### 2.2 ৩টা গুরুত্বপূর্ণ ফ্লো

#### (ক) Student একটা ল্যাব সাবমিট করে

```
LabReport.tsx (component)
   → saveLabAttempt server fn      [progress.functions.ts]
     → context.supabase.insert(lab_attempts)
       → RLS: user_id = auth.uid() হলে পাশ
   → streakCheckin RPC             [DB function]
     → streaks টেবিল আপডেট
   → toast "সাবমিট হয়েছে"
```

#### (খ) Teacher AI দিয়ে প্রশ্ন জেনারেট করে

```
teacher.questions.new (wizard)
   Step 1: setup → generateQuestions server fn   [questions.functions.ts]
                     → gemini-questions.server.ts (structured JSON schema)
                       → Gemini 2.5 Flash via Lovable AI Gateway
                     → prompt + response → ai_usage_logs (cost tracking)
   Step 2: editor → updateQuestion / addQuestion (CRUD)
   Step 3: publish → publishToClass
                     → class_members এর সবাইকে test assign
                     → toast: "X জন ছাত্রকে assign করা হয়েছে"
```

#### (গ) Anonymous visitor একটা পেজ লোড করে

```
Browser opens /
   → AnalyticsTracker (in __root)
     → localStorage থেকে anon_id নেয় (না থাকলে বানায়)
   → trackEvent server fn           [analytics.functions.ts]
     → supabaseAdmin (service role, কারণ RLS visitor কে চেনে না)
       → analytics_sessions (30-min idle window এ reuse হয়)
       → analytics_events (page_view / feature)
```

### 2.3 AI Streaming (special case)

চ্যাট রেসপন্স স্ট্রিম করা লাগে, তাই সাধারণ server fn না — file-based server route ব্যবহার করি:

```
Composer.tsx → fetch POST /api/tutor/stream
   → src/routes/api/tutor/stream.ts (createFileRoute + server block)
     → Gemini streaming API
     → ReadableStream → SSE → UI-তে token-by-token
   → শেষে logAiUsage (input/output token → cost_usd)
```

---

## 3. APIs

### 3.1 Server Functions (client → server RPC)

সব `src/lib/*.functions.ts`-এ থাকে। `useServerFn` দিয়ে ক্লায়েন্ট থেকে কল হয়।

| File | Function | Auth | কি করে |
|---|---|---|---|
| `analytics.functions.ts` | `trackEvent` | Public | page view / feature event লগ করে |
| | `getAnalyticsOverview` | Admin | KPI + 28-day daily chart |
| | `getRecentSessions` | Admin | সাম্প্রতিক ভিজিটর লিস্ট |
| | `getSessionTimeline` | Admin | এক ইউজারের full timeline |
| `teacher.functions.ts` | `createClass` | Teacher | নতুন ক্লাসরুম + join code |
| | `listMyClasses` | Teacher | নিজের সব ক্লাস |
| | `getClassDetails` | Teacher | ছাত্র + স্কোর + last submitted |
| `questions.functions.ts` | `generateQuestions` | Teacher | Gemini → MCQ/CQ JSON |
| | `publishToClass` | Teacher | পুরো ক্লাসকে test assign |
| | `listMyQuestionSets` | Teacher | নিজের টেস্ট + কোন ক্লাসে পাবলিশড |
| `tests.functions.ts` | `getAssignedTests` | Student | আমার test list + প্রশ্ন সংখ্যা |
| | `submitAttempt` | Student | MCQ auto-grade + CQ save |
| `grading.functions.ts` | `getSetResults` | Teacher | সব attempt summary |
| | `gradeCQAnswer` | Teacher | manual CQ mark |
| | `suggestCQScore` | Teacher | Gemini-suggested score |
| | `getClassAssignmentsOverview` | Teacher | ক্লাস → test → attempt aggregate |
| `progress.functions.ts` | `saveLabAttempt` | Student | ল্যাব সাবমিশন save |
| | `getMyProgress` | Student | streak + lab count + accuracy |
| | `getClassLeaderboard` | Teacher | ক্লাসের top students |
| `subscription.functions.ts` | `submitPaymentRequest` | User | pending payment |
| | `activateSubscription` | Admin | manual approve |
| `chat.functions.ts` | tutor CRUD | Student | চ্যাট history |
| `tutor-title.functions.ts` | `generateTitle` | Student | AI-generated chat title |
| `viva.functions.ts` | oral exam flow | Both | teacher-student viva |
| `admin.functions.ts` | user mgmt | Admin | roles, subscriptions |
| `onboarding.functions.ts` | profile setup | User | role + school নেয় |

### 3.2 HTTP Routes (external callers)

সব `src/routes/api/`-এ। প্রয়োজনে signature verify করে।

| Route | Method | Purpose |
|---|---|---|
| `/api/tutor/stream` | POST | AI চ্যাটের SSE stream (token-by-token) |
| `/sitemap.xml` | GET | SEO sitemap |

### 3.3 Database RPCs (Postgres functions)

কিছু কাজ SQL-এ করা বেশি নিরাপদ (RLS recursion এড়াতে বা atomic হওয়ার জন্য):

| Function | কি করে |
|---|---|
| `has_role(user, role)` | SECURITY DEFINER role check (RLS-এ ব্যবহার হয়) |
| `is_class_member(class, user)` | RLS circular dependency ভাঙে |
| `is_class_teacher(class, user)` | ↑ একই |
| `join_class(code)` | ছাত্র join code দিয়ে ঢোকে |
| `regenerate_class_code(class)` | শিক্ষক নতুন code বানায় |
| `streak_checkin()` | daily streak আপডেট (gap হলে reset) |
| `admin_grant_subscription(user, plan)` | manual subscription |
| `increment_ai_usage(date)` | daily quota counter |
| `match_kb_documents(embedding, ...)` | pgvector similarity search |
| `handle_new_user()` | signup trigger → profiles + user_roles |

### 3.4 Database Tables (১৬টা)

```
Auth & Users:      profiles, user_roles
Classroom:         classes, class_members
Questions:         question_sets, questions, test_attempts, cq_grades
Progress:          lab_attempts, streaks, usage_counters
Content:           videos, notes, kb_documents (pgvector)
Analytics:         analytics_sessions, analytics_events, ai_usage_logs
Billing:           subscriptions, subscription_plans, payment_requests
```

সব public টেবিলে RLS enabled + explicit `GRANT` statement দেওয়া (Supabase Data API default privilege দেয় না)।

---

## 4. Security Model (সংক্ষেপে)

1. **RLS-first:** প্রতিটা user-facing টেবিলে RLS on, policy `auth.uid()` চেক করে
2. **Roles আলাদা টেবিলে:** `user_roles` — কখনো `profiles`-এ role রাখি না (privilege escalation এড়াতে)
3. **Server-only writes:** analytics + ai_usage_logs → শুধু `supabaseAdmin` দিয়ে server fn থেকে লেখা হয়, কোনো anon INSERT policy নাই
4. **Admin check p2p:** privileged server fn → প্রথমে `context.supabase.rpc('has_role', ...)` → তারপর `supabaseAdmin` import
5. **Secrets:** সব `process.env.*` — শুধু server handler-এর ভেতরে পড়া হয়, module scope-এ না
6. **Bearer middleware:** `src/start.ts`-এ `attachSupabaseAuth` → protected server fn কল করলে token আপনাআপনি যায়

---

## 5. Adding a New Feature — Checklist

নতুন কিছু বানানোর সময় এই ক্রমে চিন্তা করি:

1. **কে অ্যাক্সেস পাবে?** → RLS policy লিখি
2. **টেবিল লাগবে?** → migration: `CREATE TABLE` → `GRANT` → `ENABLE RLS` → `CREATE POLICY` (এই order-এ, একই migration-এ)
3. **সার্ভার লজিক?** → `src/lib/xyz.functions.ts` → `createServerFn` + `requireSupabaseAuth`
4. **UI?** → নতুন route file `src/routes/...tsx` → loader-এ `ensureQueryData`, কম্পোনেন্টে `useSuspenseQuery`
5. **Metadata:** প্রতিটা content route-এ unique `head()` (title, description, og:*)
6. **Verify:** build চলে? console error নাই? RLS দিয়ে সঠিক ইউজার দেখতে পাচ্ছে?
