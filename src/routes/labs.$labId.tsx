import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  FlaskConical,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
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
import { LAB_TOPICS, type LabTopic } from "@/lib/lab-topics";

export const Route = createFileRoute("/labs/$labId")({
  loader: ({ params }) => {
    const topic = LAB_TOPICS.find(
      (t) => t.slug === params.labId || t.id === params.labId,
    );
    if (!topic) {
      throw notFound();
    }
    return { topic };
  },
  head: ({ loaderData }) => {
    const topic = loaderData?.topic;
    if (!topic) return {};

    return {
      meta: [
        { title: topic.metaTitle },
        { name: "description", content: topic.metaDescription },
        { name: "keywords", content: topic.keywords.join(", ") },
        { name: "geo.region", content: "BD" },
        { name: "geo.placename", content: "Dhaka, Bangladesh" },
        { property: "og:site_name", content: "Dr. Chem" },
        { property: "og:locale", content: "bn_BD" },
        { property: "og:title", content: topic.metaTitle },
        { property: "og:description", content: topic.metaDescription },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `https://drchemedu.com/labs/${topic.slug}` },
        {
          property: "og:image",
          content:
            "https://storage.googleapis.com/gpt-engineer-file-uploads/BNbspVP1QLgQXV1xmKzQ4H5W7yJ2/social-images/social-1780481523006-Gemini_Generated_Image_2no3022no3022no3.webp",
        },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: topic.metaTitle },
        { name: "twitter:description", content: topic.metaDescription },
      ],
      links: [{ rel: "canonical", href: `https://drchemedu.com/labs/${topic.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LearningResource",
            name: topic.titleBn,
            alternateName: topic.titleEn,
            description: topic.metaDescription,
            educationalLevel: "Secondary Education (Class 9-10 / SSC)",
            learningResourceType: "Lab Experiment, Practical Theory, Simulation",
            inLanguage: "bn-BD",
            educationalAlignment: {
              "@type": "AlignmentObject",
              alignmentType: "educationalSubject",
              targetName: `Chemistry (NCTB Class 9-10 Chapter ${topic.chapterNumber}: ${topic.chapterNameBn})`,
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
                name: "Labs",
                item: "https://drchemedu.com/labs",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: topic.titleBn,
                item: `https://drchemedu.com/labs/${topic.slug}`,
              },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: topic.vivaQuestions.map((v) => ({
              "@type": "Question",
              name: v.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: v.a,
              },
            })),
          }),
        },
      ],
    };
  },
  component: LabTopicDetailPage,
});

function LabTopicDetailPage() {
  const { topic } = Route.useLoaderData();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("লিঙ্ক কপি হয়েছে!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const relatedTopics = LAB_TOPICS.filter((t) => t.id !== topic.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/labs" className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> ল্যাব তালিকায় ফেরত
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5 h-8 text-xs cursor-pointer">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? "কপি হয়েছে" : "শেয়ার"}
            </Button>
            <Link to="/app">
              <Button size="sm" className="h-8 text-xs font-semibold gap-1">
                <Sparkles className="h-3.5 w-3.5" /> ল্যাব শুরু করো
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:underline">
            হোম
          </Link>
          <span>/</span>
          <Link to="/chapters" className="hover:underline">
            অধ্যায়সমূহ
          </Link>
          <span>/</span>
          <Link
            to="/chapters/$chapterNumber"
            params={{ chapterNumber: String(topic.chapterNumber) }}
            className="hover:underline"
          >
            অধ্যায় {topic.chapterNumber}
          </Link>
          <span>/</span>
          <Link to="/labs" className="hover:underline">
            ল্যাব
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{topic.titleBn}</span>
        </nav>

        {/* Hero Banner Card */}
        <div className="rounded-2xl border p-6 md:p-8 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/chapters/$chapterNumber"
              params={{ chapterNumber: String(topic.chapterNumber) }}
              className="hover:opacity-85 transition-opacity"
            >
              <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary border-primary/20 cursor-pointer">
                অধ্যায় {topic.chapterNumber}: {topic.chapterNameBn} (নোট দেখুন ↗)
              </Badge>
            </Link>
            <Badge variant="secondary" className="text-xs">
              Class 9-10 SSC Chemistry
            </Badge>
          </div>

          <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-snug">
            {topic.titleBn}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-mono">
            {topic.titleEn}
          </p>

          <p className="text-sm md:text-base text-muted-foreground leading-relaxed pt-1">
            {topic.objectiveBn}
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <Link to="/app">
              <Button size="lg" className="rounded-xl font-bold shadow-md gap-2">
                <FlaskConical className="h-5 w-5" />
                সরাসরি ভার্চুয়াল ল্যাবে পরীক্ষাটি করো
              </Button>
            </Link>
            <Link to="/tutor">
              <Button variant="outline" size="lg" className="rounded-xl font-semibold gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI টিউটরের সাহায্য নাও
              </Button>
            </Link>
          </div>
        </div>

        {/* Chemical Equation Box */}
        {topic.equationKaTeX && (
          <Card className="p-5 border-emerald-500/20 bg-emerald-500/5 rounded-xl space-y-2">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> মূল রাসায়নিক সমীকরণ (Reaction Equation)
            </div>
            <div className="text-base md:text-lg font-mono font-bold text-center py-2 text-foreground overflow-x-auto">
              <code>{topic.equationKaTeX.replace(/\\\\rightarrow/g, "→").replace(/\\\\xrightarrow/g, "→").replace(/\\\\uparrow/g, "↑")}</code>
            </div>
          </Card>
        )}

        {/* Section: Theory (মূল তত্ত্ব) */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
            <BookOpen className="h-5 w-5 text-primary" />
            মূল বৈজ্ঞানিক তত্ত্ব (Core Theory)
          </h2>
          <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed text-sm md:text-base bg-card p-6 rounded-xl border">
            {topic.theoryBn}
          </div>
        </section>

        {/* Section: Apparatus & Chemicals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Apparatus */}
          <Card className="p-6 space-y-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              প্রয়োজনীয় যন্ত্রপাতি (Apparatus)
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {topic.apparatusBn.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Chemicals */}
          <Card className="p-6 space-y-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              প্রয়োজনীয় বিকারক ও কেমিক্যালস (Reagents)
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {topic.chemicalsBn.map((chem, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>{chem}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Section: Procedure (কার্যপ্রণালী) */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
            🔬 ধাপে ধাপে কার্যপ্রণালী (Step-by-Step Procedure)
          </h2>
          <div className="space-y-3">
            {topic.procedureBn.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Observation & Conclusion */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
            👁️ পর্যবেক্ষণ ও সিদ্ধান্ত (Observation & Conclusion)
          </h2>
          <Card className="p-6 text-sm md:text-base text-muted-foreground leading-relaxed bg-card">
            {topic.observationBn}
          </Card>
        </section>

        {/* Section: Precautions */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            ল্যাব সতর্কতা (Safety Precautions)
          </h2>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 space-y-2 text-sm text-muted-foreground">
            {topic.precautionsBn.map((pre, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-400">•</span>
                <span>{pre}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Viva Q&A (মৌখিক পরীক্ষার প্রশ্নোত্তর) */}
        <section className="space-y-3">
          <div className="border-b pb-2 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              ব্যবহারিক ভাইভা প্রশ্নোত্তর (Common Viva Q&A)
            </h2>
            <Badge variant="outline" className="text-xs">
              এসএসসি প্র্যাকটিক্যাল ভাইভা
            </Badge>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {topic.vivaQuestions.map((viva, idx) => (
              <AccordionItem
                key={idx}
                value={`viva-${idx}`}
                className="border rounded-xl px-4 bg-card"
              >
                <AccordionTrigger className="text-left font-semibold text-sm md:text-base hover:no-underline">
                  {viva.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed border-t pt-3">
                  {viva.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Related Labs */}
        <section className="space-y-4 pt-6 border-t">
          <h3 className="text-lg font-bold">অন্যান্য গুরুত্বপূর্ণ ল্যাবসমূহ</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTopics.map((rel) => (
              <Link key={rel.id} to="/labs/$labId" params={{ labId: rel.slug }}>
                <Card className="p-4 hover:border-primary/50 transition-all hover:shadow-md cursor-pointer group h-full flex flex-col justify-between">
                  <div>
                    <Badge variant="secondary" className="text-[10px] mb-2">
                      অধ্যায় {rel.chapterNumber}
                    </Badge>
                    <h4 className="font-bold text-sm group-hover:text-primary transition-colors">
                      {rel.titleBn}
                    </h4>
                  </div>
                  <div className="text-xs font-semibold text-primary flex items-center gap-1 mt-3">
                    বিস্তারিত দেখুন <ArrowRight className="h-3 w-3" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Floating CTA Banner */}
      <aside className="border-t bg-card py-10 px-4 mt-16 text-center space-y-4">
        <h3 className="text-2xl font-black">নিজে সরাসরি বিক্রিয়াটি ঘটাতে চাও?</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          ডাঃ কেম ভার্চুয়াল ল্যাবে যেকোনো দুর্ঘটনা ছাড়াই বিকারে কেমিক্যাল মিশিয়ে পরীক্ষা করে দেখো।
        </p>
        <Link to="/app">
          <Button size="lg" className="rounded-xl px-8 font-bold shadow-lg gap-2">
            <FlaskConical className="h-5 w-5" /> ভার্চুয়াল ল্যাব ওপেন করো
          </Button>
        </Link>
      </aside>
    </div>
  );
}
