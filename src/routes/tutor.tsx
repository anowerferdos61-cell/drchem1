import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Menu, X, Lock } from "lucide-react";
import { useState, useEffect } from "react";

import ChatSidebar from "@/components/tutor/ChatSidebar";
import ChatWindow from "@/components/tutor/ChatWindow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePresenceTracker } from "@/hooks/usePresence";
import UserMenu from "@/components/auth/UserMenu";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/tutor")({
  component: TutorPage,
  head: () => ({
    meta: [
      { title: "Dr. Chem · AI Chemistry Tutor" },
      {
        name: "description",
        content:
          "ChatGPT-style bilingual Chemistry tutor (Dr. Chem) for Bangladeshi Class 9-10 students. Streaming answers, KaTeX equations, and book-grounded RAG mode.",
      },
      { property: "og:title", content: "Dr. Chem · AI Chemistry Tutor" },
      {
        property: "og:description",
        content:
          "Formal bilingual AI teacher for NCTB Class 9-10 chemistry with streaming and RAG.",
      },
    ],
  }),
});

function TutorPage() {
  usePresenceTracker("tutor");
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      void navigate({ to: "/login", search: { redirect: "/tutor" } });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex h-svh w-full flex-col items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm p-6 rounded-2xl border border-border/70 bg-card shadow-lg">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">AI টিউটর ব্যবহারে লগইন প্রয়োজন</h2>
            <p className="text-xs text-muted-foreground mt-1">
              ডক্টর কেম AI টিউটরের সাথে চ্যাট করতে এবং হিস্ট্রি সংরক্ষণ করতে অনুগ্রহ করে লগইন করুন।
            </p>
          </div>
          <Button asChild className="w-full">
            <Link to="/login" search={{ redirect: "/tutor" }}>
              লগইন পেজে যান
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      {/* Sidebar — desktop */}
      <div className="hidden w-72 shrink-0 md:block">
        <ChatSidebar />
      </div>

      {/* Sidebar — mobile drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-72 md:hidden",
              "animate-in slide-in-from-left duration-200",
            )}
          >
            <ChatSidebar />
          </div>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-2 md:hidden">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen((v) => !v)}
              className="h-8 w-8"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <Link to="/" className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              হোম
            </Link>
          </div>
          <UserMenu />
        </div>

        {/* Desktop back link */}
        <div className="hidden h-10 shrink-0 items-center justify-between border-b px-3 md:flex">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard-এ ফিরুন
          </Link>
          <UserMenu />
        </div>

        <div className="min-h-0 flex-1">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
