# Progress Tracking — Plan

## এখন কী আছে
- **Streak / 21-day challenge**: `PersonalHero.tsx`-এ শুধু `localStorage` — browser clear করলে বা অন্য ডিভাইসে গেলে হারিয়ে যায়।
- **Last lab**: `localStorage` (`drchem:last_lab`) — same problem.
- **Test attempts** (MCQ/CQ): DB-তে `test_attempts` টেবিলে সেভ হয় ✅
- **Lab reports** (Oxygen, CO2, NaCl ইত্যাদি): সাবমিট করলে শুধু on-screen দেখায়, **DB-তে সেভ হয় না** → টিচার দেখতে পারে না, স্টুডেন্টও ইতিহাস পায় না।

## তোমাকে আলাদা কিছু করতে হবে?
শুধু **একটা মাইগ্রেশন** (নতুন `lab_attempts` টেবিল + RLS + GRANT) — সেটাও আমিই approve-এর জন্য পাঠাব। বাকি সব code আমি বিল্ড করব। তোমাকে হাতে কিছু SQL চালাতে হবে না।

## আমি যা বানাব

### 1. Database (migration)
```
lab_attempts
  id, student_id, experiment_id, mode,
  accuracy, grade, duration_sec,
  mistakes_count, steps_completed, steps_total,
  report_json (jsonb), created_at
```
- RLS: student নিজেরটা read/insert; teacher শুধু own-class student-দের attempts দেখবে (has_role + class_members দিয়ে); admin all।
- Index: `(student_id, created_at desc)`, `(experiment_id)`।

### 2. Server functions (`src/lib/progress.functions.ts`)
- `saveLabAttempt(report)` — auth required, insert।
- `getMyProgress()` — student: labs done, streak (from DB), avg grade, per-chapter progress, recent attempts।
- `getStudentProgress(studentId, classId)` — teacher: same shape for one student।
- `getClassProgress(classId)` — teacher: leaderboard + completion % per experiment।

### 3. Lab integration
প্রতিটা lab component-এর submit handler-এ (Oxygen, CO2, NaCl, Na2CO3, CuSO4, Ionic — এই ৬টায় `LabReport` আছে) একটা call add:
```ts
saveLabAttempt(r).catch(console.error);  // fire-and-forget
```

### 4. Streak → DB
`PersonalHero.tsx`-এর challenge logic-কে DB-backed করব — নতুন `streaks` টেবিল (`user_id, current_days, longest_days, last_check_date, start_date`)। Login-এর পর server থেকে load, localStorage fallback হিসেবে থাকবে। কোনো lab খুললে/টেস্ট দিলে auto check-in।

### 5. Progress UI

**Student — `/app/progress`** (নতুন route):
- Streak card (current / longest / 21-day ring)
- "Labs completed" — total + per chapter progress bars
- "Test average" — MCQ/CQ combined
- Recent activity feed (labs + tests mixed, latest 20)
- Best grades table

**Teacher — `/teacher/classes/$classId`-এ নতুন "Progress" ট্যাব**:
- Class leaderboard (avg grade, labs done, tests done)
- Per-experiment completion heatmap
- Individual student drill-down → same student view

**Dashboard-এ সংযোগ**:
- `/app` home-এ ছোট "Your Progress" card (streak + labs done + "View all →")।
- Teacher `/teacher` home-এ "Active students this week" mini stat।

## Rollout (এক ধাপেই ছাড়ব)
1. Migration approve → tables ready
2. Server functions
3. Lab submit hooks (৬টা lab)
4. Streak DB migration + PersonalHero rewire
5. `/app/progress` + teacher progress tab
6. Dashboard cards

## Questions
1. **Streak reset rule** — এখন এক দিন miss করলে reset হয়। DB-তেও same রাখব, নাকি "freeze/grace day" allow করব?
2. **Lab attempt dedup** — একই lab বারবার submit করলে সব save করব (attempt history), নাকি শুধু best grade রাখব? (আমার recommendation: সব save, UI-তে best দেখাই।)

উত্তর দিলে/skip করলে default (strict reset + সব save) দিয়ে বিল্ড শুরু করে দিচ্ছি।
