# Dr. Chem — Security

> RLS-first। কখনো ধরে নিব না "client trusted"। সব privilege check server-এ।

---

## Checklist (প্রতিটা PR-এ verify)

- ☑ **Input validation** — সব server fn `.inputValidator()` দিয়ে Zod বা explicit type parse করে
- ☑ **RLS enabled** — নতুন প্রতিটা public টেবিলে `ENABLE ROW LEVEL SECURITY`
- ☑ **GRANT statement** — RLS-এর আগে explicit grant, না হলে PostgREST permission error
- ☑ **Roles separate table** — `user_roles`, কখনো `profiles.role` না (privilege escalation ঠেকাতে)
- ☑ **Server-only secrets** — সব `process.env.*` handler বডিতে পড়া, module scope-এ না
- ☑ **HTTPS + CORS** — TanStack Start same-origin, external CORS দরকার নাই
- ☑ **Auth tokens** — Supabase JWT `httpOnly` না (SPA), তাই XSS-safe React (কোনো `dangerouslySetInnerHTML` untrusted content-এ না)
- ☑ **Webhook signature** — `/api/public/*`-এ HMAC verify (নতুন webhook যোগ করলে)
- ☑ **Rate limiting** — AI endpoint-এ `usage_counters` daily quota + subscription check
- ☑ **No admin from client** — কোনো `supabaseAdmin` reference `.functions.ts` module scope-এ না, শুধু handler-এর ভিতরে `await import()`

---

## 1. Input Validation

সব server function `.inputValidator()` দিয়ে টাইপ যাচাই করে। untrusted input direct DB-তে যাবে না।

```typescript
export const publishToClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { setId: string; classId: string }) => {
    if (!isUuid(data.setId) || !isUuid(data.classId)) throw new Error("Invalid id");
    return data;
  })
  .handler(async ({ data, context }) => { /* ... */ });
```

---

## 2. Rate Limiting

**AI endpoints:**
- Free tier: দিনে 10টা AI message (`usage_counters.ai_messages_used`)
- Pro tier: unlimited (verified via `has_active_pro(user)` RPC)
- প্রতিটা AI call এর আগে `increment_ai_usage(today)` — returns new count → limit exceeded হলে 429

**Analytics writes:**
- Server-side throttle: same session-এ 30 min idle হলে নতুন session, না হলে একই row update

---

## 3. Secrets in `.env`

| Variable | Where | Client-visible? |
|---|---|---|
| `SUPABASE_URL` | server | ❌ (browser → `VITE_SUPABASE_URL`) |
| `SUPABASE_SERVICE_ROLE_KEY` | server ONLY | ❌ NEVER |
| `SUPABASE_PUBLISHABLE_KEY` | server | ❌ (browser → `VITE_SUPABASE_PUBLISHABLE_KEY`) |
| `LOVABLE_API_KEY` | server | ❌ AI gateway auth |
| `GEMINI_API_KEY` | server | ❌ fallback direct Gemini |

**নিয়ম:**
- `.env` git-এ ignored (auto-managed by Lovable Cloud)
- `process.env.X` **কখনো** module-top-এ পড়বে না — শুধু handler বডিতে
- Client bundle-এ `VITE_*` ছাড়া কোনো secret পৌঁছাবে না (Vite strip করে)

---

## 4. HTTPS + CORS

- Production hosting → HTTPS mandatory (Cloudflare Workers auto)
- App-internal call → server function → same-origin, CORS নাই
- External webhook → `/api/public/*` prefix → auth bypass, কিন্তু handler-এ signature verify করতে হবে
- Supabase Data API → `SUPABASE_URL` (HTTPS only)

---

## 5. Auth Tokens (JWT)

- Supabase Auth → JWT access token + refresh token
- Storage: `localStorage` (`sb-<project>-auth-token`) — SPA pattern
- Server function → `attachSupabaseAuth` middleware আপনাআপনি `Authorization: Bearer` header attach করে
- Refresh: Supabase client auto-refresh, session expire হলে `/login`-এ redirect
- Signout → `supabase.auth.signOut()` → local storage clear

**Bearer token বাইরের origin-এ leak ঠেকাতে:**
- Playwright script `add_init_script` দিয়ে token সেট করা যাবে না — শুধু `page.evaluate` on localhost
- কোনো user-provided URL-এ automatic fetch করি না

---

## 6. RLS Policy Patterns

### Own row
```sql
CREATE POLICY "own" ON public.foo
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Role-gated (SECURITY DEFINER helper)
```sql
CREATE POLICY "admin all" ON public.foo
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
```

### Circular avoidance (class ↔ class_members)
```sql
-- ❌ direct join in policy → infinite recursion
-- ✅ SECURITY DEFINER helper
CREATE POLICY "class members read class" ON public.classes
  FOR SELECT USING (public.is_class_member(id, auth.uid()));
```

### Fail-closed writes
```sql
-- analytics_events / ai_usage_logs — কোনো INSERT policy নাই
-- মানে anon/authenticated write পারবে না
-- শুধু server function supabaseAdmin দিয়ে service_role bypass RLS
```

---

## 7. XSS + Injection

- React auto-escape → safe by default
- Markdown render → `react-markdown` with sanitizer
- AI response render → same sanitized markdown pipe
- User content DB-তে → parameterized queries (Supabase client) — কোনো string concat না
- File upload (future) → MIME check + size limit + Supabase Storage (isolated bucket)

---

## 8. Privileged Server Function Template

```typescript
export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetId: string }) => d)
  .handler(async ({ data, context }) => {
    // 1. verify caller role (via user's own RLS-scoped client)
    const { data: isAdmin } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    // 2. ONLY THEN import admin client
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.auth.admin.deleteUser(data.targetId);
  });
```

**Anti-pattern:** কখনো `supabaseAdmin` দিয়ে caller-এর role check করবে না — সেটা RLS bypass, তাই caller manipulate করলে ধরা যাবে না।
