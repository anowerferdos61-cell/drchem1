# RAG সিস্টেম প্ল্যান — Dr. Chem Tutor

## এখনকার অবস্থা (audit)

- ✅ `kb_documents` টেবিল আছে — pgvector embedding, source/class/subject/chapter/page/metadata কলাম সহ
- ✅ `match_kb_documents()` SQL function ready (cosine similarity, top-K, filter)
- ✅ UI-তে "📚 বই থেকে উত্তর" toggle (`ragMode`) আছে
- ❌ কিন্তু `kb_documents` টেবিল **খালি (0 rows)** — কোনো বই ingest করা হয়নি
- ❌ `/api/tutor/stream` endpoint এখনো RAG retrieve করছে না — শুধু system prompt + chat history পাঠাচ্ছে
- ❌ Chat history শুধু `localStorage`-এ — DB-তে save হয় না, device বদলালে হারিয়ে যায়
- ❌ Lab AI Assistant (`chat.functions.ts`) ও RAG ব্যবহার করে না

---

## তোমার প্রশ্নের সরাসরি উত্তর

### 1. "PDF (গাইড, প্রশ্ন ব্যাংক, ল্যাব রিপোর্ট) দিলে add করতে পারবে?"
**হ্যাঁ, পুরোপুরি পারব।** PDF যেকোনো size/quantity-তে দিতে পারো — text-based PDF হলে সরাসরি, scanned হলে OCR দিয়ে। প্রতিটি PDF chapter/page ধরে ছোট ছোট chunk (≈800 char) করে embedding বানিয়ে `kb_documents`-এ store করব। Metadata-তে রাখব: `source` (e.g. "NCTB Class 9-10 Guide"), `chapter`, `page`, `type` (theory/mcq/lab_report)।

### 2. "উত্তর কি আরও better হবে?"
**হ্যাঁ — উল্লেখযোগ্যভাবে।** এখন AI শুধু training data থেকে generic answer দিচ্ছে, যা NCTB-র exact wording/equation/example-এর সাথে সবসময় মেলে না। RAG যোগ করলে:
- **NCTB textbook-এর exact line quote** করতে পারবে → exam-এ যেভাবে লিখতে হয় ঠিক সেভাবে
- **Page citation** ("📖 Class 9-10, Chapter 5, Page 78") দেখাবে → trust + verify
- **Question bank প্রশ্ন** থেকে similar question detect করে board-style answer pattern দেবে
- **Hallucination কমবে** — বই-এ যা নেই সেটা বলবে "বইয়ে এ topic পাইনি, general concept হিসেবে…"

প্রত্যাশিত accuracy: এখন ≈70-80% → RAG-এর পর ≈92-95% (NCTB-bounded প্রশ্নে)।

### 3. "AI কি প্রশ্ন ঠিকভাবে বুঝবে?"
বাংলা প্রশ্ন বোঝার জন্য `google/gemini-embedding-001` ব্যবহার করব — এটি Bangla + English mixed text-এ ভালো কাজ করে। এর সাথে:
- **Hybrid query**: Bangla প্রশ্ন embed করে Bangla content match করবে, English term (যেমন "covalent bond") embed করে English-tagged content-ও match করবে
- **Query rewriting**: ছোট/অস্পষ্ট প্রশ্ন (যেমন "এটা কী?") AI দিয়ে আগে expand করব (previous message context সহ) তারপর retrieve
- **Top-K = 6** chunk retrieve, re-rank করে top 3 LLM-কে দেব

### 4. "Chat সব save হবে তো?"
এখন **না** — শুধু browser localStorage-এ। নতুন device/browser খুললে গায়েব। নতুন প্ল্যানে:
- Lovable Cloud-এ `chat_conversations` + `chat_messages` টেবিল
- প্রতিটি user-এর জন্য RLS (own data only)
- Sign-in (Google + email) যোগ করব → cross-device sync
- Tutor + Lab AI Assistant + Viva — তিনটার history-ই persist হবে
- Export (PDF/Markdown) button

### 5. "UI সুন্দর হবে?"
হ্যাঁ — RAG-এর সাথে UI upgrade:
- প্রতিটি AI উত্তরের নিচে **citation chips**: 📖 Chapter 3 · Page 45 (click → source preview drawer)
- **Confidence indicator**: 🟢 High (বই-থেকে) / 🟡 Medium (mixed) / 🔴 General knowledge
- **Source drawer**: retrieved chunks-এর preview, highlighted matched text
- **Admin upload UI**: PDF drag-drop → progress bar → chunk preview → "Ingest" button
- **Knowledge browser**: chapter-wise navigate করে দেখা যাবে কী কী আছে

---

## প্রস্তাবিত Implementation (3 Phase)

### Phase A — RAG Foundation (highest impact)
1. **PDF Ingestion pipeline** (`/admin/ingest` route, admin-only)
   - PDF upload → text extract (text PDF সরাসরি; scanned হলে Gemini Vision OCR)
   - Chunk by heading/paragraph (≈800 char, 100 char overlap)
   - Per chunk: metadata tag (chapter, page, type), embedding via Lovable AI
   - Bulk insert into `kb_documents`
2. **Retrieval-augmented stream endpoint**
   - User query → optional query rewrite → embed → `match_kb_documents` top-6
   - Retrieved chunks system prompt-এ inject ("নিচের NCTB excerpt ব্যবহার করে উত্তর দাও…")
   - Stream response with citations metadata side-channel
3. **Citation UI** in `MessageBubble` — chips, source drawer

### Phase B — Chat Persistence + Auth
4. Migration: `chat_conversations`, `chat_messages` tables + RLS
5. Google + email/password auth (Lovable broker), login route
6. `tutor-store` rewrite to sync with DB (optimistic + background sync)
7. Same persistence for Lab AI Assistant chat + Viva sessions

### Phase C — Polish
8. Admin knowledge browser + delete/re-ingest
9. Confidence scoring, "verify in book" deep links
10. Per-experiment RAG (Lab AI Assistant-ও বই থেকে answer দেবে)
11. Export chat as PDF/MD

---

## সীমাবদ্ধতা (সৎভাবে)

- **Scanned PDF**-এ OCR error ≈3-5% থাকবে (Bangla যুক্তবর্ণে)
- **গাণিতিক equation**-এর কিছু PDF-এ image হিসেবে থাকে → OCR-এ মিস হতে পারে; manual review লাগবে
- **প্রথম ingest**-এ সময় লাগবে (≈300 page PDF → ~5-10 মিনিট + কিছু embedding cost)
- বই-এর বাইরের প্রশ্নে RAG help করবে না — তখন general LLM mode-এ fall back করবে

---

## পরবর্তী পদক্ষেপ

PDF ready হলে পাঠাও (একসাথে কয়েকটা হলেও সমস্যা নাই)। আমি আগে **Phase A** শুরু করব — PDF ingest + RAG retrieval + citation UI। তারপর তুমি test করে দেখবে answer quality, তারপর Phase B (persistence + auth) এ যাব।

**কোন PDF আগে দিতে চাও?**
1. NCTB মূল textbook (Class 9-10 রসায়ন)
2. Guide book
3. প্রশ্ন ব্যাংক (board questions)
4. ল্যাব practical manual

— সব একসাথেও দিতে পারো, আমি source-tag আলাদা রেখে ingest করব।
