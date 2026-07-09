# AI Question Generator (MCQ + CQ) — Full Feature Plan

শিক্ষকরা AI দিয়ে NCTB-স্ট্যান্ডার্ড প্রশ্ন বানাবেন, এডিট করবেন, ক্লাসে অ্যাসাইন বা PDF এক্সপোর্ট করবেন। স্টুডেন্ট MCQ দিলে অটো-গ্রেড, CQ দিলে AI-সাজেস্টেড স্কোর সহ ম্যানুয়াল গ্রেডিং।

## Scope (একবারে যা বানাব)

1. **Teacher Question Generator** — 3-step wizard (Setup → AI Generate → Editor)
2. **Assign to Class** flow — publish as a test
3. **PDF Export** — সুন্দর NCTB-স্টাইল লেআউট
4. **Student Test Taking** — MCQ auto-submit + CQ text answer
5. **Auto-grading (MCQ)** + **AI-assist grading (CQ)** — টিচার রেজাল্ট শিট দেখবে

## Database (new tables)

```text
question_sets           পুরো টেস্ট/প্রশ্নপত্র
  ├─ teacher_id, class_id (nullable — draft হতে পারে)
  ├─ title, chapter, question_type (mcq|cq|mixed)
  ├─ difficulty, source_experiment (nullable)
  ├─ status (draft|published|archived)
  └─ published_at, due_at

questions               সেটের ভেতরের আলাদা প্রশ্ন
  ├─ set_id, order_index, type (mcq|cq)
  ├─ MCQ: question_text, options (jsonb[4]), correct_index, explanation
  └─ CQ: stem, parts (jsonb {ka, kha, ga, gha with marks + sample_answer})

test_attempts           স্টুডেন্ট এর সাবমিশন
  ├─ set_id, student_id, submitted_at
  ├─ answers (jsonb) — mcq indexes + cq text answers
  ├─ mcq_score, mcq_total (auto)
  └─ cq_score, cq_graded_at, cq_graded_by (manual)

cq_grades               প্রতি CQ পার্টের মার্কস + AI similarity score
  ├─ attempt_id, question_id, part (ka|kha|ga|gha)
  ├─ marks_awarded, ai_similarity_score
  └─ teacher_note
```

RLS: টিচার নিজের set + own class-এর attempts দেখবে, স্টুডেন্ট published set (own class) দেখবে ও নিজের attempt দেখবে।

## Backend (TanStack server functions)

`src/lib/questions.functions.ts`:
- `generateQuestions({ chapter, type, difficulty, count, experiment? })` — Gemini structured JSON call, returns preview (save না)
- `saveQuestionSet({ title, chapter, questions[], ... })` — draft হিসেবে save
- `publishToClass({ set_id, class_id, due_at })`
- `getMyQuestionSets()`, `getSet(id)`, `updateQuestion(...)`, `deleteQuestion(...)`

`src/lib/tests.functions.ts` (student side):
- `getAssignedTests()`, `startAttempt(set_id)`, `submitAttempt(attempt_id, answers)` — MCQ instant grade
- `getMyResults()`

`src/lib/grading.functions.ts` (teacher):
- `getClassResults(set_id)` — leaderboard
- `getAttemptDetail(attempt_id)` — CQ পড়ার জন্য
- `aiSuggestCqScore({ sample_answer, student_answer })` — Gemini similarity call
- `saveCqGrade(attempt_id, question_id, part, marks, note)`

Gemini প্রম্পট: প্ল্যানের spec অনুযায়ী `responseSchema` সহ strict JSON। বাংলা কন্টেন্ট। `structuredOutputs: false` (Gemini-এ default fine).

## Frontend Routes

```text
/teacher/questions                 — সব question set list + "Create New" বাটন
/teacher/questions/new             — 3-step wizard (Setup → Generate → Edit)
/teacher/questions/$setId          — Edit + Assign/Export panel
/teacher/questions/$setId/results  — ক্লাসের রেজাল্ট শিট (MCQ auto, CQ grade UI)

/app/tests                         — স্টুডেন্ট: assigned tests list
/app/tests/$setId                  — টেস্ট দেওয়ার UI (MCQ radio / CQ textarea)
/app/tests/$setId/result           — নিজের রেজাল্ট
```

ক্লাস ডিটেল পেজে "Questions & Tests" ট্যাব থেকে ওই ক্লাসের set-গুলোয় jump করা যাবে।

## UI Highlights

- **Wizard Step 1**: Class/Chapter/Type/Difficulty dropdowns + optional experiment picker + question count slider
- **Wizard Step 2**: Loading state ("AI প্রশ্ন বানাচ্ছে..."), fail হলে retry
- **Wizard Step 3 — Editor**:
  - MCQ: card list, inline edit, correct option toggle
  - CQ: **split-screen** — বামে stem editor, ডানে ক/খ/গ/ঘ scroll panel; sample answer collapsible
  - Top-right: "Save Draft" / "Assign to Class" / "Export PDF"
- **PDF Export**: `jspdf` + custom Bangla font (Noto Sans Bengali) — hero, prints "SN Chemistry Lab" header, questions numbered, marks column
- **Results Sheet**: MCQ স্কোর টেবিল instant; CQ pending → click → grading modal with AI similarity badge (0-100%) beside each part

## Technical Notes

- Gemini call: `gemini-2.5-flash` for generation, `gemini-embedding-001` + cosine similarity for CQ AI-assist
- Log every AI call via existing `logAiUsage`
- Rate limit: reuse `usage_counters` (count generate calls per teacher/day, e.g. 50/day)
- PDF: dynamic import `jspdf` inside handler to keep bundle slim
- Bengali font: base64 embed in a `.ts` const file

## Files to Create/Change

**New:**
- migration: 4 tables + RLS + GRANTs
- `src/lib/questions.functions.ts`, `tests.functions.ts`, `grading.functions.ts`
- `src/lib/gemini-questions.server.ts` (prompt builders + JSON schemas)
- `src/lib/pdf-export.ts` (client-side PDF)
- routes: `teacher.questions.*`, `app.tests.*` (7 files)
- components: `QuestionWizard.tsx`, `McqEditor.tsx`, `CqEditor.tsx`, `TestRunner.tsx`, `ResultsSheet.tsx`, `CqGradingPanel.tsx`

**Edit:**
- `src/routes/teacher.index.tsx` — "AI Question Generator" card
- `src/routes/teacher.classes.$classId.tsx` — "Tests" tab দেখাবে ওই ক্লাসের set

## Rollout Order

1. Migration (tables + RLS)
2. Backend server functions + Gemini prompts
3. Teacher wizard + editor UI
4. Assign to class + PDF export
5. Student test-taking UI
6. Auto-grade + CQ grading panel

বেশ বড় ফিচার — ৬টা ধাপে ছাড়ব, প্রতি ধাপ শেষে চালিয়ে দেখতে পারবে।

## Questions / Confirmations

1. **Question count per generation** — একবারে কতগুলো MCQ (৫/১০) এবং কতগুলো CQ (১/৩) default দেব?
2. **PDF branding** — SN Chemistry Lab header + স্কুল/টিচার নাম bass থাকবে; আলাদা কিছু চাই?
3. **Free vs Pro** — এই ফিচার কি premium (paywall) নাকি সবাই ফ্রি পাবে?

উত্তর দিলে সাথে সাথে migration দিয়ে শুরু করব।
