
# Chemistry AI Tutor — ChatGPT-style Full Page Chat

## 🎯 লক্ষ্য
বর্তমান floating bubble (`LabAIAssistant`) থাকবে শুধু lab-এর ভিতরে contextual help-এর জন্য। নতুন একটা **dedicated `/tutor` route** তৈরি হবে — সেখানে ChatGPT-এর মতো sidebar + main chat + streaming + RAG থাকবে।

---

## 📐 আর্কিটেকচার

```text
/tutor
├─ Sidebar (left, 280px)
│   ├─ [+ নতুন চ্যাট] button
│   ├─ "Ask from Book 📚" toggle (RAG mode)
│   ├─ Search input
│   └─ Conversation list (rename / delete on hover)
│
└─ Main chat area
    ├─ Header: conversation title + model picker + clear
    ├─ Message stream (markdown + KaTeX rendering)
    │   ├─ User bubble (right)
    │   ├─ Assistant bubble (left, with copy/regenerate)
    │   └─ Source citations (RAG mode — page references)
    ├─ "AI is thinking…" / streaming cursor
    └─ Composer
        ├─ Auto-grow textarea
        ├─ Stop generating button (during stream)
        └─ Send (Enter / Shift+Enter for newline)
```

---

## 🚀 Phase 1 — Core Chat (localStorage)

কোনো login ছাড়াই কাজ শুরু — সব data browser-এ থাকবে।

**নতুন ফাইল:**
- `src/routes/tutor.tsx` — main route with SEO head()
- `src/components/tutor/TutorLayout.tsx` — sidebar + outlet layout
- `src/components/tutor/ChatSidebar.tsx` — conversation list
- `src/components/tutor/ChatWindow.tsx` — message stream
- `src/components/tutor/MessageBubble.tsx` — markdown + KaTeX
- `src/components/tutor/Composer.tsx` — textarea + send/stop
- `src/lib/tutor-store.ts` — Zustand-like store (conversations, active id, persist to localStorage)
- `src/lib/tutor-stream.functions.ts` — streaming server route (see Phase 2 note)

**Streaming setup:**
- `src/routes/api/tutor/stream.ts` — server route that proxies Lovable AI Gateway with `stream: true`, returns SSE
- Frontend: `fetch('/api/tutor/stream', { signal: abortController.signal })`, parse SSE line-by-line, append tokens to last assistant message
- Stop button calls `abortController.abort()`

**Dependencies to add:**
- `katex` + `rehype-katex` + `remark-math` — equation rendering
- `nanoid` — conversation IDs

**Auto title generation:**
First user message-এর পর একটা separate non-streaming call → "Generate a 3-5 word Bangla title for this chat". Conversation title-এ save।

---

## 🧠 Phase 2 — RAG "Ask from Book" Toggle

**যা আছে:** `kb_documents` table + `match_kb_documents` RPC। **যা লাগবে:**

1. **Ingestion finish** — পুরো Class 9-10 PDF (313 pages) batched embed করে DB-তে। আমি একটা resumable Python script বানাব যা `processed_page` track করে।
2. **`src/lib/rag.functions.ts`:**
   - `embedQuery(text)` — Lovable AI Gateway `/v1/embeddings`
   - `retrieveContext(query, k=6)` — RPC call, return top chunks with page+chapter
3. **Streaming endpoint update:** যখন RAG mode on:
   - User query embed → retrieve → context inject into system prompt
   - Strict prompt: *"শুধু এই context থেকে উত্তর দাও। না থাকলে বলো 'বইয়ে এই বিষয়ে সরাসরি কিছু পাইনি, তবে general knowledge থেকে বলতে পারি…'"*
   - Response-এ source citations attach (page numbers shown as chips below message)

**ভবিষ্যতে বই যোগ:** একই table-এ `source` ও `class` field আছে। নতুন বইয়ের জন্য শুধু ingestion script-এ source name বদলে চালাবেন। RAG retrieval-এ optionally filter দেওয়া যাবে।

---

## 🔐 Phase 3 — Auth + Cloud Sync (publish-এর আগে)

**Database migration:**
```sql
-- conversations
id uuid pk, user_id uuid fk auth.users, title text,
mode text ('general'|'book'), created_at, updated_at

-- messages
id uuid pk, conversation_id uuid fk, role text, content text,
sources jsonb (RAG citations), created_at

-- RLS: user_id = auth.uid() for both
```

**Auth flow:** Email/password + Google sign-in (Lovable broker)। `_authenticated/tutor` layout-এ move করা হবে। localStorage থেকে cloud-এ one-time migration banner থাকবে।

---

## 🎨 প্রম্প্ট তৈরির গাইড — Step by Step

আমি ৪টা ধাপে আপনার সাথে interactively prompt design করব। প্রতি ধাপে আমি আপনাকে questions জিজ্ঞেস করব, আপনি উত্তর দিলে আমি draft বানাব, আপনি tweak করবেন।

**ধাপ ১ — Identity & Audience**
- Tutor-এর persona নাম কী? (যেমন "রসায়ন স্যার", "ChemBot")
- Target audience: শুধু class 9-10? নাকি HSC + Honors-ও cover করবে?
- Teacher নাকি tutor tone? (formal vs friendly)

**ধাপ ২ — Teaching Style**
- Always Socratic (প্রশ্ন করে শেখানো)? নাকি direct answer + explanation?
- ভুল করলে কেমন response? (gentle correction / quiz back / explain why wrong)
- Real-life example দেবে কি? (যেমন CO₂ → fire extinguisher)

**ধাপ ৩ — Language & Format**
- Bangla:English ratio কেমন? (আমার ধারণা 70:30, scientific terms English-এ)
- Response length: short (3-4 lines) / medium (paragraph) / detailed (with headings)?
- Equation format: KaTeX (`$CaCO_3$`), code blocks, tables — কোনটা priority?

**ধাপ ৪ — Boundaries & Safety**
- Off-topic প্রশ্ন (যেমন physics, math) — answer দেবে নাকি redirect?
- Homework "exact answer" চাইলে কী করবে? (give hint vs full answer)
- Religious / political / inappropriate — কীভাবে decline?

প্রতি ধাপ শেষে আমি system prompt-এর সেই অংশ লিখব, শেষে পুরোটা assemble করে `chat.functions.ts`-এ বসাব।

---

## 📋 Implementation Order

1. **Phase 1 setup** (1 turn): dependencies install + route + layout skeleton
2. **Streaming + composer** (1 turn): SSE proxy + token-by-token render + stop
3. **Sidebar + persistence** (1 turn): conversation CRUD + localStorage
4. **KaTeX + markdown polish** (1 turn): chemistry equation rendering
5. **Prompt design** (interactive, 4 mini-turns): ধাপ ১-৪ একসাথে আলোচনা করে finalize
6. **RAG ingestion + toggle** (2 turns): batched ingest script + retrieval logic
7. **Auth + DB migration** (publish-এর আগে, 2 turns)

---

## 🔧 Technical Notes

- Streaming: TanStack server route `/api/tutor/stream` returns `text/event-stream` (server fn returns plain DTO, not streams)
- Abort: `AbortController` on client, signal passed to fetch
- KaTeX: server-side rendering safe, no `window` dependency
- ChatGPT-like UX: virtualization (`@tanstack/react-virtual`) only if conversation > 200 messages
- Existing `LabAIAssistant` floating bubble থাকবে — lab-এর ভিতরে quick contextual Q&A-এর জন্য। `/tutor` হবে deep learning hub।

---

**পরের step:** এই plan approve করার পর Phase 1 দিয়ে শুরু করব, তারপর প্রম্প্ট তৈরির ধাপ ১ এর প্রশ্ন দিয়ে interactive design শুরু হবে।
