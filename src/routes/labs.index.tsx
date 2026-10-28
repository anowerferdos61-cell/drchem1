import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  FlaskConical,
  Search,
  Sparkles,
  ArrowRight,
  BookOpen,
  Atom,
  GraduationCap,
  Beaker,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LAB_TOPICS } from "@/lib/lab-topics";
import { DrChemLogo } from "@/components/brand/DrChemLogo";
import UserMenu from "@/components/auth/UserMenu";

export const Route = createFileRoute("/labs/")({
  component: LabsIndexPage,
  head: () => ({
    meta: [
      {
        title: "ভার্চুয়াল কেমিস্ট্রি ল্যাব ও থিওরি লাইব্রেরি (Class 9-10) · Dr. Chem",
      },
      {
        name: "description",
        content:
          "NCTB ৯ম-১০ম শ্রেণির রসায়নের সকল ব্যবহারিক ল্যাব, মূল তত্ত্ব, রাসায়নিক সমীকরণ, চিত্র ও ভাইভা প্রস্তুতি। সম্পূর্ণ ইন্টারঅ্যাক্টিভ ভার্চুয়াল ল্যাব।",
      },
      {
        name: "keywords",
        content:
          "ভার্চুয়াল কেমিস্ট্রি ল্যাব, SSC রসায়ন প্র্যাকটিক্যাল তালিকা, ৯ম ১০ম শ্রেণি রসায়ন ল্যাব, NCTB Chemistry Experiments, Dr Chem Labs, রসায়ন ব্যবহারিক পরীক্ষা",
      },
      { name: "geo.region", content: "BD" },
      { name: "geo.placename", content: "Dhaka, Bangladesh" },
      { property: "og:site_name", content: "Dr. Chem" },
      { property: "og:locale", content: "bn_BD" },
      {
        property: "og:title",
        content: "ভার্চুয়াল কেমিস্ট্রি ল্যাব ও থিওরি লাইব্রেরি (Class 9-10) · Dr. Chem",
      },
      {
        property: "og:description",
        content:
          "NCTB সিলেবাস অনুযায়ী রসায়নের সকল এক্সপেরিমেন্ট ও থিওরি — ব্রাউজারেই ঝুঁকিমুক্ত ভার্চুয়াল প্র্যাকটিক্যাল ল্যাব।",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://drchemedu.com/labs" },
    ],
    links: [{ rel: "canonical", href: "https://drchemedu.com/labs" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Dr. Chem Virtual Chemistry Lab & Theory Library",
          url: "https://drchemedu.com/labs",
          description:
            "Complete directory of NCTB Class 9-10 chemistry practical experiments and theory references.",
          mainEntity: {
            "@type": "ItemList",
            itemListElement: LAB_TOPICS.map((topic, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: topic.titleBn,
              url: `https://drchemedu.com/labs/${topic.slug}`,
            })),
          },
        }),
      },
    ],
  }),
});

function LabsIndexPage() {
  const [search, setSearch] = useState("");
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  const chapters = useMemo(() => {
    const map = new Map<number, string>();
    for (const t of LAB_TOPICS) {
      if (!map.has(t.chapterNumber)) {
        map.set(t.chapterNumber, t.chapterNameBn);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, []);

  const filteredTopics = useMemo(() => {
    const q = search.trim().toLowerCase();
    return LAB_TOPICS.filter((topic) => {
      const matchesChapter = selectedChapter === null || topic.chapterNumber === selectedChapter;
      if (!matchesChapter) return false;
      if (!q) return true;
      return (
        topic.titleBn.toLowerCase().includes(q) ||
        topic.titleEn.toLowerCase().includes(q) ||
        topic.keywords.some((k) => k.toLowerCase().includes(q)) ||
        topic.theoryBn.toLowerCase().includes(q)
      );
    });
  }, [search, selectedChapter]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navbar */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <DrChemLogo size="sm" showText />
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/chapters">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs sm:text-sm">
                <BookOpen className="h-4 w-4 text-primary" />
                অধ্যায় গাইড
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                প্রাইসিং
              </Button>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-primary/10 via-background to-background py-12 px-4 border-b">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <Badge
            variant="outline"
            className="px-3 py-1 bg-primary/10 text-primary border-primary/20"
          >
            🧪 NCTB ৯ম-১০ম শ্রেণি (SSC) রসায়ন কারিকুলাম
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            ভার্চুয়াল কেমিস্ট্রি ল্যাব ও থিওরি লাইব্রেরি
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            পরীক্ষার জন্য প্রয়োজনীয় সকল প্র্যাকটিক্যাল ল্যাব, মূল তত্ত্ব, রাসায়নিক সমীকরণ ও ভাইভা
            প্রশ্নোত্তর এক জায়গায় শিখুন এবং সরাসরি ব্রাউজারে ল্যাব পরীক্ষাটি সম্পন্ন করুন।
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto pt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="যেকোনো টপিক বা বিক্রিয়া খুঁজুন (যেমন: অক্সিজেন, ড্যানিয়েল সেল, টাইট্রেশন, pH)..."
              className="pl-12 pr-4 h-12 rounded-2xl bg-card shadow-sm text-base border-primary/20 focus-visible:ring-primary"
            />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        {/* Chapter Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Button
            variant={selectedChapter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedChapter(null)}
            className="rounded-full text-xs font-semibold shrink-0 cursor-pointer"
          >
            সকল অধ্যায় ({LAB_TOPICS.length})
          </Button>
          {chapters.map(([num, name]) => (
            <Button
              key={num}
              variant={selectedChapter === num ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedChapter(num)}
              className="rounded-full text-xs font-medium shrink-0 cursor-pointer"
            >
              অধ্যায় {num}: {name}
            </Button>
          ))}
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-3">
          <span>{filteredTopics.length} টি ল্যাব এক্সপেরিমেন্ট ও থিওরি টপিক পাওয়া গেছে</span>
          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="h-7 text-xs">
              সার্চ মুছুন
            </Button>
          )}
        </div>

        {/* Lab Topic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => (
            <Card
              key={topic.id}
              className="group overflow-hidden border border-border/80 hover:border-primary/50 transition-all hover:shadow-xl flex flex-col bg-card"
            >
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Link
                      to="/chapters/$chapterNumber"
                      params={{ chapterNumber: String(topic.chapterNumber) }}
                      className="hover:opacity-85 transition-opacity"
                    >
                      <Badge variant="secondary" className="text-[11px] font-medium cursor-pointer">
                        অধ্যায় {topic.chapterNumber}: {topic.chapterNameBn}
                      </Badge>
                    </Link>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> ল্যাব সিমুলেটর
                    </span>
                  </div>

                  <Link to="/labs/$labId" params={{ labId: topic.slug }}>
                    <h2 className="text-xl font-bold group-hover:text-primary transition-colors leading-snug cursor-pointer">
                      {topic.titleBn}
                    </h2>
                  </Link>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{topic.titleEn}</p>

                  <p className="text-sm text-muted-foreground mt-3 line-clamp-3 leading-relaxed">
                    {topic.objectiveBn}
                  </p>
                </div>

                {topic.equationKaTeX && (
                  <div className="bg-muted/40 p-2.5 rounded-lg border text-xs font-mono text-center text-primary/90 truncate">
                    <code>
                      {topic.equationKaTeX
                        .replace(/\\\\rightarrow/g, "→")
                        .replace(/\\\\uparrow/g, "↑")}
                    </code>
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted/20 border-t flex items-center justify-between gap-3">
                <Link
                  to="/labs/$labId"
                  params={{ labId: topic.slug }}
                  className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
                >
                  <BookOpen className="h-3.5 w-3.5" /> তত্ত্ব ও সমীকরণ পড়ুন
                </Link>
                <Link to="/app" className="shrink-0">
                  <Button size="sm" className="h-8 text-xs font-semibold gap-1">
                    ল্যাব শুরু <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {filteredTopics.length === 0 && (
          <div className="py-20 text-center space-y-3">
            <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">কোনো ল্যাব টপিক পাওয়া যায়নি</h3>
            <p className="text-sm text-muted-foreground">
              বানান ঠিক আছে কিনা পরীক্ষা করুন অথবা ফিল্টার পরিবর্তন করুন।
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedChapter(null);
              }}
            >
              সব ল্যাব দেখুন
            </Button>
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <footer className="border-t bg-muted/30 py-12 px-4 mt-16 text-center space-y-4">
        <h3 className="text-xl font-bold">
          অনলাইনে কেমিস্ট্রি প্র্যাকটিক্যাল ল্যাব প্র্যাকটিস করুন
        </h3>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          ডাঃ কেম প্ল্যাটফর্মে যুক্ত হয়ে আজই ভার্চুয়াল বিকারে বিক্রিয়া পরীক্ষা ও ভাইভা প্র্যাকটিস
          শুরু করুন।
        </p>
        <Link to="/signup">
          <Button size="lg" className="rounded-xl px-8 font-semibold shadow-md">
            ফ্রি অ্যাকাউন্ট তৈরি করুন
          </Button>
        </Link>
      </footer>
    </div>
  );
}
