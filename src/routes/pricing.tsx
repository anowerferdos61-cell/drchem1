/**
 * Pricing page — public marketing surface for all subscription tiers.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, FlaskConical, Sparkles, Crown, GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-store";
import UserMenu from "@/components/auth/UserMenu";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "প্রাইসিং · Dr. Chem — মাত্র ৳৯৯/মাস" },
      {
        name: "description",
        content:
          "Dr. Chem Pro: ৳99/month or ৳999/year. 12 interactive chemistry labs, unlimited AI tutor, full notes. 7-day free trial for new students.",
      },
      { property: "og:title", content: "Dr. Chem Pricing — Affordable Virtual Chemistry Lab" },
      {
        property: "og:description",
        content:
          "Start with a 7-day free trial. Pay with bKash from ৳99/month for full access to all labs, AI tutor and notes.",
      },
      { property: "og:url", content: "https://drchemedu.com/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://drchemedu.com/pricing" }],
  }),
});

type Cycle = "monthly" | "yearly";

interface PlanCard {
  code: "free" | "student_monthly" | "student_yearly" | "teacher_monthly" | "teacher_yearly";
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlight?: boolean;
  cta: string;
  icon: typeof FlaskConical;
}

const STUDENT: PlanCard = {
  code: "student_monthly",
  name: "Student Pro",
  tagline: "একক শিক্ষার্থীর জন্য",
  monthlyPrice: 99,
  yearlyPrice: 999,
  features: [
    "সব ১২টি interactive lab unlock",
    "Unlimited AI Tutor (RAG সহ)",
    "NCTB বই থেকে সরাসরি উত্তর",
    "Smart Notes লেখা ও শেয়ার",
    "Viva practice + grading",
    "Bangla + English support",
  ],
  highlight: true,
  cta: "৭ দিন ফ্রি ট্রায়াল শুরু",
  icon: GraduationCap,
};

const TEACHER: PlanCard = {
  code: "teacher_monthly",
  name: "Teacher Pro",
  tagline: "শিক্ষক ও স্কুলের জন্য",
  monthlyPrice: 499,
  yearlyPrice: 4990,
  features: [
    "Student plan এর সব কিছু",
    "৪০ জন student এর roster",
    "Teacher dashboard + progress",
    "Class assignment তৈরি",
    "Bulk viva grading",
    "Priority support",
  ],
  cta: "Teacher হিসেবে শুরু",
  icon: Crown,
};

const FREE: PlanCard = {
  code: "free",
  name: "Free",
  tagline: "শুরু করার জন্য",
  monthlyPrice: 0,
  yearlyPrice: 0,
  features: [
    "২টি intro lab (pH Scale + Indicators)",
    "AI Tutor — দিনে ৫টি প্রশ্ন",
    "Notes পড়া যাবে",
    "Curriculum Hub browse",
  ],
  cta: "Free এ শুরু",
  icon: FlaskConical,
};

function PricingPage() {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const goToCheckout = (planCode: string) => {
    if (!isAuthenticated) {
      void navigate({ to: "/signup" });
      return;
    }
    if (planCode === "free") {
      void navigate({ to: "/app" });
      return;
    }
    const code = cycle === "yearly" ? planCode.replace("_monthly", "_yearly") : planCode;
    void navigate({ to: "/billing", search: { plan: code } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Dr. Chem</span>
          </Link>
          <UserMenu />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" /> ৭ দিন ফ্রি ট্রায়াল · কোন কার্ড লাগবে না
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            সবার জন্য সাশ্রয়ী Pro Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            শুরু করুন মাত্র <strong className="text-foreground">৳৯৯/মাস</strong> এ। bKash দিয়ে
            payment। যেকোনো সময় cancel করতে পারবেন।
          </p>

          {/* Cycle toggle */}
          <div className="inline-flex bg-muted p-1 rounded-full mt-8">
            <button
              onClick={() => setCycle("monthly")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-colors",
                cycle === "monthly" ? "bg-background shadow text-foreground" : "text-muted-foreground",
              )}
            >
              মাসিক
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                cycle === "yearly" ? "bg-background shadow text-foreground" : "text-muted-foreground",
              )}
            >
              বার্ষিক
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                Save 16%
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[FREE, STUDENT, TEACHER].map((plan) => {
            const Icon = plan.icon;
            const price = cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            const perMonth = cycle === "yearly" ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
            return (
              <div
                key={plan.code}
                className={cn(
                  "relative rounded-2xl border-2 bg-card p-6 flex flex-col transition-all",
                  plan.highlight
                    ? "border-primary shadow-xl scale-[1.02] md:scale-105"
                    : "border-border hover:border-primary/40",
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    🔥 সবচেয়ে জনপ্রিয়
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      plan.highlight
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                  </div>
                </div>

                <div className="mb-5">
                  {price === 0 ? (
                    <div className="text-4xl font-bold">ফ্রি</div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">৳{price}</span>
                        <span className="text-muted-foreground text-sm">
                          /{cycle === "yearly" ? "বছর" : "মাস"}
                        </span>
                      </div>
                      {cycle === "yearly" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          মাসে মাত্র ৳{perMonth}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => goToCheckout(plan.code)}
                  variant={plan.highlight ? "default" : "outline"}
                  className="w-full"
                  size="lg"
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Payment method note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            💳 Payment via <strong className="text-foreground">bKash</strong> · আপনার bKash নম্বর
            submit করলে ২৪ ঘন্টার মধ্যে activate হবে
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">জিজ্ঞাসা</h2>
          <div className="space-y-4">
            {[
              {
                q: "Trial এ কি কার্ড বা bKash লাগবে?",
                a: "না। শুধু phone number verify করলেই ৭ দিনের জন্য পুরো Pro access পাবেন।",
              },
              {
                q: "Trial শেষ হলে কী হবে?",
                a: "Trial expire হলে আপনি Free tier এ চলে যাবেন (২টি lab + দিনে ৫টি AI message)। যেকোনো সময় upgrade করতে পারবেন।",
              },
              {
                q: "Refund পাওয়া যাবে?",
                a: "Subscription cancel করলে current billing period শেষ পর্যন্ত access থাকবে। Refund এর জন্য admin এর সাথে যোগাযোগ করুন।",
              },
              {
                q: "Teacher plan এ ছাত্র কীভাবে যোগ করব?",
                a: "Teacher dashboard থেকে invite link generate করতে পারবেন (Phase 2)।",
              },
            ].map((f) => (
              <div key={f.q} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-2">{f.q}</h3>
                <p className="text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
