import { Link } from "@tanstack/react-router";
import { Check, Sparkles, ArrowRight, PlayCircle, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_VIDEO_ID } from "./VideoModal";

const features = ["৪০+ ভার্চুয়াল ল্যাব", "AI টিউটর (বাংলা + English)", "ভাইভা প্র্যাকটিস"];

export function DemoVideoSection() {
  return (
    <section id="what-is-dr-chem" className="relative py-20 md:py-28 overflow-hidden">
      {/* soft page-level ambience */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* LEFT — content */}
          <div className="lg:col-span-5 space-y-7 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
              <PlayCircle className="h-3.5 w-3.5" />
              Platform Introduction
            </span>

            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
                What is{" "}
                <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                  Dr. Chem?
                </span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg">
                ৯০ সেকেন্ডের একটি ভিডিওতে দেখে নিন — ভার্চুয়াল ল্যাব, AI টিউটর ও ভাইভা প্র্যাকটিস
                কীভাবে একসাথে Class 9–10 কেমিস্ট্রি শেখাকে সহজ করে তোলে।
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {features.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium shadow-sm hover:border-primary/40 transition-colors"
                >
                  <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={3} />
                  {f}
                </span>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button asChild size="lg" className="text-base h-12 px-6 shadow-lg shadow-primary/20">
                <Link to="/app">
                  <Sparkles className="h-4 w-4" /> এখনই ফ্রি শুরু করো
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* RIGHT — video spotlight */}
          <div className="lg:col-span-7 relative group">
            {/* decorative blobs */}
            <div className="pointer-events-none absolute -top-12 -right-12 w-64 h-64 rounded-full bg-primary/20 blur-3xl opacity-70 group-hover:opacity-100 transition-opacity" />
            <div className="pointer-events-none absolute -bottom-14 -left-10 w-56 h-56 rounded-full bg-blue-400/20 blur-3xl opacity-60 group-hover:opacity-90 transition-opacity" />

            {/* video frame */}
            <div className="relative bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border-[8px] md:border-[10px] border-background ring-1 ring-border aspect-video transition-transform duration-500 group-hover:scale-[1.015]">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?rel=0&modestbranding=1`}
                title="Dr. Chem — What is it?"
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* floating info card */}
            <div className="absolute -bottom-6 right-6 md:right-10 bg-card p-3.5 pr-5 rounded-2xl shadow-2xl border border-border hidden sm:flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Film className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Preview
                </p>
                <p className="text-sm font-bold">Interactive Lab Demo</p>
              </div>
              {/* live dot */}
              <span className="relative flex h-2.5 w-2.5 ml-1">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
