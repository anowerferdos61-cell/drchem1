import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  BookOpen,
  FlaskConical,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Share2,
  Copy,
  Check,
  Calculator,
  Beaker,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CHAPTER_TOPICS, type ChapterTopic } from "@/lib/chapter-topics";
import { LAB_TOPICS } from "@/lib/lab-topics";

export const Route = createFileRoute("/chapters/$chapterNumber")({
  loader: ({ params }) => {
    const chapter = CHAPTER_TOPICS.find(
      (c) =>
        String(c.chapterNumber) === params.chapterNumber ||
        c.slug === params.chapterNumber,
    );
    if (!chapter) {
      throw notFound();
    }
    return { chapter };
  },
  head: ({ loaderData }) => {
    const chapter = loaderData?.chapter;
    if (!chapter) return {};

    return {
      meta: [
        { title: chapter.metaTitle },
        { name: "description", content: chapter.metaDescription },
        { name: "keywords", content: chapter.keywords.join(", ") },
        { name: "geo.region", content: "BD" },
        { name: "geo.placename", content: "Dhaka, Bangladesh" },
        { property: "og:site_name", content: "Dr. Chem" },
        { property: "og:locale", content: "bn_BD" },
        { property: "og:title", content: chapter.metaTitle },
        { property: "og:description", content: chapter.metaDescription },
        { property: "og:type", content: "article" },
        {
          property: "og:url",
          content: `https://drchemedu.com/chapters/${chapter.chapterNumber}`,
        },
        {
          property: "og:image",
          content:
            "https://storage.googleapis.com/gpt-engineer-file-uploads/BNbspVP1QLgQXV1xmKzQ4H5W7yJ2/social-images/social-1780481523006-Gemini_Generated_Image_2no3022no3022no3.webp",
        },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: chapter.metaTitle },
        { name: "twitter:description", content: chapter.metaDescription },
      ],
      links: [
        {
          rel: "canonical",
          href: `https://drchemedu.com/chapters/${chapter.chapterNumber}`,
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LearningResource",
            name: `অধ্যায় ${chapter.chapterNumber}: ${chapter.titleBn}`,
            alternateName: chapter.titleEn,
            description: chapter.metaDescription,
            educationalLevel: "Secondary Education (Class 9-10 / SSC)",
            learningResourceType: "Study Guide, Curriculum Notes, Exam Tips",
            inLanguage: "bn-BD",
            educationalAlignment: {
              "@type": "AlignmentObject",
              alignmentType: "educationalSubject",
              targetName: `Chemistry (NCTB Class 9-10 Chapter ${chapter.chapterNumber}: ${chapter.titleBn})`,
            },
            publisher: {
              "@type": "Organization",
              name: "Dr. Chem",
              url: "https://drchemedu.com",
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://drchemedu.com",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Chapters",
                item: "https://drchemedu.com/chapters",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: `অধ্যায় ${chapter.chapterNumber}: ${chapter.titleBn}`,
                item: `https://drchemedu.com/chapters/${chapter.chapterNumber}`,
              },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: chapter.faqList.map((f) => ({
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
    };
  },
  component: ChapterDetailPage,
});

function ChapterDetailPage() {
  const { chapter } = Route.useLoaderData();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("অধ্যায়ের লিঙ্ক কপি হয়েছে!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const relatedLabs = LAB_TOPICS.filter((t) =>
    chapter.relatedLabSlugs.includes(t.slug),
  );

  const prevChapter =
    chapter.chapterNumber > 1
      ? CHAPTER_TOPICS.find((c) => c.chapterNumber === chapter.chapterNumber - 1)
      : null;

  const nextChapter =
    chapter.chapterNumber < 12
      ? CHAPTER_TOPICS.find((c) => c.chapterNumber === chapter.chapterNumber + 1)
      : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Toaster richColors position="top-center" />

      {/* Top Navbar */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/chapters"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">সকল অধ্যায়ে ফিরে যান</span>
            <span className="sm:hidden">অধ্যায়সমূহ</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 text-xs h-8 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  কপি হয়েছে
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  শেয়ার
                </>
              )}
            </Button>
            <Link to="/signup">
              <Button size="sm" className="text-xs h-8">
                ফ্রি সাইনআপ
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 via-background to-background border-b py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="font-bold text-xs px-2.5 py-1 rounded-md"
            >
              NCTB ৯ম-১০ম শ্রেণি (SSC)
            </Badge>
            <Badge
              variant="outline"
              className="text-xs font-semibold px-2.5 py-1 text-primary border-primary/30"
            >
              অধ্যায় {chapter.chapterNumber}
            </Badge>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            {chapter.titleBn}
          </h1>
          <p className="text-lg md:text-xl font-medium text-muted-foreground">
            {chapter.titleEn}
          </p>
          <p className="text-base text-muted-foreground leading-relaxed pt-2">
            {chapter.subtitleBn}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-4">
            {relatedLabs.length > 0 && (
              <a href="#practical-labs">
                <Button variant="default" size="sm" className="gap-1.5 shadow-sm">
                  <FlaskConical className="h-4 w-4" />
                  সম্পর্কিত ল্যাবসমূহ দেখুন ({relatedLabs.length})
                </Button>
              </a>
            )}
            <a href="#core-topics">
              <Button variant="outline" size="sm" className="gap-1.5">
                <BookOpen className="h-4 w-4" />
                মূল বিষয়বস্তু ও নোট
              </Button>
            </a>
            <a href="#formulas">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Calculator className="h-4 w-4" />
                গুরুত্বপূর্ণ সূত্র ও নিয়ম
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-12 flex-1 w-full">
        {/* Overview & Learning Outcomes */}
        <section className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-card border border-border/80 shadow-sm space-y-6">
            <div className="space-y-3">
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                অধ্যায় পরিচিতি ও সারসংক্ষেপ
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {chapter.overviewBn}
              </p>
            </div>

            <div className="pt-4 border-t border-border/60 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                এই অধ্যায় শেষে শিক্ষার্থীরা যা যা শিখতে পারবে (শিখনফল):
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {chapter.learningOutcomesBn.map((outcome, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/30"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Core Topics */}
        <section id="core-topics" className="space-y-6 scroll-mt-20">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              মূল বিষয়বস্তু ও গুরুত্বপূর্ণ আলোচনা
            </h2>
            <p className="text-sm text-muted-foreground">
              অধ্যায় {chapter.chapterNumber}-এর সবচেয়ে গুরুত্বপূর্ণ টপিক ও পরীক্ষার জন্য জরুরি তথ্যাবলী
            </p>
          </div>

          <div className="space-y-4">
            {chapter.keyTopics.map((topic, index) => (
              <Card
                key={index}
                className="p-6 space-y-4 border border-border/80 bg-card/60 backdrop-blur"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <h3 className="text-lg md:text-xl font-bold">
                      {topic.titleBn}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line pl-8">
                    {topic.descriptionBn}
                  </p>
                </div>

                <div className="ml-8 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs md:text-sm text-foreground flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      বোর্ড পরীক্ষার ফোকাস:{" "}
                    </span>
                    <span className="text-muted-foreground">
                      {topic.keyExamPointBn}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Important Formulas & Equations */}
        <section id="formulas" className="space-y-6 scroll-mt-20">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <Calculator className="h-6 w-6 text-primary" />
              গুরুত্বপূর্ণ সূত্র, নিয়ম ও সমীকরণ
            </h2>
            <p className="text-sm text-muted-foreground">
              গাণিতিক সমস্যা সমাধান এবং সমীকরণ সমতাকরণের জন্য প্রয়োজনীয় সূত্রসমূহ
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {chapter.importantFormulasOrRules.map((item, index) => (
              <Card
                key={index}
                className="p-6 space-y-3 border border-border/80 bg-card/50"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base md:text-lg text-primary">
                    {item.titleBn}
                  </h3>
                  <Badge variant="outline" className="text-[11px] font-mono">
                    নিয়ম / সূত্র
                  </Badge>
                </div>

                <div className="p-4 rounded-xl bg-muted/60 border font-mono text-sm md:text-base text-foreground overflow-x-auto text-center font-semibold">
                  {item.formulaOrRule}
                </div>

                <p className="text-xs md:text-sm text-muted-foreground">
                  💡 <span className="font-semibold text-foreground">ব্যাখ্যা:</span> {item.explanationBn}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Connected Practical Labs */}
        {relatedLabs.length > 0 && (
          <section id="practical-labs" className="space-y-6 scroll-mt-20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  🧪 ব্যবহারিক অংশ
                </Badge>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
                <FlaskConical className="h-6 w-6 text-primary" />
                এই অধ্যায়ের সাথে সম্পর্কিত ভার্চুয়াল ল্যাবসমূহ
              </h2>
              <p className="text-sm text-muted-foreground">
                থিওরি পড়ার পাশাপাশি ভার্চুয়াল ল্যাবে নিজে নিজে এক্সপেরিমেন্ট সম্পন্ন করুন
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedLabs.map((lab) => (
                <Card
                  key={lab.id}
                  className="p-5 flex flex-col justify-between border border-border/80 hover:border-primary/50 transition-all bg-card/60 backdrop-blur group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-[11px]">
                        ল্যাব এক্সপেরিমেন্ট
                      </Badge>
                      {lab.hasInteractiveSimulator && (
                        <span className="text-[11px] font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> সিমুলেটর সক্রিয়
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                      {lab.titleBn}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      {lab.titleEn}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {lab.objectiveBn}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      সমীকরণ, যন্ত্রপাতি ও ভাইভা
                    </span>
                    <Link to="/labs/$labId" params={{ labId: lab.slug }}>
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-8 group-hover:bg-primary group-hover:text-primary-foreground">
                        ল্যাব দেখুন
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Board Exam Tips */}
        <section className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border border-primary/20 space-y-4">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              বোর্ড পরীক্ষার সৃজনশীল ও বহুনির্বাচনী প্রস্তুতির টিপস
            </h2>
            <div className="space-y-2.5">
              {chapter.boardExamTips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-card/70 border border-border/40 text-xs md:text-sm text-foreground"
                >
                  <span className="h-5 w-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              অধ্যায় {chapter.chapterNumber}: সাধারণ জিজ্ঞাসা ও প্রশ্নোত্তর (FAQ)
            </h2>
            <p className="text-sm text-muted-foreground">
              বোর্ড পরীক্ষায় ঘন ঘন আসা অনুধাবনমূলক প্রশ্ন ও তার আদর্শ উত্তর
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-2">
            {chapter.faqList.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border rounded-2xl px-5 bg-card"
              >
                <AccordionTrigger className="text-left font-semibold text-sm md:text-base py-4 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4 pt-1">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Next / Previous Chapter Navigation */}
        <nav aria-label="Chapter navigation" className="border-t pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevChapter ? (
            <Link
              to="/chapters/$chapterNumber"
              params={{ chapterNumber: String(prevChapter.chapterNumber) }}
              className="p-4 rounded-2xl border border-border hover:border-primary/50 bg-card transition-all flex items-center gap-3 group"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              <div className="text-left overflow-hidden">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  পূর্ববর্তী অধ্যায়
                </span>
                <span className="font-bold text-sm truncate block group-hover:text-primary transition-colors">
                  অধ্যায় {prevChapter.chapterNumber}: {prevChapter.titleBn}
                </span>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextChapter ? (
            <Link
              to="/chapters/$chapterNumber"
              params={{ chapterNumber: String(nextChapter.chapterNumber) }}
              className="p-4 rounded-2xl border border-border hover:border-primary/50 bg-card transition-all flex items-center justify-between gap-3 text-right group sm:col-start-2"
            >
              <div className="text-right overflow-hidden w-full">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  পরবর্তী অধ্যায়
                </span>
                <span className="font-bold text-sm truncate block group-hover:text-primary transition-colors">
                  অধ্যায় {nextChapter.chapterNumber}: {nextChapter.titleBn}
                </span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ) : (
            <div />
          )}
        </nav>

        {/* Bottom CTA Box */}
        <section className="rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 md:p-10 text-center space-y-4">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            🚀 রসায়ন শেখার আধুনিক প্ল্যাটফর্ম
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            মুখস্থ না করে নিজে পরীক্ষা করে রসায়ন শিখুন Dr. Chem-এ!
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            বিনামূল্যে সাইনআপ করে ভার্চুয়াল ল্যাবে এক্সপেরিমেন্ট সম্পন্ন করুন এবং বোর্ড পরীক্ষার প্রস্তুতিতে এগিয়ে থাকুন।
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/signup">
              <Button size="lg" className="shadow-md">
                বিনামূল্যে একাউন্ট তৈরি করুন
              </Button>
            </Link>
            <Link to="/chapters">
              <Button variant="outline" size="lg">
                সকল অধ্যায়ের তালিকা দেখুন
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-8 text-center text-xs text-muted-foreground mt-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Dr. Chem · NCTB এসএসসি রসায়ন অধ্যায় গাইড।</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:underline">হোম</Link>
            <Link to="/chapters" className="hover:underline font-semibold text-primary">সকল অধ্যায়</Link>
            <Link to="/labs" className="hover:underline">ল্যাব লাইব্রেরি</Link>
            <Link to="/pricing" className="hover:underline">প্রাইসিং</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
