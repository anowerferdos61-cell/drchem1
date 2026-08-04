# UserMenu hydration mismatch ফিক্স

## সমস্যা
প্রিভিউতে React hydration error আসছে। সার্ভার `UserMenu`-এর লোডিং স্কেলেটন (`<div class="h-9 w-24 ...animate-pulse">`) রেন্ডার করছে, কিন্তু ব্রাউজারে প্রথম রেন্ডারেই সেশন ইতিমধ্যে রিস্টোর হয়ে যাওয়ায় অ্যাভাটার `<button>` রেন্ডার হচ্ছে — দুই HTML না মেলায় React পুরো ট্রি ক্লায়েন্টে রি-রেন্ডার করে ফেলে (হেডার এক ঝলক ফ্লিকার করে)।

`UserMenu` এখন Dashboard, Library (Videos/Notes) ও Tutor — তিন জায়গার হেডারে বসানো, তাই এররটা প্রায় প্রতি পেজেই দেখা যায়।

## সমাধান
`src/components/auth/UserMenu.tsx`-এ hydration-safe গেট বসানো:

- একটা ছোট `useHydrated()` হুক (`useState(false)` + `useEffect(() => setHydrated(true), [])`) ব্যবহার করা।
- হাইড্রেশন শেষ হওয়ার আগ পর্যন্ত সবসময় স্কেলেটনই দেখানো হবে — অর্থাৎ সার্ভার আর ক্লায়েন্টের প্রথম রেন্ডার হুবহু এক থাকবে।
- হাইড্রেশনের পরেই `loading` / `isAuthenticated` অনুযায়ী আসল UI সুইচ করবে।
- স্কেলেটনের সাইজ লগইন-বাটন জোড়ার প্রস্থের কাছাকাছি রাখা হবে যাতে লেআউট শিফট না হয়।

## টেকনিক্যাল নোট
- শুধু একটি ফাইল বদলাবে: `src/components/auth/UserMenu.tsx`। auth-store, রাউট বা ব্যাকএন্ডে কোনো পরিবর্তন নেই।
- ভেরিফিকেশন: Playwright দিয়ে `/app` লোড করে কনসোলে hydration warning আছে কি না চেক করা।
