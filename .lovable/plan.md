# Teacher Dashboard — Full Plan

হ্যাঁ, বানানো যাবে। কিন্তু একবারে ৪টা পিলার একসাথে বানালে বাগ ধরা কঠিন হবে + স্কোপ বড়। তাই ধাপে ধাপে করব। নিচে পুরো A-to-Z প্লান দিলাম, তারপর একটা একটা করে বানাবো।

---

## Route Structure
নতুন গেটেড সেকশন: `/teacher/*` (শুধু `teacher` বা `admin` role)

```
/teacher                    → Teacher home (KPI + quick links)
/teacher/classes            → Class list + create
/teacher/classes/$classId   → Roster, code, students
/teacher/lab-analytics      → Class-wide lab progress + AI insights
/teacher/lab-reports        → Submitted reports (review + grade)
/teacher/viva               → Assign viva + view attempts
/teacher/assignments        → Create/list assignments
/teacher/assignments/new    → AI quiz/CQ generator
```

Guard: `useAuth().isTeacher` (already exists) → redirect non-teachers.

---

## Pillar 1 — Classroom & Student Management

### DB (new tables)
- `classes` — `id, teacher_id, name, section, class_code (unique 6-char), subject, created_at`
- `class_members` — `id, class_id, student_id, joined_at, unique(class_id, student_id)`

RLS:
- Teacher: full CRUD on own classes; read members of own classes.
- Student: read own memberships; insert self via `join_class(code)` RPC.

### UI
- **`/teacher/classes`** — grid of class cards (name, section, member count, class code with copy button), "Create Class" dialog.
- **`/teacher/classes/$classId`** — roster table (name, email, subscription status via `has_active_pro`, join date, last active), remove-student action, regenerate code.
- Student side: `/app` এ small "Join Class" button → enter code → `join_class` RPC.

---

## Pillar 2 — Live Lab Analytics & Monitoring

### DB
- `lab_sessions` — `id, student_id, experiment_id, started_at, completed_at, accuracy, grade, mistakes jsonb, steps jsonb, duration_sec` (submitted from existing LabReport).
- `lab_report_feedback` — `id, session_id, teacher_id, marks, comment, created_at`.

Hook LabReport submit → insert into `lab_sessions` (currently just displays, doesn't persist).

### UI
- **`/teacher/lab-analytics`** — class picker → shows:
  - Per-student: experiments completed / total, avg accuracy.
  - Per-experiment heatmap: completion rate + avg grade across class.
  - **AI Common-Mistakes card**: server fn aggregates `mistakes` jsonb across class + calls Gemini to summarize top 3 misconceptions in Bangla ("৭০% শিক্ষার্থী X ভুল করছে").
- **`/teacher/lab-reports`** — list of submitted reports (filter by class/experiment) → drawer with full report + marks input + comment.

---

## Pillar 3 — AI Viva Monitor

### DB
- `viva_assignments` — `id, teacher_id, class_id, topic, experiment_id, question_count, due_at, created_at`
- `viva_attempts` — `id, assignment_id, student_id, questions jsonb, answers jsonb, per_question_scores jsonb, overall_score, gaps jsonb, transcript, submitted_at`

Existing `generateViva` / `gradeViva` server fns → wire into this flow instead of the current ephemeral in-memory usage.

### UI
- **`/teacher/viva`** — "Assign Viva" form (class + topic + count + due date) → generates + saves. List of assignments with attempt count + avg score.
- Click assignment → attempt list → per-student transcript, AI score, gap analysis.
- Student side: `/app/viva` → sees pending assignments → takes viva → auto-graded.

---

## Pillar 4 — Homework & Assignment Creator

### DB
- `assignments` — `id, teacher_id, class_id, type ('lab'|'quiz'|'cq'), title, payload jsonb (experiment_id OR questions[]), due_at, published, created_at`
- `assignment_submissions` — `id, assignment_id, student_id, answers jsonb, score, submitted_at, feedback`

### UI
- **`/teacher/assignments`** — list, publish/unpublish toggle, submission counts.
- **`/teacher/assignments/new`** — 3 tabs:
  1. **Lab HW** — pick experiment from existing 50+ list.
  2. **AI MCQ** — topic + count → Gemini generates NCTB-style MCQs → editable table → save.
  3. **AI CQ (সৃজনশীল)** — topic → Gemini generates 4-part CQ (জ্ঞান/অনুধাবন/প্রয়োগ/উচ্চতর) → editable → save.
- Student side: `/app` dashboard shows pending assignments card.

---

## Shared / Cross-cutting

- **Teacher navigation**: add "Teacher" link in UserMenu (visible when `isTeacher`).
- **Server functions**: all admin-style calls via `createServerFn` + `requireSupabaseAuth` + role check (`has_role(uid, 'teacher') OR has_role(uid, 'admin')`).
- **AI cost**: reuse existing `logAiUsage` for all Gemini calls (viva gen/grade, mistake analysis, quiz/CQ gen).
- **i18n**: bilingual labels (English · বাংলা) — matches existing app style.

---

## Rollout Order (আমার সাজেশন)

**Step 1 — Pillar 1** (Classroom & Roster) — foundation, বাকি সব এটার উপর dependent (class_id দরকার সবখানে)।
**Step 2 — Pillar 2** (Lab Analytics + Report review) — high student-facing value.
**Step 3 — Pillar 4** (Assignments + AI Quiz gen) — teachers এর daily use।
**Step 4 — Pillar 3** (Viva Monitor) — existing viva fns কে persistent করা।

প্রতি step এর পর আপনি check করে confirm দিলে পরের step এ যাব।

---

## এখন শুরু করব?
"হ্যাঁ, Step 1 শুরু কর" বললে **Pillar 1: Classroom & Student Management** এর migration + `/teacher/classes` UI দিয়ে শুরু করব।
