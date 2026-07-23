# Dr. Chem — Database

> Supabase Postgres, RLS-first। ১৬টা টেবিল, ৪টা domain-এ ভাগ করা।

---

## Convention

- সব টেবিল `public` schema-এ
- সব id → `uuid` primary key, `gen_random_uuid()`
- সব টেবিলে `created_at`, `updated_at` (`timestamptz`) — trigger দিয়ে auto-update
- User reference → `user_id uuid` → `auth.users(id)` (FK ছাড়া, Supabase managed)
- RLS **সবসময়** enabled, explicit `GRANT` মিস করা যাবে না

---

## 1. Auth & Users

### `profiles`
ইউজারের public info — signup-এ trigger দিয়ে auto-create হয়।

| Column | Type | Notes |
|---|---|---|
| user_id | uuid PK | `auth.users.id` |
| email | text | |
| display_name | text | |
| phone | text unique | login by phone সাপোর্ট |
| school | text | |
| class | text | "9" / "10" |
| role_selected | boolean | onboarding complete? |
| avatar_url | text | |

**RLS:** own row read/write; admin all read

### `user_roles`
Role আলাদা টেবিলে — privilege escalation এড়াতে।

| Column | Type | Notes |
|---|---|---|
| user_id | uuid | |
| role | `app_role` enum | `student` / `teacher` / `admin` |
| unique(user_id, role) | | |

**RLS:** own read; admin all read
**Helper:** `has_role(user, role)` — SECURITY DEFINER, সব policy-তে ব্যবহার

---

## 2. Classroom

### `classes`
শিক্ষকের ক্লাসরুম।

| Column | Type | Notes |
|---|---|---|
| teacher_id | uuid | owner |
| name | text | |
| subject | text | default "Chemistry" |
| class_code | text unique | 6-char, `generate_class_code()` |
| description | text | |

**RLS:** teacher own; member read; admin all
**Helper:** `is_class_teacher(class, user)`

### `class_members`
কোন ছাত্র কোন ক্লাসে।

| Column | Type |
|---|---|
| class_id | uuid |
| student_id | uuid |
| joined_at | timestamptz |
| unique(class_id, student_id) | |

**RLS:** self read/leave; teacher of that class read/remove
**Helper:** `is_class_member(class, user)` — RLS circular dep ভাঙে

---

## 3. Assessment (AI Question Generator)

### `question_sets`
এক-একটা test / প্রশ্নপত্র।

| Column | Type | Notes |
|---|---|---|
| teacher_id | uuid | creator |
| title | text | |
| chapter | text | |
| difficulty | text | easy/medium/hard |
| mcq_count | int | |
| cq_count | int | |
| duration_minutes | int | |
| status | text | draft / published |
| published_to_class_id | uuid | FK classes |
| published_at | timestamptz | |

### `questions`
প্রতিটা প্রশ্ন।

| Column | Type | Notes |
|---|---|---|
| set_id | uuid | FK question_sets |
| position | int | order |
| type | text | `mcq` / `cq` |
| prompt | text | question text |
| options | jsonb | MCQ: `[{key,text}]` |
| correct_answer | text | MCQ: key |
| marks | int | |
| explanation | text | AI-generated rationale |
| stimulus | text | CQ passage (উদ্দীপক) |

### `test_attempts`
ছাত্রের সাবমিশন।

| Column | Type | Notes |
|---|---|---|
| student_id | uuid | |
| set_id | uuid | |
| answers | jsonb | `{question_id: answer}` |
| mcq_score | int | auto-graded |
| mcq_total | int | |
| cq_pending | boolean | teacher grade বাকি? |
| submitted_at | timestamptz | |
| duration_seconds | int | |

### `cq_grades`
CQ manual grade + AI suggestion।

| Column | Type |
|---|---|
| attempt_id | uuid |
| question_id | uuid |
| awarded_marks | numeric |
| ai_suggested_marks | numeric |
| teacher_comment | text |
| graded_by | uuid |

---

## 4. Progress + Content

### `lab_attempts`
প্রতিটা ল্যাব সাবমিশন।

| Column | Type |
|---|---|
| user_id | uuid |
| lab_key | text |
| chapter_number | int |
| accuracy | numeric |
| duration_seconds | int |
| result_data | jsonb |

### `streaks`
21-day challenge — 1 row per user।

| Column | Type |
|---|---|
| user_id | uuid unique |
| current_days | int |
| longest_days | int |
| last_check_date | date |
| start_date | date |

**RPC:** `streak_checkin()` — gap হলে reset, consecutive হলে +1

### `usage_counters`
Daily AI quota tracking।

| Column | Type |
|---|---|
| user_id | uuid |
| usage_date | date |
| ai_messages_used | int |
| unique(user_id, usage_date) | |

**RPC:** `increment_ai_usage(date)`

### `videos`, `notes`
Library content — `chapter_number`, `is_premium`, `youtube_url` / `content_md`

### `kb_documents`
NCTB বইয়ের chunk + pgvector embedding।

| Column | Type |
|---|---|
| content | text |
| embedding | vector(768) | Gemini embedding |
| source | text |
| class, subject, chapter | text |
| page | int |

**RPC:** `match_kb_documents(embedding, count, source, subject)` — cosine similarity

---

## 5. Analytics + Billing

### `analytics_sessions`
এক visit = এক row। Anonymous ও tracked (localStorage `anon_id`)।

| Column | Type |
|---|---|
| anon_id | text |
| user_id | uuid nullable |
| started_at, last_seen_at | timestamptz |
| duration_seconds | int |
| page_views, event_count | int |
| entry_path, referrer, user_agent | text |

### `analytics_events`
প্রতিটা page_view / feature click।

| Column | Type |
|---|---|
| session_id | uuid |
| event_type | text | `page_view` / `feature` |
| path | text |
| feature_key | text |
| metadata | jsonb |

**RLS:** admin only read। Writes → `supabaseAdmin` (service role) — কোনো anon/authenticated INSERT policy নাই, fail-closed।

### `ai_usage_logs`
প্রতিটা Gemini call এর token + cost।

| Column | Type |
|---|---|
| user_id | uuid |
| endpoint | text |
| model | text |
| input_tokens, output_tokens, total_tokens | int |
| cost_usd | numeric |

### `subscription_plans`, `subscriptions`, `payment_requests`
Manual billing flow — ছাত্র bKash number দেয় → admin approve → `admin_grant_subscription()` RPC।

---

## GRANT Template (নতুন টেবিলে)

```sql
CREATE TABLE public.foo (...);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.foo TO authenticated;
GRANT ALL ON public.foo TO service_role;
-- GRANT SELECT ON public.foo TO anon;  -- শুধু পুরোপুরি public হলে

ALTER TABLE public.foo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own row" ON public.foo
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```
