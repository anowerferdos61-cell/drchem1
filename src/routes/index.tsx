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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/auth/UserMenu";
import { useAuth } from "@/lib/auth-store";
import { useState } from "react";
import { DemoVideoSection } from "@/components/landing/DemoVideoSection";
import { VideoModal } from "@/components/landing/VideoModal";
import { FaqSection, GuideFaqButton } from "@/components/landing/FaqSection";
import heroImg from "@/assets/landing-hero.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Dr. Chem — AI-Powered Virtual Chemistry Lab for Class 9-10" },
      {
        name: "description",
        content:
          "Perform chemistry experiments safely, learn visually, and get instant help from the Dr. Chem AI tutor. Built for Bangladeshi Class 9-10 students and teachers.",
      },
      { property: "og:title", content: "Dr. Chem — AI Virtual Chemistry Lab" },
      {
        property: "og:description",
        content:
          "Safe, visual, AI-guided chemistry experiments for Class 9-10 — pH scale, titration, oxygen prep, bonding, and more.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://drchemedu.com/" },
    ],
    links: [{ rel: "canonical", href: "https://drchemedu.com/" }],
  }),
});

function Landing() {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero onWatchDemo={() => setDemoOpen(true)} />
      <DemoVideoSection />
      <Problem />
      <Solution />
      <Experiments />
      <Teachers />
      <Students />
      <Testimonials />
      <FaqSection />
      <FinalCTA />
      <Footer />
      <VideoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
}

/* ───────────── Nav ───────────── */
function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <FlaskConical className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">Dr. Chem</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#solution" className="text-muted-foreground hover:text-foreground">
            Features
          </a>
          <a href="#experiments" className="text-muted-foreground hover:text-foreground">
            Experiments
          </a>
          <a href="#teachers" className="text-muted-foreground hover:text-foreground">
            Teachers
          </a>
          <a href="#testimonials" className="text-muted-foreground hover:text-foreground">
            Reviews
          </a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground">
            Guide & FAQ
          </a>
        </nav>
        <UserMenu />
      </div>
    </header>
  );
}

/* ───────────── Hero ───────────── */
function Hero({ onWatchDemo }: { onWatchDemo: () => void }) {
  const { isAuthenticated } = useAuth();
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Made for Class 9-10 · বাংলায় ও ইংরেজিতে
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            AI-Powered Virtual{" "}
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              Chemistry Lab
            </span>{" "}
            for Class 9-10
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl">
            Perform chemistry experiments safely, learn visually, and get instant help from{" "}
            <strong className="text-foreground">Dr. Chem AI Tutor</strong> — anywhere, anytime.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="text-base">
              <Link to="/app">
                {isAuthenticated ? (
                  <>
                    <ArrowRight className="h-4 w-4" /> ড্যাশবোর্ডে যান
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Try Free
                  </>
                )}
              </Link>
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="text-base"
              onClick={onWatchDemo}
            >
              <PlayCircle className="h-4 w-4" /> Watch Demo
            </Button>
            <GuideFaqButton />
          </div>
          <div className="mt-6 flex flex-wrap gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No installation
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 100% safe
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free for students
            </span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 to-blue-400/30 rounded-3xl blur-2xl" />
          <img
            src={heroImg}
            alt="Student using the Dr. Chem virtual chemistry lab on a tablet"
            width={1280}
            height={960}
            className="relative rounded-3xl shadow-2xl border border-border w-full"
          />
        </div>
      </div>
    </section>
  );
}

/* ───────────── Problem ───────────── */
function Problem() {
  const items = [
    {
      icon: AlertTriangle,
      title: "পর্যাপ্ত ল্যাব নেই",
      desc: "Most schools don't have working chemistry labs or proper equipment.",
    },
    {
      icon: ShieldCheck,
      title: "Unsafe experiments",
      desc: "Acids, bases and reactive gases are too risky to demonstrate in class.",
    },
    {
      icon: Eye,
      title: "Students just memorize",
      desc: "Without seeing reactions, students rely on imagination instead of understanding.",
    },
  ];
  return (
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Chemistry in Bangladesh — broken classroom
          </h2>
          <p className="mt-3 text-muted-foreground">
            বাংলাদেশের বেশিরভাগ স্কুলে শিক্ষার্থীরা পরীক্ষা নিজে করে দেখতে পারে না।
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-shadow"
            >
              <div className="h-11 w-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">{it.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Solution ───────────── */
function Solution() {
  const items = [
    {
      icon: FlaskConical,
      title: "Virtual Lab",
      desc: "Interactive 3D experiments with realistic reactions and animations.",
      tint: "from-emerald-400 to-emerald-600",
    },
    {
      icon: Brain,
      title: "AI Tutor",
      desc: "Ask Dr. Chem any question — get step-by-step Bangla + English explanations.",
      tint: "from-indigo-400 to-indigo-600",
    },
    {
      icon: GraduationCap,
      title: "Viva Practice",
      desc: "AI-generated viva questions with instant grading and feedback.",
      tint: "from-amber-400 to-orange-500",
    },
    {
      icon: Zap,
      title: "Interactive Simulations",
      desc: "Drag, drop, mix — learn by doing, not by reading.",
      tint: "from-pink-400 to-rose-500",
    },
  ];
  return (
    <section id="solution" className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 mb-3">
            <Lightbulb className="h-3.5 w-3.5" /> Our solution
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            One platform. Four superpowers.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything a Class 9-10 student or teacher needs to master chemistry.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((it) => (
            <div
              key={it.title}
              className="group relative rounded-2xl border border-border bg-card p-6 overflow-hidden hover:shadow-xl transition-all"
            >
              <div
                className={`h-12 w-12 rounded-xl bg-gradient-to-br ${it.tint} text-white flex items-center justify-center mb-4`}
              >
                <it.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg">{it.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Experiments ───────────── */
function Experiments() {
  const exps = [
    { icon: Droplet, name: "Acid-Base Titration", tag: "HCl + NaOH" },
    { icon: BarChart3, name: "pH Scale", tag: "0 → 14" },
    { icon: Wind, name: "Oxygen Preparation", tag: "H₂O₂ → O₂" },
    { icon: Atom, name: "Chemical Bonding", tag: "Ionic vs Covalent" },
    { icon: Beaker, name: "CuSO₄ + Water", tag: "Hydration" },
    { icon: FlaskConical, name: "NaCl Crystal", tag: "Crystallization" },
  ];
  return (
    <section id="experiments" className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            12+ interactive experiments
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every NCTB Class 9-10 chemistry experiment — playable in your browser.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exps.map((e) => (
            <div
              key={e.name}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <e.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{e.name}</h3>
                <p className="text-xs text-muted-foreground">{e.tag}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg" variant="outline">
            <Link to="/app">
              See all experiments <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Teachers ───────────── */
function Teachers() {
  const items = [
    { icon: Users, title: "Class Demo", desc: "Project any experiment live to the whole class." },
    {
      icon: ClipboardList,
      title: "Assignments",
      desc: "Set practice tasks and viva for students.",
    },
    { icon: BarChart3, title: "Student Reports", desc: "See every student's accuracy & mistakes." },
    {
      icon: GraduationCap,
      title: "Viva Practice",
      desc: "Auto-generated viva questions with grading.",
    },
  ];
  return (
    <section id="teachers" className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 mb-3">
            <GraduationCap className="h-3.5 w-3.5" /> For teachers
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Teach chemistry without a physical lab
          </h2>
          <p className="mt-3 text-muted-foreground">
            Demonstrate every experiment from a single screen. Save lab time, save chemicals, and
            reach every student — including those who learn slower.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((it) => (
            <div key={it.title} className="rounded-xl border border-border bg-card p-5">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{it.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Students ───────────── */
function Students() {
  const items = [
    {
      icon: Eye,
      title: "Visual Learning",
      desc: "See molecules, reactions, color changes in real time.",
    },
    { icon: ShieldCheck, title: "Safe Experiments", desc: "Mix acids, prepare gases — zero risk." },
    {
      icon: Brain,
      title: "Instant AI Help",
      desc: "Stuck on a step? Dr. Chem explains it your way.",
    },
    {
      icon: BookOpen,
      title: "Exam Preparation",
      desc: "NCTB syllabus mapped — viva + theory + lab in one place.",
    },
  ];
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-blue-500/5">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
        <div className="grid sm:grid-cols-2 gap-4 md:order-2">
          {items.map((it) => (
            <div key={it.title} className="rounded-xl border border-border bg-card p-5">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{it.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
        <div className="md:order-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" /> For students
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Chemistry, but actually fun
          </h2>
          <p className="mt-3 text-muted-foreground">
            Drag equipment, mix chemicals, watch reactions — then ask Dr. Chem anything you didn't
            get. Built for the way you actually study.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Testimonials ───────────── */
function Testimonials() {
  const reviews = [
    {
      name: "Rahima Akter",
      role: "Chemistry Teacher · Dhaka",
      quote:
        "First time my Class 10 students saw an actual titration endpoint. Game changer for our school.",
    },
    {
      name: "Mahmud Hasan",
      role: "Science Teacher · Sylhet",
      quote:
        "The AI tutor answers in Bangla. Students who were too shy to ask in class are finally learning.",
    },
    {
      name: "Sumaiya Islam",
      role: "Senior Teacher · Chattogram",
      quote: "Viva practice with instant grading saved me hours every week. My pass rate jumped.",
    },
  ];
  return (
    <section id="testimonials" className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Loved by teachers across Bangladesh
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {reviews.map((r) => (
            <div key={r.name} className="rounded-2xl border border-border bg-card p-6 relative">
              <Quote className="h-7 w-7 text-primary/30 mb-3" />
              <p className="text-sm leading-relaxed">"{r.quote}"</p>
              <div className="mt-5 pt-4 border-t border-border">
                <p className="font-semibold text-sm">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Final CTA ───────────── */
function FinalCTA() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative rounded-3xl bg-gradient-to-br from-primary to-blue-600 p-10 md:p-14 text-center overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              {isAuthenticated ? "Welcome back to Dr. Chem" : "Start Learning Chemistry Smarter"}
            </h2>
            <p className="mt-4 text-white/90 text-lg max-w-xl mx-auto">
              {isAuthenticated
                ? "সরাসরি আপনার ড্যাশবোর্ডে ফিরে যান এবং পরীক্ষণ চালিয়ে যান।"
                : "Join Dr. Chem free today and bring the lab to every student."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="text-base">
                <Link to="/app">
                  {isAuthenticated ? (
                    <>
                      <ArrowRight className="h-4 w-4" /> ড্যাশবোর্ডে যান
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Create Free Account
                    </>
                  )}
                </Link>
              </Button>
              {!isAuthenticated && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="text-base bg-transparent text-white border-white/40 hover:bg-white/10 hover:text-white"
                >
                  <Link to="/login">
                    <PlayCircle className="h-4 w-4" /> Login
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Footer ───────────── */
function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-gradient-to-br from-background via-primary/5 to-blue-500/10">
      <div className="absolute -top-24 left-1/4 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/30 hover-scale">
                <FlaskConical className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-2xl tracking-tight">Dr. Chem</span>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xs">
              Class 9-10-এর জন্য AI-পাওয়ার্ড ভার্চুয়াল কেমিস্ট্রি ল্যাব। নিরাপদে শিখুন, যেকোনো
              সময়, যেকোনো জায়গায়।
            </p>
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} · Made with 💙 in Bangladesh
            </span>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <h3 className="font-bold text-xl text-foreground">যোগাযোগ করুন</h3>
            <a
              href="mailto:drchemhelp247@gmail.com"
              className="group flex items-center gap-3 text-base text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all group-hover:scale-110">
                ✉️
              </span>
              <span className="font-medium">drchemhelp247@gmail.com</span>
            </a>
            <a
              href="tel:+8801581553923"
              className="group flex items-center gap-3 text-base text-muted-foreground hover:text-primary transition-colors"
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
              className="group flex items-center gap-3 text-base text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all group-hover:scale-110">
                📘
              </span>
              <span className="font-medium">Facebook</span>
            </a>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h3 className="font-bold text-xl text-foreground">দ্রুত লিংক</h3>
            <Link
              to="/app"
              className="text-base text-muted-foreground hover:text-primary transition-colors story-link w-fit font-medium"
            >
              🧪 Open Virtual Lab
            </Link>
            <Link
              to="/pricing"
              className="text-base text-muted-foreground hover:text-primary transition-colors story-link w-fit font-medium"
            >
              💎 Pricing Plans
            </Link>
            <Link
              to="/login"
              className="text-base text-muted-foreground hover:text-primary transition-colors story-link w-fit font-medium"
            >
              🔐 Login
            </Link>
            <Link
              to="/signup"
              className="text-base text-muted-foreground hover:text-primary transition-colors story-link w-fit font-medium"
            >
              ✨ Create Account
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>সকল অধিকার সংরক্ষিত · Dr. Chem Bangladesh</span>
          <span className="flex items-center gap-2">
            Powered by <span className="font-semibold text-primary">AI</span> · Built for
            <span className="font-semibold text-foreground">শিক্ষার্থী</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
