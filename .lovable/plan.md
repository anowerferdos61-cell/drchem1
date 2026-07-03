# Mobile UI/UX Fix — Theory Labs

## সমস্যা (এখন যা হচ্ছে)

- প্রতিটি ল্যাব আলাদা layout দিয়ে বানানো — কোনটায় 2-column, কোনটায় 3-column, কোনটায় scroll লাগে।
- মোবাইল landscape-এ visual (বিকার/canvas) কখনো বড়, কখনো ছোট — inconsistent।
- Theory panel এবং controls একই স্ক্রিনে গাদাগাদি করে, পড়া কঠিন।
- User বারবার scroll করে বিরক্ত হয়।
- প্রতিবার একটা ল্যাব ঠিক করলে অন্যটা ভাঙে — কারণ shared pattern নেই।

## সমাধানের মূল আইডিয়া

একটা **reusable `<TheoryLabShell>` component** বানাব যেটা সব theory ল্যাব use করবে। এতে একবার UX ঠিক করলে সব ল্যাবে একসাথে ঠিক হবে।

## Shell-এর Layout (Mobile Landscape)

```text
┌─────────────────────────────────────────────┐
│  ← Back    Lab Title              [Badge]   │  ← 40px header
├──────────┬───────────────────────┬──────────┤
│          │                       │          │
│  INFO    │      VISUAL           │ CONTROL  │
│  (25%)   │      (50%)            │  (25%)   │
│          │      centered         │          │
│  swipe-  │      auto-fit         │  sliders │
│  able    │                       │  buttons │
│  cards   │                       │          │
│          │                       │          │
├──────────┴───────────────────────┴──────────┤
│  [Theory ▲]  bottom sheet — pull up for docs│  ← collapsed by default
└─────────────────────────────────────────────┘
```

**Mobile portrait / tablet / desktop:** shell auto-switches to a stacked/wider layout — same 3 slots, different arrangement.

## Key UX Rules (Shell-এর মধ্যে enforce হবে)

1. **Visual always centered, always fits** — `object-fit: contain` behavior, max-height = viewport height minus header.
2. **No page scroll ever** on the main experiment surface. Theory/docs go into a pull-up bottom sheet.
3. **Text sizes are tokenized** — `text-lab-sm`, `text-lab-base`, `text-lab-lg` — one place to tune globally.
4. **Controls always on right thumb** (right column on landscape) — reachable while holding phone.
5. **Info cards swipeable** on left if content overflows — no vertical scroll inside them.

## Rollout Plan

**Phase A — Build the shell (this turn)**
- Create `src/components/lab/TheoryLabShell.tsx` with the 3-slot API: `info`, `visual`, `controls`, plus optional `theory` (bottom sheet).
- Add lab typography tokens to `src/styles.css`.
- Migrate `KineticTheoryLab` as the reference implementation.

**Phase B — Migrate remaining theory labs (next turns, batched)**
- pH Scale, Indicator, Diffusion, Heating Curve, Atom Builder, Atom Models, Aufbau, Isotope, Electron Config, Periodic Trends, Group Reactivity, Periodic Anomalies, Electrochemical Series, Bonding, Ionic, Solubility.
- Each migration = swap outer layout for `<TheoryLabShell>`, keep the lab's own logic untouched.

**Phase C — Polish**
- Test on real mobile viewport (Playwright screenshots at 812×375 landscape).
- Tune tokens once, applies everywhere.

## Technical Details

- `TheoryLabShell` uses CSS Grid with `grid-template-columns: 25% 50% 25%` on landscape, `1fr` stacked on portrait.
- Visual slot uses `aspect-ratio` + `max-h-full` + flexbox centering — child SVG/canvas auto-shrinks.
- Bottom sheet uses shadcn `Drawer` (already installed) — no new deps.
- Info cards use horizontal snap-scroll on mobile, vertical stack on desktop.
- `LandscapeGate` stays as-is — shell just responds to whatever viewport it gets.

## এই turn-এ কী deliver হবে

1. `TheoryLabShell.tsx` — reusable component
2. Typography tokens in `styles.css`
3. `KineticTheoryLab.tsx` refactored to use the shell (reference)

তারপর তুমি দেখে বলবে ভালো লাগছে কিনা — ভালো হলে বাকি ১৫টা ল্যাব একই প্যাটার্নে দ্রুত migrate করব।
