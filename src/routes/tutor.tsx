import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Menu, X } from "lucide-react";
import { useState } from "react";

import ChatSidebar from "@/components/tutor/ChatSidebar";
import ChatWindow from "@/components/tutor/ChatWindow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <div className="flex h-12 shrink-0 items-center gap-2 border-b px-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((v) => !v)}
            className="h-8 w-8"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
          <Link
            to="/"
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            হোম
          </Link>
        </div>

        {/* Desktop back link */}
        <div className="hidden h-9 shrink-0 items-center border-b px-3 md:flex">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard-এ ফিরুন
          </Link>
        </div>

        <div className="min-h-0 flex-1">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
