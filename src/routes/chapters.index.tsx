import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  BookOpen,
  FlaskConical,
  Search,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Atom,
  CheckCircle2,
  ChevronRight,
  Calculator,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CHAPTER_TOPICS } from "@/lib/chapter-topics";
import { LAB_TOPICS } from "@/lib/lab-topics";
import { DrChemLogo } from "@/components/brand/DrChemLogo";
import UserMenu from "@/components/auth/UserMenu";

export const Route = createFileRoute("/chapters/")({
  component: ChaptersIndexPage,
  head: () => ({
    meta: [
      {
        title: "এসএসসি রসায়ন অধ্যায়ভিত্তিক নোট ও ল্যাব গাইড (Class 9-10) · Dr. Chem",
      },
      {
        name: "description",
        content:
          "NCTB ৯ম-১০ম শ্রেণির রসায়নের ১ থেকে ১২ অধ্যায়ের পূর্ণাঙ্গ অধ্যায়ভিত্তিক নোট, গুরুত্বপূর্ণ সূত্রাবলী, বোর্ড পরীক্ষার প্রস্তুতি ও ইন্টারঅ্যাক্টিভ ভার্চুয়াল ল্যাব।",
      },
      {
        name: "keywords",
        content:
          "এসএসসি রসায়ন অধ্যায় ১ থেকে ১২ নোট, Class 9 10 Chemistry All Chapters Notes, SSC Chemistry Chapter Wise Notes, NCTB Chemistry Syllabus, ডক্টর কেম অধ্যায় গাইড",
      },
      { name: "geo.region", content: "BD" },
      { name: "geo.placename", content: "Dhaka, Bangladesh" },
      { property: "og:site_name", content: "Dr. Chem" },
      { property: "og:locale", content: "bn_BD" },
      {
        property: "og:title",
        content: "এসএসসি রসায়ন অধ্যায়ভিত্তিক নোট ও ল্যাব গাইড (Class 9-10) · Dr. Chem",
      },
      {
        property: "og:description",
        content:
          "NCTB সিলেবাস অনুযায়ী রসায়নের সকল অধ্যায়ের থিওরি, সূত্র, বোর্ড পরীক্ষার টিপস এবং ভার্চুয়াল ল্যাব এক্সপেরিমেন্ট এক প্ল্যাটফর্মে।",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://drchemedu.com/chapters" },
    ],
    links: [{ rel: "canonical", href: "https://drchemedu.com/chapters" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Dr. Chem SSC Chemistry Chapters & Lab Directory",
          url: "https://drchemedu.com/chapters",
          description:
            "Complete directory of NCTB Class 9-10 Chemistry chapters with detailed study notes, exam strategies, and virtual practical experiments.",
          mainEntity: {
            "@type": "ItemList",
            itemListElement: CHAPTER_TOPICS.map((ch, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: `অধ্যায় ${ch.chapterNumber}: ${ch.titleBn} (${ch.titleEn})`,
              url: `https://drchemedu.com/chapters/${ch.chapterNumber}`,
            })),
          },
        }),
      },
    ],
  }),
});

function ChaptersIndexPage() {
  const [search, setSearch] = useState("");

  const filteredChapters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CHAPTER_TOPICS;
    return CHAPTER_TOPICS.filter((ch) => {
      return (
        ch.titleBn.toLowerCase().includes(q) ||
        ch.titleEn.toLowerCase().includes(q) ||
        ch.subtitleBn.toLowerCase().includes(q) ||
        ch.keywords.some((k) => k.toLowerCase().includes(q)) ||
        ch.keyTopics.some((t) => t.titleBn.toLowerCase().includes(q) || t.descriptionBn.toLowerCase().includes(q)) ||
        ch.importantFormulasOrRules.some((f) => f.titleBn.toLowerCase().includes(q))
      );
    });
  }, [search]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navbar */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <DrChemLogo size="sm" showText />
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/labs">
              <Button variant="ghost" size="sm" className="gap-1.5 hidden sm:inline-flex">
                <FlaskConical className="h-4 w-4 text-primary" />
                ল্যাব লাইব্রেরি
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="ghost" size="sm">
                প্রাইসিং
              </Button>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-primary/10 via-background to-background py-14 px-4 border-b">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <Badge variant="outline" className="px-3.5 py-1 bg-primary/10 text-primary border-primary/20 text-xs md:text-sm font-medium">
            <GraduationCap className="h-4 w-4 mr-1.5 inline" /> NCTB ৯ম-১০ম শ্রেণি (SSC) রসায়ন কারিকুলাম
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            অধ্যায়ভিত্তিক রসায়ন নোট ও ল্যাব গাইড
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            রসায়ন বইয়ের ১ থেকে ১২ প্রতিটি অধ্যায়ের মূল কনসেপ্ট, প্রয়োজনীয় সূত্র, বোর্ড পরীক্ষার সৃজনশীল টিপস
            এবং সংশ্লিষ্ট ভার্চুয়াল ল্যাব টেস্ট এক ক্লিকেই আবিষ্কার করুন।
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto pt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="অধ্যায় বা টপিক খুঁজুন (যেমন: পর্যায় সারণি, বন্ধন, মোল, লা-শাতেলিয়ার, সাবান)..."
              className="pl-12 pr-4 h-12 rounded-2xl bg-card shadow-sm text-base border-primary/20 focus-visible:ring-primary"
            />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-10 flex-1 w-full space-y-8">
        {/* Results Counter */}
        <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-3">
          <span>
            মোট {filteredChapters.length} টি অধ্যায় পাওয়া গেছে
          </span>
          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="h-7 text-xs">
              সার্চ রিসেট করুন
            </Button>
          )}
        </div>

        {/* Chapter Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChapters.map((chapter) => {
            const relatedLabs = LAB_TOPICS.filter((t) => chapter.relatedLabSlugs.includes(t.slug));

            return (
              <Card
                key={chapter.chapterNumber}
                className="group relative flex flex-col justify-between overflow-hidden border border-border/80 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card/60 backdrop-blur"
              >
                {/* Header gradient banner */}
                <div className={`h-2.5 w-full bg-gradient-to-r ${chapter.badgeGradient}`} />

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="secondary"
                        className="font-bold text-xs px-2.5 py-0.5 rounded-md"
                      >
                        অধ্যায় {chapter.chapterNumber}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {chapter.classLevel}
                      </span>
                    </div>

                    <div>
                      <Link
                        to="/chapters/$chapterNumber"
                        params={{ chapterNumber: String(chapter.chapterNumber) }}
                        className="group-hover:text-primary transition-colors block"
                      >
                        <h2 className="text-xl font-bold tracking-tight">
                          {chapter.titleBn}
                        </h2>
                      </Link>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        {chapter.titleEn}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {chapter.subtitleBn}
                    </p>

                    {/* Key Highlights */}
                    <div className="pt-2 border-t border-border/60 space-y-1.5">
                      <div className="text-[11px] font-semibold text-foreground/80 flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        মূল বিষয়বস্তু:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {chapter.keyTopics.slice(0, 3).map((topic, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40"
                          >
                            {topic.titleBn}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Related Labs Preview */}
                    {relatedLabs.length > 0 && (
                      <div className="pt-2 border-t border-border/60">
                        <div className="text-[11px] font-semibold text-primary flex items-center gap-1.5 mb-1.5">
                          <FlaskConical className="h-3.5 w-3.5" />
                          ব্যবহারিক ল্যাব:
                        </div>
                        <div className="flex flex-col gap-1">
                          {relatedLabs.map((lab) => (
                            <Link
                              key={lab.id}
                              to="/labs/$labId"
                              params={{ labId: lab.slug }}
                              className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center justify-between group/link"
                            >
                              <span className="truncate">🧪 {lab.titleBn}</span>
                              <ChevronRight className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      {chapter.importantFormulasOrRules.length} টি প্রধান সূত্র ও নিয়ম
                    </span>
                    <Link
                      to="/chapters/$chapterNumber"
                      params={{ chapterNumber: String(chapter.chapterNumber) }}
                    >
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        নোট দেখুন
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* CTA Box */}
        <section className="mt-12 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <Sparkles className="h-3.5 w-3.5 mr-1 inline" /> সম্পূর্ণ ঝুঁকিমুক্ত ল্যাব সিমুলেশন
            </Badge>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              থিওরি পড়ার পাশাপাশি ভার্চুয়াল ল্যাবে সরাসরি বিক্রিয়া সম্পাদন করুন!
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Dr. Chem-এ রয়েছে বাংলাদেশের প্রথম ইন্টারেক্টিভ রসায়ন ল্যাবরেটরি। কেমিক্যাল মেশানো, গ্যাস প্রস্তুতি,
              টাইট্রেশন এবং বিদ্যুৎ পরিবাহিতা পরীক্ষা করুন নিজের ব্রাউজার থেকেই।
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link to="/labs">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                ল্যাব লাইব্রেরি দেখুন
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto shadow-md">
                বিনামূল্যে শুরু করুন
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-8 text-center text-xs text-muted-foreground mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} Dr. Chem · Made by{" "}
            <a
              href="https://anowerferdos2nd.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
            >
              ANOWER FERDOS
            </a>
          </p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:underline">হোম</Link>
            <Link to="/chapters" className="hover:underline font-semibold text-primary">অধ্যায়সমূহ</Link>
            <Link to="/labs" className="hover:underline">ল্যাবসমূহ</Link>
            <Link to="/pricing" className="hover:underline">প্রাইসিং</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
