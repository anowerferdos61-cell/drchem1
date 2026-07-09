
## লক্ষ্য
YouTube ডেমো ভিডিও (`EADWRKtshCY`) landing page-এ ২ জায়গায় দেখানো — একটা প্রমিনেন্ট সেকশনে embed, আরেকটা "Watch Demo" বাটনে click → modal।

---

## 📍 প্লেসমেন্ট প্ল্যান

### ১. নতুন সেকশন: **"What is Dr. Chem?"**
- **কোথায়:** Hero-এর ঠিক নিচে, Problem section-এর আগে (স্ক্রল করলে সাথে সাথে চোখে পড়বে)
- **কেন এখানে:** Hero-তে user attention পিক-এ থাকে; নিচে এলেই ভিডিও — highest engagement zone
- **Layout:** Full-width সেকশন, centered
  - **Eyebrow badge:** ▶ "৯০ সেকেন্ডে দেখে নিন" (or similar)
  - **Title (H2):** `What is Dr. Chem?`
  - **Subtitle (Bangla):** "ভিডিও দেখে জেনে নিন আমাদের কাজ সম্পর্কে — ভার্চুয়াল ল্যাব, AI টিউটর ও ভাইভা প্র্যাকটিস কীভাবে কাজ করে।"
  - **Video player:** 16:9 responsive YouTube embed, rounded corners, soft gradient glow behind
  - **নিচে ২টা bullet chip:** "🧪 4০+ ল্যাব" · "🤖 AI টিউটর" · "🎓 ভাইভা প্র্যাকটিস"
  - **CTA button:** "এখনই ফ্রি শুরু করো →" (link to `/app`)

### ২. Hero-এর "Login" বাটন → "Watch Demo" বাটন
- বর্তমান Hero-তে `Try Free` + `Login` আছে
- `Login` বাটন এমনিতেই top-right UserMenu-তে আছে → duplicate
- সেটা replace করে **"▶ Watch Demo"** — click করলে একই ভিডিও একটা modal-এ open হবে (autoplay)
- Modal বন্ধ করার জন্য `Esc` / backdrop click / X বাটন

---

## 🛠️ Technical

- **নতুন কম্পোনেন্ট:** `src/components/landing/DemoVideoSection.tsx` — YouTube iframe embed (privacy-enhanced `youtube-nocookie.com`, `?rel=0`)
- **নতুন কম্পোনেন্ট:** `src/components/landing/VideoModal.tsx` — Radix Dialog wrapper, autoplay when open
- **`src/routes/index.tsx` পরিবর্তন:**
  - `Hero` → `Login` বাটন replace with "Watch Demo" (opens modal via shared state)
  - `Landing()`-এ `<DemoVideoSection />` inject Hero-এর পরে
  - `useState` দিয়ে modal open state manage (Hero + Section দুটাই একই modal trigger করতে পারে)
- Video ID constant: `EADWRKtshCY` — একটা জায়গায় রাখা হবে (`VIDEO_ID`)
- Lazy load: iframe শুধু modal open হলে render হবে (bandwidth save)

---

## রিভিউ চাই

উপরের প্ল্যান ঠিক আছে? বিশেষ করে:
1. "What is Dr. Chem" সেকশনটা Hero-এর ঠিক পরে বসাবো — নাকি Problem/Solution-এর পরে?
2. Hero-এর `Login` বাটন কি "Watch Demo" দিয়ে replace করব, নাকি ৩টা বাটন (Try Free + Watch Demo + Login) রাখব?
3. Bangla subtitle টা ঠিক আছে, নাকি অন্য কিছু লিখব?

OK বললেই বিল্ড শুরু করি।
