/**
 * /app/notes — Smart Notes module.
 * Notion-style reading view, lightweight markdown rendering, premium gate,
 * floating "Ask Dr. Chem about this topic" button → /tutor with seed.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, FileText, Lock, NotebookPen } from "lucide-react";
import {
  LibraryShell,
  PremiumLockCard,
  useLibraryRows,
} from "@/components/library/LibraryLayout";
import { useEntitlements } from "@/hooks/useEntitlements";

interface NoteRow {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
  is_premium: boolean;
}

export const Route = createFileRoute("/app/notes")({
  component: NotesPage,
  head: () => ({
    meta: [
      { title: "Smart Notes · Dr. Chem" },
      {
        name: "description",
        content:
          "Chapter-wise smart notes for NCTB Class 9-10 chemistry — clean reading view with AI tutor integration.",
      },
      { property: "og:title", content: "Smart Notes · Dr. Chem" },
      { property: "og:description", content: "Chapter-wise NCTB chemistry smart notes." },
    ],
  }),
});

function NotesPage() {
  const { data: rows = [], isLoading } = useLibraryRows<NoteRow>(
    "notes",
    "id, chapter_number, title, content, is_premium",
  );
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { isPro } = useEntitlements();
  const navigate = useNavigate();

  const countsByChapter = useMemo(() => {
    const m: Record<number, number> = {};
    rows.forEach((r) => {
      m[r.chapter_number] = (m[r.chapter_number] ?? 0) + 1;
    });
    return m;
  }, [rows]);

  const chapterNotes = useMemo(
    () => rows.filter((r) => r.chapter_number === activeChapter),
    [rows, activeChapter],
  );

  const selected =
    chapterNotes.find((n) => n.id === selectedId) ?? chapterNotes[0] ?? null;
  const locked = !!selected && selected.is_premium && !isPro;

  const askTutor = () => {
    if (!selected) return;
    try {
      sessionStorage.setItem(
        "tutor:seed",
        `"${selected.title}" — এই বিষয়টি সহজ ভাষায় বুঝিয়ে দাও।`,
      );
    } catch {
      /* ignore */
    }
    void navigate({ to: "/tutor" });
  };

  return (
    <LibraryShell
      module="notes"
      headerTitleBn="স্মার্ট নোটস"
      headerSubtitle="Smart Notes · NCTB"
      accent="from-amber-500 to-orange-600"
      activeChapter={activeChapter}
      setActiveChapter={(n) => {
        setActiveChapter(n);
        setSelectedId(null);
      }}
      countsByChapter={countsByChapter}
    >
      {isLoading ? (
        <div className="grid h-64 place-items-center text-sm text-muted-foreground">
          লোড হচ্ছে…
        </div>
      ) : chapterNotes.length === 0 ? (
        <Card className="grid h-64 place-items-center border-dashed text-center">
          <div>
            <NotebookPen className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              এই অধ্যায়ে এখনো কোনো নোট নেই। শীঘ্রই আসছে।
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
          {/* Note list */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              অধ্যায়ের নোট
            </div>
            {chapterNotes.map((n) => {
              const isActive = selected?.id === n.id;
              const nLocked = n.is_premium && !isPro;
              return (
                <button
                  key={n.id}
                  onClick={() => setSelectedId(n.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    isActive
                      ? "border-amber-500 bg-amber-500/10 shadow-sm"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-amber-600" />
                    {nLocked && <Lock className="h-3 w-3 text-amber-600" />}
                  </div>
                  <div className="mt-1 text-sm font-semibold leading-snug">{n.title}</div>
                </button>
              );
            })}
          </div>

          {/* Reader */}
          <div className="relative min-h-[60vh]">
            {selected && locked && <PremiumLockCard kind="note" />}
            {selected && !locked && (
              <Card className="relative overflow-hidden p-6 md:p-10">
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    CH {String(selected.chapter_number).padStart(2, "0")}
                  </Badge>
                  {selected.is_premium && (
                    <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300">Pro</Badge>
                  )}
                </div>
                <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-extrabold prose-h1:text-3xl prose-h2:mt-8 prose-h2:text-xl prose-p:leading-relaxed prose-strong:text-foreground">
                  <MarkdownLite text={selected.content} />
                </article>

                {/* Floating Ask Dr. Chem */}
                <Button
                  onClick={askTutor}
                  className="fixed bottom-6 right-6 z-40 gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-6 shadow-2xl shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-700"
                >
                  <Bot className="h-5 w-5" />
                  <span className="hidden sm:inline">Ask Dr. Chem about this topic</span>
                  <span className="sm:hidden">Ask Dr. Chem</span>
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}
    </LibraryShell>
  );
}

/**
 * Tiny markdown renderer — handles #/##/### headings, **bold**, *italic*,
 * `code`, > blockquotes, unordered/ordered lists, and paragraphs.
 * Good enough for short chemistry notes; safe (no raw HTML injection).
 */
function MarkdownLite({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: React.ReactNode[] = [];
  let listBuf: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (!listType || listBuf.length === 0) return;
    const items = listBuf.map((l, i) => (
      <li key={i}>{inline(l)}</li>
    ));
    out.push(
      listType === "ul" ? (
        <ul key={`l${out.length}`}>{items}</ul>
      ) : (
        <ol key={`l${out.length}`}>{items}</ol>
      ),
    );
    listBuf = [];
    listType = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      return;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flushList();
      const level = h[1].length;
      const content = inline(h[2]);
      if (level === 1) out.push(<h1 key={idx}>{content}</h1>);
      else if (level === 2) out.push(<h2 key={idx}>{content}</h2>);
      else out.push(<h3 key={idx}>{content}</h3>);
      return;
    }
    if (line.startsWith("> ")) {
      flushList();
      out.push(<blockquote key={idx}>{inline(line.slice(2))}</blockquote>);
      return;
    }
    const ol = /^\d+\.\s+(.*)$/.exec(line);
    const ul = /^[-*]\s+(.*)$/.exec(line);
    if (ol) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listBuf.push(ol[1]);
      return;
    }
    if (ul) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listBuf.push(ul[1]);
      return;
    }
    flushList();
    out.push(<p key={idx}>{inline(line)}</p>);
  });
  flushList();
  return <>{out}</>;
}

function inline(s: string): React.ReactNode {
  // Tokenize **bold**, *italic*, `code`
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(s)) !== null) {
    if (m.index > lastIdx) tokens.push(s.slice(lastIdx, m.index));
    const t = m[0];
    if (t.startsWith("**")) tokens.push(<strong key={key++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) tokens.push(<code key={key++}>{t.slice(1, -1)}</code>);
    else tokens.push(<em key={key++}>{t.slice(1, -1)}</em>);
    lastIdx = m.index + t.length;
  }
  if (lastIdx < s.length) tokens.push(s.slice(lastIdx));
  return tokens;
}
