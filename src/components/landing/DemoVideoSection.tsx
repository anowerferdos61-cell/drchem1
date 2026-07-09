import { Link } from "@tanstack/react-router";
import { PlayCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_VIDEO_ID } from "./VideoModal";

export function DemoVideoSection() {
  return (
    <section id="what-is-dr-chem" className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
            <PlayCircle className="h-3.5 w-3.5" /> ৯০ সেকেন্ডে দেখে নিন
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            What is{" "}
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              Dr. Chem
            </span>
            ?
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            ভিডিও দেখে জেনে নিন আমাদের কাজ সম্পর্কে — ভার্চুয়াল ল্যাব, AI টিউটর ও
            ভাইভা প্র্যাকটিস কীভাবে একসাথে কাজ করে।
          </p>
        </div>

        <div className="relative group">
          <div className="absolute -inset-2 md:-inset-4 bg-gradient-to-br from-primary/40 via-blue-400/30 to-purple-500/30 rounded-3xl blur-2xl opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="relative aspect-video rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-border bg-black">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?rel=0&modestbranding=1`}
              title="Dr. Chem — What is it?"
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
            🧪 <span className="font-medium">৪০+ ভার্চুয়াল ল্যাব</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
            🤖 <span className="font-medium">AI টিউটর</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
            🎓 <span className="font-medium">ভাইভা প্র্যাকটিস</span>
          </span>
        </div>

        <div className="mt-8 text-center">
          <Button asChild size="lg" className="text-base">
            <Link to="/app">
              <Sparkles className="h-4 w-4" /> এখনই ফ্রি শুরু করো
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
