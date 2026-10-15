import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FlaskConical,
  Sparkles,
  PlayCircle,
  ArrowRight,
  BookOpen,
  Brain,
  GraduationCap,
  ShieldCheck,
  Beaker,
  Atom,
  Droplet,
  Wind,
  Users,
  ClipboardList,
  BarChart3,
  Eye,
  Zap,
  Quote,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Check,
  Flame,
  RotateCcw,
  Star,
  Layers,
  Compass,
  TestTube,
  Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DrChemLogo } from "@/components/brand/DrChemLogo";
import { useAuth } from "@/lib/auth-store";
import { useState } from "react";
import { DemoVideoSection } from "@/components/landing/DemoVideoSection";
import { VideoModal } from "@/components/landing/VideoModal";
import { FaqSection, GuideFaqButton, faqs } from "@/components/landing/FaqSection";
import { LandingNav } from "@/components/landing/LandingNav";
import welcomeHero from "@/assets/welcome-hero.png";
import heroImg from "@/assets/landing-hero.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Dr. Chem — AI-Powered Virtual Chemistry Lab for Class 9-10 (NCTB)" },
      {
        name: "description",
        content:
          "Perform chemistry experiments safely, learn visually, and get instant help from the Dr. Chem AI tutor. Built for Bangladeshi Class 9-10 students and teachers.",
      },
      {
        name: "keywords",
        content:
          "Dr Chem, ভার্চুয়াল কেমিস্ট্রি ল্যাব, SSC রসায়ন প্র্যাকটিক্যাল, ৯ম ১০ম শ্রেণি রসায়ন, NCTB রসায়ন ল্যাব, ডক্টর কেম, Class 9-10 Chemistry Virtual Lab, AI Tutor Bangladesh",
      },
      { property: "og:site_name", content: "Dr. Chem" },
      { property: "og:locale", content: "bn_BD" },
      { property: "og:title", content: "Dr. Chem — AI Virtual Chemistry Lab" },
      {
        property: "og:description",
        content:
          "Safe, visual, AI-guided chemistry experiments for Class 9-10 — pH scale, titration, oxygen prep, bonding, and more for NCTB syllabus.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://drchemedu.com/" },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/BNbspVP1QLgQXV1xmKzQ4H5W7yJ2/social-images/social-1780481523006-Gemini_Generated_Image_2no3022no3022no3.webp",
      },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Dr. Chem — AI-Powered Virtual Chemistry Lab for Class 9-10",
      },
      {
        name: "twitter:description",
        content:
          "Perform chemistry experiments safely, learn visually, and get instant help from the Dr. Chem AI tutor.",
      },
    ],
    links: [{ rel: "canonical", href: "https://drchemedu.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a,
            },
          })),
        }),
      },
    ],
  }),
});

function Landing() {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-400">
      <LandingNav />
      <Hero onWatchDemo={() => setDemoOpen(true)} />
      <MetricsStrip />
      <BentoSuperpowers />
      <ExperimentsShowcase />
      <ClassroomComparison />
      <RoleTabs />
      <DemoVideoSection />
      <Testimonials />
      <FaqSection />
      <FinalCTA />
      <Footer />
      <VideoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
}

/* ───────────── 1. HERO SECTION ───────────── */
function Hero({ onWatchDemo }: { onWatchDemo: () => void }) {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative overflow-hidden pt-6 pb-16 md:pt-12 md:pb-24">
      {/* Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-cyan-500/15 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-2/3 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Live Update Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm backdrop-blur-md mb-6 hover:bg-emerald-500/15 transition-all">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>২০২৬ NCTB এসএসসি কারিকুলাম ও AI টিউটর লাইভ</span>
            </div>

            {/* Main Punchy Bengali Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-foreground">
              ল্যাবের ভয় আর নয় —{" "}
              <span className="block mt-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                ঘরে বসেই আসল কেমিস্ট্রি প্র্যাকটিক্যাল
              </span>
            </h1>

            {/* Bilingual Subtitle */}
            <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              টেস্টটিউব ভাঙার ভয় নেই, নেই অ্যাসিড ছিটকে পড়ার ঝুঁকি। ড্র্যাগ-অ্যান্ড-ড্রপ সিমুলেশন,
              তাৎক্ষণিক বাংলা AI গাইডেন্স এবং বোর্ড ভাইভা প্রস্তুতি — সবই এখন আপনার ব্রাউজারে।
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <Button
                asChild
                size="lg"
                className="h-12 px-6 text-base font-semibold shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Link to="/app">
                  {isAuthenticated ? (
                    <>
                      <ArrowRight className="h-5 w-5 mr-1" /> ড্যাশবোর্ডে যান
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-1" /> সরাসরি ল্যাব শুরু করুন
                    </>
                  )}
                </Link>
              </Button>

              <Button
                type="button"
                size="lg"
                variant="outline"
                className="h-12 px-5 text-base font-medium border-border/80 bg-background/60 hover:bg-muted/80 backdrop-blur-sm transition-all"
                onClick={onWatchDemo}
              >
                <PlayCircle className="h-5 w-5 mr-2 text-emerald-500" /> ভিডিও ডেমো দেখুন
              </Button>

              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 px-4 text-base font-medium text-muted-foreground hover:text-foreground"
              >
                <Link to="/chapters">
                  <BookOpen className="h-4 w-4 mr-1.5" /> অধ্যায় গাইড
                </Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 pt-6 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FlaskConical className="h-4 w-4" />
                </div>
                <span>৫০+ ভার্চুয়াল ল্যাব</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span>১২টি NCTB অধ্যায়</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span>১০০% ঝুঁকিমুক্ত</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Brain className="h-4 w-4" />
                </div>
                <span>বাংলা AI টিউটর</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Simulator Card */}
          <div className="lg:col-span-5 relative mt-4 lg:mt-0">
            <InteractiveLabSimulatorPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Interactive Mini-Simulator Preview ───────────── */
function InteractiveLabSimulatorPreview() {
  const [titrationStep, setTitrationStep] = useState(1);
  const [indicatorAdded, setIndicatorAdded] = useState(true);

  // Titration states:
  // Step 0: pure HCl 20ml (colorless, pH 1.8)
  // Step 1: added 15ml NaOH (colorless, pH 2.6)
  // Step 2: added 20ml NaOH (endpoint reached, faint permanent pink, pH 7.0)
  // Step 3: added 25ml NaOH (excess base, deep magenta, pH 11.8)

  const states = [
    {
      label: "প্রাথমিক অ্যাসিড দ্রবণ (HCl)",
      ph: "1.8",
      volume: "0.0 mL",
      status: "তীব্র অ্যাসিডিক",
      colorClass: indicatorAdded
        ? "bg-emerald-100/40 border-emerald-300/40 text-foreground"
        : "bg-slate-100/40",
      liquidColor: indicatorAdded ? "rgba(224, 242, 254, 0.45)" : "rgba(241, 245, 249, 0.4)",
      bubbleCount: 1,
      tip: "বুরেট থেকে ধীরে ধীরে NaOH দ্রবণ ড্রপ ড্রপ ফেলুন।",
    },
    {
      label: "অ্যাসিডে ক্ষার যোগ হচ্ছে",
      ph: "2.6",
      volume: "15.0 mL",
      status: "অ্যাসিডিক (বিক্রিয়া চলমান)",
      liquidColor: indicatorAdded ? "rgba(254, 215, 226, 0.35)" : "rgba(241, 245, 249, 0.5)",
      bubbleCount: 3,
      tip: "ফ্লাস্কটি হালকাভাবে ঝাঁকান। ক্ষার যুক্ত হয়ে প্রশমন ঘটাচ্ছে।",
    },
    {
      label: "প্রশমন বিন্দু (End-Point) অর্জিত!",
      ph: "7.0",
      volume: "20.0 mL",
      status: "সম্পূর্ণ প্রশমিত (নিরপেক্ষ)",
      liquidColor: indicatorAdded ? "rgba(244, 114, 182, 0.75)" : "rgba(241, 245, 249, 0.6)",
      bubbleCount: 5,
      tip: "অভিনন্দন! হালকা স্থায়ী গোলাপী রঙ এসেছে। টাইট্রেশন সম্পন্ন হয়েছে!",
    },
    {
      label: "অতিরিক্ত ক্ষার (Excess Base)",
      ph: "11.8",
      volume: "25.0 mL",
      status: "ক্ষারীয় মাধ্যম",
      liquidColor: indicatorAdded ? "rgba(219, 39, 119, 0.9)" : "rgba(241, 245, 249, 0.6)",
      bubbleCount: 2,
      tip: "বেশি ক্ষার যোগ করায় রঙ গাঢ় মেজেন্টা হয়েছে। রিসেট করে আবার চেষ্টা করো।",
    },
  ];

  const current = states[titrationStep];

  const nextStep = () => {
    setTitrationStep((prev) => (prev + 1) % states.length);
  };

  const resetSim = () => {
    setTitrationStep(0);
    setIndicatorAdded(true);
  };

  return (
    <div className="relative group">
      {/* Ambient Glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-blue-500/25 blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

      {/* Main Card */}
      <div className="relative rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl p-5 sm:p-6 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="ml-2 text-xs font-mono font-medium text-muted-foreground truncate">
              DrChem-Lab-Titration.sim
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              লাইভ সিমুলেটর
            </span>
          </div>
        </div>

        {/* Experiment Title & Formula */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
              <FlaskConical className="h-4 w-4 text-emerald-500" />
              অ্যাসিড-ক্ষার প্রশমন টাইট্রেশন
            </h3>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block">অধ্যায় ৭</span>
            <span className="text-xs font-semibold text-primary">NCTB প্র্যাকটিক্যাল</span>
          </div>
        </div>

        {/* Simulator Stage */}
        <div className="relative rounded-xl border border-border/70 bg-gradient-to-b from-muted/50 to-muted/20 p-4 flex flex-col items-center justify-center min-h-[220px]">
          {/* LCD Status Readout */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs font-mono bg-background/90 border border-border/60 rounded-lg px-3 py-1.5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                pH:{" "}
                <strong
                  className={
                    titrationStep === 2
                      ? "text-emerald-600 dark:text-emerald-400 font-bold"
                      : "text-foreground font-bold"
                  }
                >
                  {current.ph}
                </strong>
              </span>
              <span className="text-muted-foreground">
                NaOH যোগ: <strong className="text-foreground">{current.volume}</strong>
              </span>
            </div>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                titrationStep === 2
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {current.status}
            </span>
          </div>

          {/* Visual Apparatus (Conical Flask + Burette Drip) */}
          <div className="mt-8 flex flex-col items-center justify-center relative w-full h-36">
            {/* Burette Tip with animated drip */}
            <div className="w-2.5 h-12 bg-slate-400/50 rounded-b border border-slate-400/80 relative -mt-4">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-cyan-400/70" />
            </div>

            {/* Falling Drop */}
            <div className="h-2 w-2 rounded-full bg-cyan-400/80 animate-bounce my-1 shadow-sm" />

            {/* Conical Flask */}
            <div className="relative w-28 h-24 flex items-end justify-center">
              {/* Flask Glass Outline (SVG) */}
              <svg
                viewBox="0 0 100 90"
                className="w-full h-full drop-shadow-md overflow-visible"
                fill="none"
              >
                {/* Liquid Level */}
                <path
                  d="M 22 78 L 78 78 L 68 50 L 32 50 Z"
                  fill={current.liquidColor}
                  className="transition-all duration-500 ease-out"
                />
                {/* Surface Meniscus */}
                <ellipse
                  cx="50"
                  cy="50"
                  rx="18"
                  ry="2.5"
                  fill={current.liquidColor}
                  opacity="0.9"
                  className="transition-all duration-500 ease-out"
                />
                {/* Flask Glass Outline */}
                <path
                  d="M 43 10 L 43 25 L 15 80 C 12 85 16 88 22 88 L 78 88 C 84 88 88 85 85 80 L 57 25 L 57 10"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground/40"
                />
                {/* Neck Rim */}
                <line
                  x1="40"
                  y1="10"
                  x2="60"
                  y2="10"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="text-foreground/40"
                />
                {/* Measurement Ticks */}
                <line x1="28" y1="70" x2="35" y2="70" stroke="currentColor" strokeWidth="1.5" className="text-foreground/30" />
                <line x1="33" y1="60" x2="40" y2="60" stroke="currentColor" strokeWidth="1.5" className="text-foreground/30" />
              </svg>
            </div>
          </div>

          {/* Dynamic AI Tip Note */}
          <div className="mt-3 w-full bg-card border border-border/80 rounded-xl p-2.5 flex items-start gap-2 text-xs shadow-sm">
            <span className="text-lg leading-none">💡</span>
            <div className="flex-1">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                ডক্টর কেম পর্যবেক্ষণ:
              </span>
              <p className="text-muted-foreground leading-snug">{current.tip}</p>
            </div>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={nextStep}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs h-9 shadow-sm"
          >
            <Droplet className="h-3.5 w-3.5 mr-1 text-cyan-300" />
            {titrationStep === 2
              ? "পরবর্তী ধাপ (অতিরিক্ত ক্ষার)"
              : titrationStep === 3
                ? "পুনরায় শুরু করুন"
                : "NaOH ড্রপ যোগ করুন (+৫ mL)"}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={resetSim}
            className="h-9 px-3 text-xs"
            title="ল্যাব রিসেট"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          <Button asChild size="sm" variant="secondary" className="h-9 text-xs font-semibold">
            <Link to="/app">
              পূর্ণাঙ্গ ল্যাব খুলুন <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── 2. METRICS STRIP ───────────── */
function MetricsStrip() {
  const stats = [
    {
      number: "৫০+",
      label: "ইন্টারেক্টিভ ভার্চুয়াল ল্যাব",
      desc: "NCTB কারিকুলামের সকল বিক্রিয়া ও টেস্ট",
      icon: FlaskConical,
      color: "text-emerald-500",
    },
    {
      number: "১২টি",
      label: "সম্পূর্ণ রসায়ন অধ্যায়",
      desc: "৯ম ও ১০ম শ্রেণির সিলেবাস কভারেজ",
      icon: BookOpen,
      color: "text-cyan-500",
    },
    {
      number: "১০০%",
      label: "ঝুঁকিমুক্ত ও নিরাপদ প্র্যাকটিস",
      desc: "শূন্য ক্ষয়ক্ষতি, সীমাহীন পুনঃপরীক্ষা",
      icon: ShieldCheck,
      color: "text-teal-500",
    },
    {
      number: "২৪/৭",
      label: "বাংলা AI টিউটর ও ভাইভা",
      desc: "যেকোনো প্রশ্নে তাৎক্ষণিক ব্যাখ্যা ও গ্রেডিং",
      icon: Brain,
      color: "text-indigo-500",
    },
  ];

  return (
    <section className="py-10 border-y border-border/50 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center sm:items-start text-center sm:text-left p-4 rounded-xl transition-all hover:bg-card/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  {s.number}
                </span>
              </div>
              <h4 className="font-semibold text-sm sm:text-base text-foreground">{s.label}</h4>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── 3. BENTO SUPERPOWERS GRID ───────────── */
function BentoSuperpowers() {
  return (
    <section id="solution" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
            <Sparkles className="h-3.5 w-3.5" /> অল-ইন-ওয়ান লার্নিং প্ল্যাটফর্ম
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            একটি প্ল্যাটফর্ম।{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              চারটি সুপারপাওয়ার।
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            ক্লাস ৯-১০ এর একজন শিক্ষার্থী ও শিক্ষকের রসায়নে এ-প্লাস পাওয়ার জন্য যা কিছু প্রয়োজন —
            একত্রিত করা হয়েছে ডক্টর কেম-এ।
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Card 1: 3D/2D Virtual Lab Room (Wide: 2 Cols) */}
          <div className="md:col-span-2 relative rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-emerald-500/5 p-7 sm:p-9 overflow-hidden shadow-lg hover:shadow-emerald-500/10 transition-all group">
            <div className="relative z-10 max-w-lg">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center mb-5 shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <FlaskConical className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                সিমুলেশন ও ল্যাবরেটরি
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold mt-1 mb-3">
                ইন্টারেক্টিভ ভার্চুয়াল ল্যাবরেটরি
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                বুরেট, পিপেট, টেস্টটিউব, বুনসেন বার্নার নিয়ে নিজে নিজে পরীক্ষা সম্পন্ন করুন।
                রিয়াল-টাইম কালার চেঞ্জ, বুদবুদ নির্গমন এবং তাপমাত্রার নিখুঁত অ্যানিমেশন দেখে শিখুন।
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="bg-muted px-3 py-1 rounded-full border border-border/60">
                  🧪 ড্র্যাগ-অ্যান্ড-ড্রপ কেমিক্যাল
                </span>
                <span className="bg-muted px-3 py-1 rounded-full border border-border/60">
                  🔥 বুনসেন বার্নার ও হিটিং
                </span>
                <span className="bg-muted px-3 py-1 rounded-full border border-border/60">
                  📊 রিয়াল-টাইম LCD মিটার
                </span>
              </div>
            </div>

            {/* Background Graphic Illustration */}
            <div className="hidden sm:block absolute right-[-20px] bottom-[-20px] w-64 h-64 opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all pointer-events-none">
              <FlaskConical className="w-full h-full text-emerald-500" />
            </div>
          </div>

          {/* Bento Card 2: 24/7 Bengali AI Tutor */}
          <div className="relative rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-indigo-500/5 p-7 sm:p-9 overflow-hidden shadow-lg hover:shadow-indigo-500/10 transition-all group">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center mb-5 shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <Brain className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              এআই শিক্ষক
            </span>
            <h3 className="text-xl sm:text-2xl font-bold mt-1 mb-3">
              ২৪/৭ বাংলা AI কেমিস্ট্রি টিউটর
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5">
              যে কোনো বিক্রিয়ার মেকানিজম বা জটিল সূত্র প্রশ্ন করুন বাংলায়। কোনো লজ্জা বা সংকোচ ছাড়াই
              যতবার ইচ্ছা সমাধান বুঝে নিন।
            </p>

            {/* AI Chat Snippet Mockup */}
            <div className="rounded-xl border border-border/70 bg-background/80 p-3 text-xs space-y-2">
              <div className="bg-muted/70 p-2 rounded-lg text-foreground">
                <strong className="text-primary block text-[10px]">শিক্ষার্থী:</strong>
                এসিডে কি সরাসরি পানি ঢালা যাবে?
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-foreground">
                <strong className="text-emerald-600 dark:text-emerald-400 block text-[10px]">
                  Dr. Chem AI:
                </strong>
                না! এটি তীব্র তাপোৎপাদী বিক্রিয়া। ছিটকে মুখে পড়তে পারে। সবসময় পানিতে এসিড ধীরে ধীরে
                ঢালতে হবে।
              </div>
            </div>
          </div>

          {/* Bento Card 3: Board Practical & Viva Simulator */}
          <div className="relative rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-amber-500/5 p-7 sm:p-9 overflow-hidden shadow-lg hover:shadow-amber-500/10 transition-all group">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center mb-5 shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              বোর্ড পরীক্ষা
            </span>
            <h3 className="text-xl sm:text-2xl font-bold mt-1 mb-3">
              এসএসসি প্র্যাকটিক্যাল ও ভাইভা প্রস্তুতি
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              বোর্ড পরীক্ষার কমন ভাইভা প্রশ্ন নিয়ে সরাসরি মক টেস্ট দিন। এআই আপনার উত্তর বিশ্লেষণ করে
              ইনস্ট্যান্ট স্কোর ও সঠিক উত্তরের ব্যাখ্যা প্রদান করবে।
            </p>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium text-xs px-3 py-1.5 rounded-lg border border-amber-500/20">
              <Star className="h-3.5 w-3.5 fill-current" /> ২৫ নম্বরের প্র্যাকটিক্যাল নিশ্চয়তা
            </div>
          </div>

          {/* Bento Card 4: 21-Day Gamified Streak & Tracker (Wide: 2 Cols) */}
          <div className="md:col-span-2 relative rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-teal-500/5 p-7 sm:p-9 overflow-hidden shadow-lg hover:shadow-teal-500/10 transition-all group">
            <div className="relative z-10 max-w-lg">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 text-white flex items-center justify-center mb-5 shadow-md shadow-teal-500/20 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                অগ্রগতি ও ধারাবাহিকতা
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold mt-1 mb-3">
                ২১ দিনের স্ট্রাইক ও পার্সোনালাইজড ট্র্যাকার
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                রসায়নে দুর্বলতা আর থাকবে না! নিয়মিত ল্যাব প্র্যাকটিসের মাধ্যমে নিজের স্ট্রাইক ধরে
                রাখুন, প্রতিটি অধ্যায়ের প্রগ্রেস ট্র্যাক করুন এবং দুর্বল বিষয়ের রিভিশন সাজেস্ট পান।
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  <Flame className="h-4 w-4 fill-current text-orange-500" />
                  <span>২১ দিনের লার্নিং স্ট্রাইক</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg border border-border/60">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>অধ্যায়ভিত্তিক কমপ্লিশন ব্যাজ</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg border border-border/60">
                  <Sparkle className="h-4 w-4 text-cyan-500" />
                  <span>বোর্ড স্ট্যান্ডার্ড মডেল টেস্ট</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 4. 50+ EXPERIMENTS SHOWCASE (CATEGORIZED TABS) ───────────── */
function ExperimentsShowcase() {
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", label: "সকল জনপ্রিয়" },
    { id: "gas", label: "গ্যাস প্রস্তুতি" },
    { id: "acid", label: "অ্যাসিড-ক্ষার ও pH" },
    { id: "electro", label: "তড়িৎ রসায়ন" },
    { id: "bonding", label: "পদার্থ ও বন্ধন" },
    { id: "organic", label: "জৈব রসায়ন" },
  ];

  const experiments = [
    {
      id: "oxygen-prep",
      category: "gas",
      chapter: "অধ্যায় ৭: রাসায়নিক বিক্রিয়া",
      title: "অক্সিজেন গ্যাস প্রস্তুতি ল্যাব",
      formula: "2H₂O₂ → 2H₂O + O₂ ↑",
      desc: "ম্যাঙ্গানিজ ডাই অক্সাইড অনুঘটকের উপস্থিতিতে অক্সিজেন গ্যাস সংগ্রহ ও শিখা পরীক্ষা।",
      icon: Wind,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "titration",
      category: "acid",
      chapter: "অধ্যায় ৮: অ্যাসিড-ক্ষার সমতা",
      title: "অ্যাসিড-ক্ষার প্রশমন টাইট্রেশন",
      formula: "HCl + NaOH → NaCl + H₂O",
      desc: "ফেনলফথ্যালিন নির্দেশক ব্যবহার করে হাইড্রোক্লোরিক এসিডের ঘনমাত্রা নির্ণয়।",
      icon: Droplet,
      color: "from-pink-500 to-rose-500",
    },
    {
      id: "galvanic-cell",
      category: "electro",
      chapter: "অধ্যায় ৮: রসায়ন ও শক্তি",
      title: "ড্যানিয়েল সেল ও গ্যালভানিক কোষ",
      formula: "Zn + Cu²⁺ → Zn²⁺ + Cu (1.10V)",
      desc: "জিঙ্ক ও কপার তড়িৎদ্বার দিয়ে বিদ্যুৎ উৎপাদন ও লবণ সেতুর ভূমিকা পর্যবেক্ষণ।",
      icon: Zap,
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "co2-prep",
      category: "gas",
      chapter: "অধ্যায় ৭: রাসায়নিক বিক্রিয়া",
      title: "কার্বন ডাইঅক্সাইড গ্যাস প্রস্তুতি",
      formula: "CaCO₃ + 2HCl → CaCl₂ + CO₂ ↑",
      desc: "চুনাপাথর ও লঘু এসিড দিয়ে কার্বন ডাই অক্সাইড তৈরি ও চুনের পানিতে ঘোলাটে পরীক্ষা।",
      icon: Wind,
      color: "from-cyan-500 to-teal-500",
    },
    {
      id: "ph-scale",
      category: "acid",
      chapter: "অধ্যায় ১০: খনিজ সম্পদ ও ধাতু",
      title: "pH স্কেল ও ইউনিভার্সাল ইন্ডিকেটর",
      formula: "pH = -log[H⁺] (0 → 14)",
      desc: "লেবুর রস, সাবান পানি, ভিনেগার ও লবণের দ্রবণের অম্লত্ব-ক্ষারত্ব কালার ম্যাচিং।",
      icon: BarChart3,
      color: "from-emerald-500 to-teal-600",
    },
    {
      id: "bonding-model",
      category: "bonding",
      chapter: "অধ্যায় ৫: রাসায়নিক বন্ধন",
      title: "আয়নিক বনাম সমযোজী বন্ধন",
      formula: "NaCl vs C₁₂H₂₂O₁₁ বিদ্যুৎ পরিবাহিতা",
      desc: "কঠিন ও গলিত অবস্থায় বিভিন্ন যৌগের মধ্য দিয়ে তড়িৎ পরিবাহিতা পরীক্ষা।",
      icon: Atom,
      color: "from-indigo-500 to-purple-500",
    },
    {
      id: "hydrocarbon-unsaturation",
      category: "organic",
      chapter: "অধ্যায় ১১: খনিজ সম্পদ ও জীবাশ্ম",
      title: "হাইড্রোকার্বনের অসম্পৃক্ততা পরীক্ষা",
      formula: "C₂H₄ + Br₂ দ্রবণ পরীক্ষা",
      desc: "ব্রোমিন দ্রবণ ও বেয়ার পরীক্ষা দ্বারা অ্যালকিন ও অ্যালকাইন শনাক্তকরণ।",
      icon: TestTube,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "rusting-mechanism",
      category: "electro",
      chapter: "অধ্যায় ৮: রসায়ন ও শক্তি",
      title: "লোহার মরিচা মেকানিজম",
      formula: "4Fe + 3O₂ + xH₂O → 2Fe₂O₃·xH₂O",
      desc: "পানি ও বাতাসের উপস্থিতিতে লোহার জারণ প্রক্রিয়া ও গ্যালভানাইজিং প্রভাব।",
      icon: ShieldCheck,
      color: "from-orange-500 to-red-500",
    },
    {
      id: "electron-config",
      category: "bonding",
      chapter: "অধ্যায় ৩: পদার্থের গঠন",
      title: "ইলেকট্রন বিন্যাস ও আউফবাউ নীতি",
      formula: "1s² 2s² 2p⁶ 3s² 3p⁶ 4s¹",
      desc: "পরমাণুর বিভিন্ন শক্তিস্তরে ইলেকট্রনের বন্টন ও ব্যতিক্রমী নিয়মসমূহ হাতে-কলমে।",
      icon: Atom,
      color: "from-teal-500 to-emerald-600",
    },
  ];

  const filtered =
    activeCategory === "all"
      ? experiments
      : experiments.filter((e) => e.category === activeCategory);

  return (
    <section id="experiments" className="py-16 md:py-24 bg-muted/30 border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
            <FlaskConical className="h-3.5 w-3.5" /> ৫০+ ইন্টারেক্টিভ ল্যাব
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            NCTB কারিকুলামের প্রতিটি প্র্যাকটিক্যাল
          </h2>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground">
            নবম-দশম শ্রেণির পাঠ্যবইয়ের প্রতিটি গুরুত্বপূর্ণ বিক্রিয়া ও পরীক্ষণ এখন আপনার হাতের মুঠোয়।
          </p>

          {/* Category Tabs */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeCategory === c.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/60"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Experiment Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((exp) => (
            <Link
              key={exp.id}
              to="/labs"
              className="group relative rounded-2xl border border-border/80 bg-card p-5 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-md border border-border/40">
                    {exp.chapter}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    সিমুলেটর
                  </span>
                </div>

                <div className="flex items-start gap-3.5 my-2">
                  <div
                    className={`h-11 w-11 rounded-xl bg-gradient-to-br ${exp.color} text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
                  >
                    <exp.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {exp.title}
                    </h3>
                    <span className="font-mono text-xs text-muted-foreground block mt-0.5 font-medium">
                      {exp.formula}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                  {exp.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
                <span>ল্যাব ও থিওরি দেখুন</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Explore All Labs CTA */}
        <div className="mt-12 text-center">
          <Button asChild size="lg" className="rounded-xl px-7 text-sm font-semibold shadow-md">
            <Link to="/labs">
              সব ৫০+ ল্যাব ও থিওরি লাইব্রেরি দেখুন <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 5. CLASSROOM REALITY VS DR. CHEM (PROBLEM VS SOLUTION) ───────────── */
function ClassroomComparison() {
  const problemPoints = [
    {
      title: "পর্যাপ্ত ল্যাব ও রি-এজেন্টের সংকট",
      desc: "অধিকাংশ স্কুলে প্রয়োজনীয় বিকারক, রাসায়নিক ও কাচপাত্রের ঘাটতি থাকায় প্র্যাকটিক্যাল করানো সম্ভব হয় না।",
    },
    {
      title: "অ্যাসিড ও বিষাক্ত গ্যাসের ঝুঁকি",
      desc: "গাঢ় অ্যাসিডের তীব্রতা, আগুন ও ক্ষতিকর ধোঁয়ার কারণে অনেক শিক্ষক ক্লাসে ঝুঁকি নিতে চান না।",
    },
    {
      title: "৬০ জনের ক্লাসে ১ জন দর্শকের মতো",
      desc: "শিক্ষক টেবিলে দেখালেও পেছনের বেঞ্চের শিক্ষার্থীরা কিছুই পরিষ্কার দেখতে পায় না এবং নিজেরা করার সুযোগ পায় না।",
    },
    {
      title: "পরীক্ষার আগে অন্ধের মতো মুখস্থ",
      desc: "বিক্রিয়া চোখে না দেখে শুধুমাত্র নোটবুক মুখস্থ করায় পরীক্ষায় ছোটখাটো পরিবর্তন এলেই নম্বর হাতছাড়া হয়।",
    },
  ];

  const solutionPoints = [
    {
      title: "যে কোনো ডিভাইসে পূর্ণাঙ্গ ল্যাব সেটআপ",
      desc: "কম্পিউটার, ল্যাপটপ বা মোবাইলেই পুরো ল্যাবরেটরি উন্মুক্ত — কোনো বাড়তি খরচ বা রি-এজেন্ট কেনার ঝামেলা নেই।",
    },
    {
      title: "১০০% নিরাপদ — শূন্য দুর্ঘটনা",
      desc: "যতবার ইচ্ছা ভুল করুন, কোনো অ্যাসিড ছিটকে পড়ার ভয় নেই, নেই কোনো ধরনের ক্ষতের বা বিস্ফোরণের ঝুঁকি।",
    },
    {
      title: "প্রত্যেক শিক্ষার্থী নিজে হাতে করে শেখে",
      desc: "নিজের গতিতে যতবার খুশি পরীক্ষা পুনরাবৃত্তি করা যায়, ফলে প্রতিটি স্টেপ আত্মস্থ হয় শতভাগ।",
    },
    {
      title: "ভিজ্যুয়াল লার্নিং ও বোর্ড ভাইভায় এ-প্লাস",
      desc: "রঙ পরিবর্তন, বুদবুদ ও আণবিক পরিবর্তন চোখের সামনে দেখার কারণে স্মৃতিতে বিক্রিয়াগুলো সারাজীবন স্থায়ী হয়।",
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 mb-3">
            <AlertTriangle className="h-3.5 w-3.5" /> বাংলাদেশের বর্তমান ল্যাব বাস্তবতা
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            প্রথাগত ক্লাসরুম বনাম ডক্টর কেম
          </h2>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground">
            কেন সারা দেশের শিক্ষার্থী ও শিক্ষকেরা মুখস্থবিদ্যা ছেড়ে ভিজ্যুয়াল প্র্যাকটিক্যালে ঝুঁকছেন?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Problem Card (School Lab Reality) */}
          <div className="rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/[0.03] to-red-500/[0.08] p-7 sm:p-9 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                  ✕
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">প্রথাগত স্কুলের ল্যাব সংকট</h3>
                  <p className="text-xs text-muted-foreground">সীমিত সুযোগ ও ঝুঁকির বাস্তবতা</p>
                </div>
              </div>

              <div className="space-y-4">
                {problemPoints.map((pt) => (
                  <div key={pt.title} className="flex items-start gap-3">
                    <span className="h-5 w-5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      ✕
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{pt.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{pt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-red-500/20 text-xs font-medium text-red-600 dark:text-red-400">
              ফলাফল: রসায়নকে অনেকেই সবচেয়ে কঠিন ও ভয়ের বিষয় মনে করে।
            </div>
          </div>

          {/* Solution Card (Dr. Chem Virtual Lab) */}
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.05] via-teal-500/[0.05] to-emerald-500/[0.1] p-7 sm:p-9 flex flex-col justify-between shadow-lg shadow-emerald-500/5">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Dr. Chem ভার্চুয়াল ল্যাবে সমাধান</h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    আধুনিক, নিরাপদ ও আনন্দদায়ক শিক্ষা
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {solutionPoints.map((pt) => (
                  <div key={pt.title} className="flex items-start gap-3">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      ✓
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{pt.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{pt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>ফলাফল: রসায়নের প্র্যাকটিক্যাল হয়ে ওঠে মজাদার ও সহজ।</span>
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 6. TAILORED FOR STUDENTS & TEACHERS (ROLE TABS) ───────────── */
function RoleTabs() {
  const [role, setRole] = useState<"students" | "teachers">("students");

  const studentFeatures = [
    {
      icon: Eye,
      title: "চোখের সামনে রঙ পরিবর্তন ও বিক্রিয়া",
      desc: "বইয়ের পাতায় সমীকরণ মুখস্থ না করে, চোখের সামনে আয়ন ও গ্যাসের রূপান্তর দেখে পরিষ্কার ধারণা গড়ে তুলুন।",
    },
    {
      icon: ShieldCheck,
      title: "ভুল করার পূর্ণ স্বাধীনতা",
      desc: "ভুল কেমিক্যাল মেশালেও কোনো বিস্ফোরণ বা দুর্ঘটনার ভয় নেই। যতবার ইচ্ছা ট্রাই করে আসল নিয়ম শিখুন।",
    },
    {
      icon: Brain,
      title: "যেকোনো সময় এআই শিক্ষকের সাহায্য",
      desc: "রাতে পড়ার সময় আটকে গেলে কাউকে ফোন দেওয়ার দরকার নেই — ডক্টর কেম এআই যেকোনো সময় বুঝিয়ে দেবে।",
    },
    {
      icon: GraduationCap,
      title: "বোর্ড ভাইভায় শতভাগ কনফিডেন্স",
      desc: "প্রতিটি ল্যাবের শেষে রয়েছে বোর্ড স্ট্যান্ডার্ড ভাইভা প্রশ্নমালা, যা পরীক্ষার ভয় দূর করে দেয়।",
    },
  ];

  const teacherFeatures = [
    {
      icon: Users,
      title: "প্রজেক্টরে লাইভ ক্লাস ডেমো",
      desc: "পুরো ক্লাসের সামনে এক ক্লিকে যেকোনো বিক্রিয়া প্রজেক্ট করে নিখুঁতভাবে বুঝিয়ে দিন প্রতিটি পদক্ষেপ।",
    },
    {
      icon: ClipboardList,
      title: "ঝুঁকিপূর্ণ পরীক্ষা নির্বিঘ্নে প্রদর্শন",
      desc: "তীব্র অ্যাসিড বা বিষাক্ত গ্যাস ব্যবহার ছাড়াই ক্লাসের প্রতিটি শিক্ষার্থীকে বাস্তব ফলাফল প্রত্যক্ষ করান।",
    },
    {
      icon: BarChart3,
      title: "কেমিক্যাল ও ল্যাব বাজেটের সাশ্রয়",
      desc: "দামী ল্যাবরেটরি রাসায়নিক প্রতি বছর কেনা ও নষ্ট হওয়ার হাত থেকে স্কুলকে রক্ষা করে আধুনিক প্রযুক্তি।",
    },
    {
      icon: Sparkles,
      title: "সব মেধার শিক্ষার্থীর সমঅংশগ্রহণ",
      desc: "পেছনের বেঞ্চের শিক্ষার্থীও মোবাইল বা ট্যাবে নিজের হাতে পরীক্ষা সম্পন্ন করে আত্মবিশ্বাসী হয়ে ওঠে।",
    },
  ];

  const currentFeatures = role === "students" ? studentFeatures : teacherFeatures;

  return (
    <section className="py-16 md:py-24 bg-muted/20 border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-3">
            <Users className="h-3.5 w-3.5" /> সবার জন্য উপযোগী
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            শিক্ষার্থী ও শিক্ষক — উভয়ের জন্যই সেরা
          </h2>

          {/* Role Toggle Switch */}
          <div className="mt-7 inline-flex items-center p-1.5 rounded-2xl bg-card border border-border shadow-sm">
            <button
              type="button"
              onClick={() => setRole("students")}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                role === "students"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              👨‍🎓 শিক্ষার্থীদের জন্য
            </button>
            <button
              type="button"
              onClick={() => setRole("teachers")}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                role === "teachers"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              👨‍🏫 শিক্ষক ও প্রতিষ্ঠানের জন্য
            </button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {currentFeatures.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border/80 bg-card p-6 hover:shadow-lg transition-all"
            >
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground mb-2">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── 7. TESTIMONIALS (FROSTED REVIEWS) ───────────── */
function Testimonials() {
  const reviews = [
    {
      name: "রাহিমা আক্তার",
      role: "সিনিয়র রসায়ন শিক্ষক",
      school: "ভিকারুননিসা নূন স্কুল অ্যান্ড কলেজ, ঢাকা",
      quote:
        "আমার দশম শ্রেণির শিক্ষার্থীরা প্রথমবারের মতো টাইট্রেশনের শেষ বিন্দুর হালকা গোলাপি রঙ নিজে হাতে বের করতে পেরেছে। মুখস্থ করার চেয়ে নিজে দেখে শেখার প্রভাব অভূতপূর্ব!",
    },
    {
      name: "মাহমুদ হাসান",
      role: "বিজ্ঞান বিভাগীয় প্রধান",
      school: "ব্লু বার্ড হাই স্কুল অ্যান্ড কলেজ, সিলেট",
      quote:
        "ডক্টর কেম-এর এআই টিউটর পুরো বাংলায় উত্তর দেয়। ক্লাসে যারা লজ্জা পেয়ে প্রশ্ন করতো না, তারাও এখন নির্দ্বিধায় রসায়নের কঠিন বিষয়গুলো বুঝে নিচ্ছে।",
    },
    {
      name: "সুমাইয়া ইসলাম",
      role: "সহকারী শিক্ষক (রসায়ন)",
      school: "চট্টগ্রাম সরকারি উচ্চ বিদ্যালয়",
      quote:
        "এসএসসি প্র্যাকটিক্যাল ভাইভায় শতভাগ নম্বরের জন্য এই প্ল্যাটফর্মটি অতুলনীয়। স্কুলের ল্যাব না থাকা সত্ত্বেও আমার সকল শিক্ষার্থী পরীক্ষায় দারুণ ফল করেছে।",
    },
  ];

  return (
    <section id="testimonials" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
            <Star className="h-3.5 w-3.5 fill-current" /> শিক্ষক ও শিক্ষার্থীদের অভিজ্ঞতা
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            সারা দেশের সেরা শিক্ষকদের আস্থা
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">
            ইতিমধ্যে বাংলাদেশের বিভিন্ন প্রান্তের স্কুল ও কলেজের শিক্ষক এবং শিক্ষার্থীরা ডক্টর কেম
            ব্যবহার করছেন।
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 relative flex flex-col justify-between hover:shadow-xl transition-all"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <Quote className="h-6 w-6 text-primary/30 mb-2" />
                <p className="text-sm text-foreground/90 leading-relaxed italic">"{r.quote}"</p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60">
                <p className="font-bold text-sm text-foreground">{r.name}</p>
                <p className="text-xs text-primary font-medium">{r.role}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.school}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── 8. FINAL HIGH-CONVERSION CTA ───────────── */
function FinalCTA() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 p-8 sm:p-12 md:p-16 text-center overflow-hidden shadow-2xl">
          {/* Decorative Mesh Background Lights */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Peeking Mascot Badge */}
            <div className="mb-4 relative">
              <img
                src={welcomeHero}
                alt="Dr. Chem Mascot"
                className="w-24 h-24 object-contain drop-shadow-xl animate-bounce duration-1000"
              />
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold text-white mb-4 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" /> ১০০% ফ্রি শুরু করুন
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-2xl leading-tight">
              {isAuthenticated
                ? "স্বাগতম! আবার ল্যাবে ফিরে যান"
                : "আজই শুরু করুন আপনার ভার্চুয়াল কেমিস্ট্রি জার্নি"}
            </h2>

            <p className="mt-4 text-emerald-100 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
              {isAuthenticated
                ? "আপনার ড্যাশবোর্ডে গিয়ে নতুন এক্সপেরিমেন্ট শুরু করুন বা ভাইভা প্রস্তুতি নিন।"
                : "হাজারো শিক্ষার্থীর মতো তুমিও রসায়নকে ভালোবাসতে শুরু করো। কোনো সফটওয়্যার ইন্সটল করার ঝামেলা নেই।"}
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 px-7 text-base font-bold bg-white text-emerald-900 hover:bg-emerald-50 shadow-xl transition-all hover:scale-105"
              >
                <Link to="/app">
                  {isAuthenticated ? (
                    <>
                      <ArrowRight className="h-5 w-5 mr-1 text-emerald-700" /> ড্যাশবোর্ডে যান
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-1 text-emerald-600" /> বিনামূল্যে শুরু করুন
                    </>
                  )}
                </Link>
              </Button>

              {!isAuthenticated && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 px-6 text-base font-semibold bg-transparent text-white border-white/40 hover:bg-white/10 hover:text-white transition-all"
                >
                  <Link to="/login">
                    <PlayCircle className="h-5 w-5 mr-2" /> লগইন
                  </Link>
                </Button>
              )}
            </div>

            <p className="mt-6 text-xs text-emerald-200/90 flex flex-wrap items-center justify-center gap-3">
              <span>✓ কোনো ক্রেডিট কার্ড লাগবে না</span>
              <span>•</span>
              <span>✓ মোবাইল ও পিসি উভয়েই চলে</span>
              <span>•</span>
              <span>✓ NCTB কারিকুলাম সমর্থিত</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 9. FOOTER ───────────── */
function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-gradient-to-br from-background via-primary/5 to-blue-500/10">
      <div className="absolute -top-24 left-1/4 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <DrChemLogo size="lg" showText />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xs">
              Class 9-10-এর জন্য AI-পাওয়ার্ড ভার্চুয়াল কেমিস্ট্রি ল্যাব। নিরাপদে শিখুন, যেকোনো
              সময়, যেকোনো ডিভাইসে।
            </p>
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} · Made with 💙 by{" "}
              <a
                href="https://anowerferdos2nd.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline transition-colors"
              >
                ANOWER FERDOS
              </a>
            </span>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-lg sm:text-xl text-foreground">যোগাযোগ করুন</h3>
            <a
              href="mailto:drchem.edu@gmail.com"
              className="group flex items-center gap-3 text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all group-hover:scale-110">
                ✉️
              </span>
              <span className="font-medium">drchem.edu@gmail.com</span>
            </a>
            <a
              href="tel:+8801581553923"
              className="group flex items-center gap-3 text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all group-hover:scale-110">
                📞
              </span>
              <span className="font-medium">01581-553923</span>
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61590260023432"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all group-hover:scale-110">
                📘
              </span>
              <span className="font-medium">Facebook Page</span>
            </a>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-lg sm:text-xl text-foreground">গুরুত্বপূর্ণ লিংক</h3>
            <Link
              to="/chapters"
              className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit font-medium flex items-center gap-2"
            >
              <span>📖</span> SSC Chemistry Chapters (১-১২ অধ্যায়)
            </Link>
            <Link
              to="/labs"
              className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit font-medium flex items-center gap-2"
            >
              <span>🧪</span> Virtual Lab & Theory Library
            </Link>
            <Link
              to="/app"
              className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit font-medium flex items-center gap-2"
            >
              <span>🔬</span> Open Interactive Lab
            </Link>
            <Link
              to="/pricing"
              className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit font-medium flex items-center gap-2"
            >
              <span>💎</span> Pricing Plans
            </Link>
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-primary transition-colors w-fit font-medium flex items-center gap-2"
            >
              <span>🔐</span> Login
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground">
          <span>সকল অধিকার সংরক্ষিত · Dr. Chem Bangladesh (NCTB সিলেবাস সমর্থিত)</span>
          <span className="flex items-center gap-1.5">
            Made by{" "}
            <a
              href="https://anowerferdos2nd.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline transition-colors"
            >
              ANOWER FERDOS
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
