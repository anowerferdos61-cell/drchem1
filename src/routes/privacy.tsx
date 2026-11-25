import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { DrChemLogo } from "@/components/brand/DrChemLogo";
import { useIsStandaloneApp } from "@/lib/app-mode";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy · Dr. Chem" },
      {
        name: "description",
        content:
          "Privacy Policy for Dr. Chem — how we collect, store, protect, and delete your data.",
      },
      { property: "og:title", content: "Privacy Policy · Dr. Chem" },
      { property: "og:url", content: "https://drchemedu.com/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://drchemedu.com/privacy" }],
  }),
});

function PrivacyPolicyPage() {
  const isStandalone = useIsStandaloneApp();

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            to={isStandalone ? "/app" : "/"}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            ফিরে যান
          </Link>
          <DrChemLogo size="sm" showText />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Privacy Policy — Dr. Chem</h1>
              <p className="text-xs text-muted-foreground">
                সর্বশেষ আপডেট: ২৫ নভেম্বর, ২০২৬ · drchemedu.com
              </p>
            </div>
          </div>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">১. আমরা কী তথ্য সংগ্রহ করি</h2>
            <p>
              Dr. Chem ব্যবহার করার সময় আমরা শুধুমাত্র শিক্ষামূলক সেবা প্রদানের জন্য প্রয়োজনীয় তথ্য
              সংগ্রহ করি:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">অ্যাকাউন্ট তথ্য:</strong> নাম, ইমেইল ঠিকানা, ফোন
                নম্বর, শ্রেণি বা শিক্ষা প্রতিষ্ঠানের নাম, এবং ইউজার রোল (শিক্ষার্থী/শিক্ষক)।
              </li>
              <li>
                <strong className="text-foreground">লার্নিং ডেটা:</strong> ল্যাব প্র্যাকটিক্যাল
                প্রগ্রেস, নোটস, টেস্টের ফলাফল এবং AI টিউটরের সাথে কথোপকথন।
              </li>
              <li>
                <strong className="text-foreground">টেকনিক্যাল তথ্য:</strong> অ্যাপের নিরাপত্তা ও
                পারফরম্যান্স নিশ্চিত করার জন্য প্রয়োজনীয় লগ ও সেশন কুকি।
              </li>
            </ul>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">২. তথ্যের ব্যবহার ও সুরক্ষা</h2>
            <p>
              আপনার সকল তথ্য HTTPS এনক্রিপশনের মাধ্যমে আদান-প্রদান করা হয় এবং{" "}
              <strong className="text-foreground">Supabase</strong>-এর নিরাপদ ডাটাবেজে সংরক্ষিত
              থাকে। আমরা আপনার ব্যক্তিগত তথ্য কখনোই কোনো তৃতীয় পক্ষের কাছে বিক্রি বা বিজ্ঞাপনের কাজে
              ব্যবহার করি না।
            </p>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">
              ৩. AI টিউটর ও শিক্ষামূলক ব্যবহার
            </h2>
            <p>
              AI টিউটরে করা প্রশ্নগুলো শুধুমাত্র তাৎক্ষণিক উত্তর ও রসায়ন শেখার সহায়তার জন্য
              প্রক্রিয়াজাত করা হয়। আমাদের প্ল্যাটফর্মটি মূলত Class 9-10 (SSC) শিক্ষার্থীদের নিরাপদ
              ভার্চুয়াল ল্যাব অভিজ্ঞতার জন্য তৈরি।
            </p>
          </section>

          <section
            id="delete-account"
            className="space-y-2 text-sm leading-relaxed text-muted-foreground"
          >
            <h2 className="text-base font-semibold text-foreground">
              ৪. অ্যাকাউন্ট ও ডেটা ডিলিট করা
            </h2>
            <p>
              আপনি যেকোনো সময় আপনার অ্যাকাউন্ট এবং সংরক্ষিত ব্যক্তিগত তথ্য স্থায়ীভাবে মুছে ফেলতে
              পারেন। লগইন করা অবস্থায় সরাসরি{" "}
              <Link to="/delete-account" className="text-primary font-medium hover:underline">
                Delete Account পেজ
              </Link>{" "}
              থেকে অথবা নিচের ইমেইলে অনুরোধ পাঠিয়ে অ্যাকাউন্ট ডিলিট করতে পারবেন।
            </p>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">৫. যোগাযোগ</h2>
            <p>
              প্রাইভেসি বা ডেটা সংক্রান্ত যেকোনো প্রশ্নে যোগাযোগ করুন:{" "}
              <a
                href="mailto:drchem.edu@gmail.com"
                className="text-primary font-medium hover:underline"
              >
                drchem.edu@gmail.com
              </a>{" "}
              অথবা ফোন: <span className="text-foreground font-medium">+8801581553923</span>।
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
