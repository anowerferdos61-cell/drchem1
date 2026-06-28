# Dr. Chem — Subscription System Plan

## Plans

| Plan | Price (BDT) | Audience | Trial |
|---|---|---|---|
| Free | ৳0 | Everyone | — |
| Student Monthly | ৳149/mo | Individual student | 7-day free trial |
| Student Yearly | ৳1,290/yr (~28% off) | Individual student | 7-day free trial |
| Teacher | ৳499/mo or ৳4,990/yr | Teacher + class roster (up to 40 students) | 7-day trial |

### Free tier limits
- **2 labs** unlocked (pH Scale + Indicator Comparison — most introductory)
- **AI Tutor: 5 messages/day** (resets midnight Asia/Dhaka)
- **Notes:** read-only (can view shared notes, cannot create/edit)
- **Curriculum Hub:** browse chapters, but locked labs show paywall
- Other 10 labs → locked with "Upgrade to Pro" CTA

### Paid tier (Student / Teacher)
- All 12 labs unlocked
- Unlimited AI Tutor with RAG
- Full Notes (create, edit, share)
- Teacher tier: dashboard, class management, student progress

---

## Payment Flow — Hybrid

**Phase 1 (MVP, this build): Manual bKash**
1. User clicks "Upgrade" → modal shows bKash merchant number + amount + plan
2. User sends money via bKash app → enters TrxID + phone in form
3. Submission creates `payment_request` row (status: `pending`)
4. Admin sees pending requests at `/admin/payments` → verifies on bKash merchant app → clicks "Approve" → subscription activates
5. Email/in-app notification to user

**Phase 2 (later): SSLCommerz auto gateway**
- Same data model, replace manual verification with webhook
- `/api/public/sslcommerz/webhook` — verifies signature, activates subscription

---

## Database Schema

```text
subscription_plans
  id, code (free|student_monthly|student_yearly|teacher_monthly|teacher_yearly)
  name_bn, name_en, price_bdt, duration_days, features (jsonb)

subscriptions
  id, user_id (fk auth.users), plan_code, status (trialing|active|expired|cancelled)
  started_at, trial_ends_at, current_period_end, cancelled_at
  unique partial index: one active subscription per user

payment_requests
  id, user_id, plan_code, amount_bdt, method (bkash|nagad)
  sender_phone, trx_id, screenshot_url (optional)
  status (pending|approved|rejected), reviewed_by, reviewed_at, note
  created_at

usage_counters
  user_id, date (Asia/Dhaka), ai_messages_used
  pk (user_id, date) — for free tier daily quota
```

All tables: RLS + GRANTs. Users see own rows; admins (via `has_role`) see all.

---

## Entitlement Logic

Server function `getEntitlements(userId)` returns:
```ts
{ plan: 'free'|'student'|'teacher', isActive: bool,
  trialEndsAt, periodEndsAt,
  canAccessLab(labId): bool,
  aiMessagesRemaining: number }
```
- Cached per request via TanStack Query
- Lab routes call `requireLabAccess(labId)` server fn → throws 402 if locked
- AI Tutor stream endpoint checks + increments `usage_counters` atomically

---

## UI Surfaces

1. **`/pricing`** — public marketing page with 3 cards (Free / Student / Teacher), monthly/yearly toggle, FAQ
2. **Paywall modal** — triggered on locked lab click; shows plan benefits + "Start 7-day trial" + "Pay with bKash"
3. **`/app/billing`** — current plan, days remaining, payment history, cancel button
4. **`/admin/payments`** — admin-only table of pending bKash submissions with approve/reject
5. **Lab cards** — small "Pro" badge on locked labs in Practical Lab Room
6. **AI Tutor** — chip showing "৩/৫ মেসেজ বাকি আজকের জন্য" for free users; upgrade CTA when 0

---

## 7-Day Trial Logic

- New signup → auto-creates `trialing` subscription for `student_monthly` plan
- Full Pro access during trial, no payment needed
- Day 5: in-app banner "Trial ends in 2 days"
- Day 7: subscription transitions to `expired` → user drops to Free tier
- One trial per user (enforced via `subscriptions.trial_used` flag on profile)

---

## Build Order

1. **Schema + RLS** — 4 tables, seed `subscription_plans`
2. **Entitlement engine** — server fn + React hook `useEntitlements()`
3. **Trial auto-grant** — extend `handle_new_user()` trigger
4. **`/pricing` page** + paywall modal component
5. **bKash submit flow** — form + `payment_requests` insert
6. **Admin role + `/admin/payments`** approval UI
7. **Wire lab gating** — Dashboard cards + lab route guards
8. **AI Tutor quota** — counter + UI chip
9. **`/app/billing`** — user-facing subscription management
10. **Email notifications** (optional) — approval confirmation

---

## Open Questions Before Build

- bKash merchant number to display?
- Admin email(s) — who gets the `admin` role seeded?
- Should yearly discount be different from ~28%?
- Trial: should it require card/bKash upfront, or true no-payment-needed?

Once you confirm, I'll build it phase-by-phase starting with schema + pricing page.
