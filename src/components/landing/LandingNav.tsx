import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  FlaskConical,
  BookOpen,
  Bot,
  Sparkles,
  Menu,
  X,
  GraduationCap,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { DrChemLogo } from "@/components/brand/DrChemLogo";
import UserMenu from "@/components/auth/UserMenu";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-2 sm:top-3 md:top-4 z-50 w-full px-3 sm:px-4 md:px-6 transition-all duration-300">
      {/* ── Floating Capsule Navbar ── */}
      <div
        className={cn(
          "mx-auto max-w-6xl rounded-full border transition-all duration-300",
          scrolled
            ? "border-border/80 bg-background/85 dark:bg-slate-950/85 backdrop-blur-2xl shadow-xl shadow-black/5 dark:shadow-cyan-950/25 py-2 px-3 sm:px-5"
            : "border-border/60 bg-background/70 dark:bg-slate-950/70 backdrop-blur-xl shadow-lg shadow-black/5 py-2.5 px-3.5 sm:px-6",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          {/* LEFT: Brand Logo + NCTB Chip */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <DrChemLogo size="sm" showText textClassName="font-extrabold tracking-tight" />
            </Link>

            <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              NCTB 9-10
            </span>
          </div>

          {/* CENTER: Desktop Floating Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 text-xs lg:text-sm">
            <Link
              to="/labs"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all duration-200"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              ল্যাব লাইব্রেরি
            </Link>

            <Link
              to="/chapters"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all duration-200"
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              অধ্যায় গাইড
            </Link>

            <Link
              to="/tutor"
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all duration-200"
            >
              <Bot className="h-3.5 w-3.5 text-cyan-500 group-hover:scale-110 transition-transform" />
              AI টিউটর
              <span className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-1.5 py-0.2 text-[9px] font-bold text-white leading-tight">
                AI
              </span>
            </Link>

            <Link
              to="/pricing"
              className="px-3 py-1.5 rounded-full font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all duration-200"
            >
              প্রাইসিং
            </Link>

            <a
              href="#faq"
              className="px-3 py-1.5 rounded-full font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all duration-200"
            >
              FAQ
            </a>
          </nav>

          {/* RIGHT: User Actions & Mobile Hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            <UserMenu />

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-muted/60 text-foreground md:hidden hover:bg-muted transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Dropdown Island ── */}
      {mobileOpen && (
        <div className="mx-auto mt-2 max-w-6xl rounded-3xl border border-border/80 bg-background/95 p-4 shadow-2xl backdrop-blur-2xl md:hidden animate-in fade-in slide-in-from-top-3 duration-200 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/labs"
              onClick={() => setMobileOpen(false)}
              className="flex flex-col gap-1 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3 transition-colors hover:bg-emerald-500/15"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <FlaskConical className="h-4 w-4" />
                ল্যাব লাইব্রেরি
              </div>
              <span className="text-[10px] text-muted-foreground">৫০+ ভার্চুয়াল সিমুলেশন</span>
            </Link>

            <Link
              to="/tutor"
              onClick={() => setMobileOpen(false)}
              className="flex flex-col gap-1 rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-3 transition-colors hover:bg-cyan-500/15"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                <Bot className="h-4 w-4" />
                AI টিউটর
                <span className="rounded bg-cyan-500 px-1 text-[8px] font-bold text-white">PRO</span>
              </div>
              <span className="text-[10px] text-muted-foreground">২৪/৭ কেমিস্ট্রি সাহায্য</span>
            </Link>

            <Link
              to="/chapters"
              onClick={() => setMobileOpen(false)}
              className="flex flex-col gap-1 rounded-2xl border border-border/70 bg-card p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                অধ্যায় গাইড
              </div>
              <span className="text-[10px] text-muted-foreground">১-১২ অধ্যায় সম্পূর্ণ নোট</span>
            </Link>

            <Link
              to="/pricing"
              onClick={() => setMobileOpen(false)}
              className="flex flex-col gap-1 rounded-2xl border border-border/70 bg-card p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-amber-500" />
                প্রাইসিং প্ল্যান
              </div>
              <span className="text-[10px] text-muted-foreground">৭ দিন ফ্রি ট্রায়াল</span>
            </Link>
          </div>

          <div className="border-t border-border/60 pt-3 space-y-2">
            <Link
              to="/app"
              onClick={() => setMobileOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20"
            >
              <FlaskConical className="h-4 w-4" />
              সরাসরি ল্যাবে প্রবেশ করুন
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-muted-foreground">
              <a href="tel:01581553923" className="hover:text-primary transition-colors">
                📞 01581-553923
              </a>
              <a href="mailto:drchem.edu@gmail.com" className="hover:text-primary transition-colors">
                ✉️ drchem.edu@gmail.com
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default LandingNav;
