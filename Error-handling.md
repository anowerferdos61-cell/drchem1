# Dr. Chem — Error Handling

> এক consistent shape। ইউজারকে বাংলায় বলি, ডেভেলপারকে stack দেখাই, প্রোডাকশনে silent failure নাই।

---

## 1. `AppError` class

সব known/expected error এই class দিয়ে throw করি।

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,       // machine-readable: "not_found", "forbidden", ...
    public status: number,     // HTTP status
    public userMessage: string,// বাংলায় ইউজারকে দেখানোর জন্য
    public details?: unknown,  // dev logging
  ) {
    super(userMessage);
    this.name = "AppError";
  }
}
```

**Throw করি server fn-এ:**
```typescript
if (!row) throw new AppError("not_found", 404, "এই প্রশ্নপত্র পাওয়া যায়নি");
if (!isAdmin) throw new AppError("forbidden", 403, "শুধু অ্যাডমিন এটা করতে পারবে");
```

---

## 2. HTTP Status Guide

| Status | কখন | Example |
|---|---|---|
| **200** | সফল | সব normal response |
| **400** | Bad input | invalid UUID, missing field, zod fail |
| **401** | সাইন-ইন লাগবে | `requireSupabaseAuth` middleware reject |
| **403** | সাইন-ইন আছে কিন্তু permission নাই | non-admin admin route হিট করলো |
| **404** | রিসোর্স নাই | class code ভুল, deleted question set |
| **409** | conflict / duplicate | একই class code, duplicate class member |
| **422** | validation fail (business rule) | already published, quota exceeded |
| **429** | rate-limited | daily AI quota শেষ |
| **500** | server bug / unexpected | catch-all, log with stack |
| **503** | upstream fail | Gemini down, Supabase timeout |

---

## 3. Response Shape

**সবসময় এই shape:**

```typescript
type ApiResponse<T> =
  | { ok: true;  data: T }
  | { ok: false; code: string; msg: string; details?: unknown };
```

**সফল:**
```json
{ "ok": true, "data": { "id": "...", "title": "..." } }
```

**ফেল:**
```json
{ "ok": false, "code": "forbidden", "msg": "শুধু অ্যাডমিন এটা করতে পারবে" }
```

Server function auto-wrap করে — handler শুধু data return করে বা throw করে; wrapper stack-এ AppError catch হয়।

---

## 4. Server-Side Wrapper

```typescript
// src/lib/server-response.ts
export function wrap<T>(fn: () => Promise<T>): Promise<ApiResponse<T>> {
  return fn()
    .then((data) => ({ ok: true as const, data }))
    .catch((err) => {
      if (err instanceof AppError) {
        return { ok: false as const, code: err.code, msg: err.userMessage };
      }
      // unknown → 500
      console.error("[unhandled]", err);
      return {
        ok: false as const,
        code: "internal",
        msg: "কিছু একটা ভুল হয়েছে, আবার চেষ্টা করো",
      };
    });
}
```

---

## 5. Client-Side Handling

### React Query error → toast
```typescript
const { data } = useSuspenseQuery({
  queryKey: [...],
  queryFn: async () => {
    const res = await fetchThing({ data: { id } });
    if (!res.ok) {
      toast.error(res.msg);
      throw new Error(res.code);   // triggers errorComponent
    }
    return res.data;
  },
});
```

### Route-level fallback
প্রতিটা route এর দুইটা boundary lagbe:

```typescript
export const Route = createFileRoute("/app/tests/$setId")({
  loader: /* ... */,
  errorComponent: ({ error, reset }) => (
    <div>
      <p>দুঃখিত — {(error as Error).message || "কিছু ভুল হয়েছে"}</p>
      <button onClick={() => { router.invalidate(); reset(); }}>
        আবার চেষ্টা করো
      </button>
    </div>
  ),
  notFoundComponent: () => <p>এই টেস্ট খুঁজে পাওয়া গেল না।</p>,
});
```

### Global 401 handler
Supabase client `onAuthStateChange` → `SIGNED_OUT` → `router.navigate({ to: "/login" })`।

---

## 6. Logging Strategy

| Level | Where | Example |
|---|---|---|
| `console.error` | server (Worker logs) | `AppError` না, unknown throw |
| `console.warn` | server | quota near limit, deprecated call |
| `logAiUsage` | server | প্রতিটা AI call (silent — throw করবে না) |
| Toast | client | user-facing message |
| Silent | client | analytics tracker fail — user experience break করবে না |

**নিয়ম:** ইউজারকে কখনো raw stack trace দেখাব না। ডেভেলপারকে কখনো ইউজার message-এর ভরসায় debug করতে বলব না — সবসময় `console.error` original error।

---

## 7. Common Error Codes

| Code | Status | ইউজারকে বলি |
|---|---|---|
| `unauthenticated` | 401 | "আগে সাইন-ইন করো" → redirect `/login` |
| `forbidden` | 403 | "এটা করার অনুমতি তোমার নাই" |
| `not_found` | 404 | "খুঁজে পাওয়া গেল না" |
| `invalid_input` | 400 | "ইনপুট ঠিক না — {field} check করো" |
| `quota_exceeded` | 429 | "আজকের AI quota শেষ, কাল আবার চেষ্টা করো" |
| `subscription_required` | 402 | "এই ফিচার Pro plan-এ, upgrade করো" |
| `upstream_ai_fail` | 503 | "AI সার্ভিস এখন busy, একটু পর আবার" |
| `db_conflict` | 409 | context-specific message (already joined ইত্যাদি) |
| `internal` | 500 | "কিছু ভুল হয়েছে, আবার চেষ্টা করো" |

---

## 8. Testing Errors

- Playwright script: intentionally invalid input → assert `res.ok === false` + `res.code === "invalid_input"`
- RLS test: signed-out user → 401 verify
- Rate limit: 11টা call in a row → 429 verify
- Not-found route → `/app/tests/00000000-...` → notFoundComponent render check
