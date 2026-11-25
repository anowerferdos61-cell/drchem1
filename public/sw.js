// Minimal Service Worker for Dr. Chem PWA / TWA installability.
// Keeps network-first behavior so SSR, Supabase auth, and AI streaming always stay fresh.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pass-through to network; required by browsers/TWA for PWA installability.
});
