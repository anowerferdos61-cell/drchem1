import { Link } from "@tanstack/react-router";
import {
  HelpCircle,
  UserPlus,
  LogIn,
  FlaskConical,
  Crown,
  Smartphone,
  CreditCard,
  ShieldCheck,
  BookOpen,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: UserPlus,
    title: "১. সাইন আপ করুন",
    desc: "ফ্রি অ্যাকাউন্ট তৈরি করুন — শুধু নাম, ইমেইল ও পাসওয়ার্ড দিলেই হবে।",
    color: "from-emerald-400 to-emerald-600",
  },
  {
    icon: LogIn,
    title: "২. লগইন করুন",
    desc: "একই ইমেইল-পাসওয়ার্ড দিয়ে লগইন করে ড্যাশবোর্ডে প্রবেশ করুন।",
    color: "from-sky-400 to-blue-600",
  },
  {
    icon: FlaskConical,
    title: "৩. ফ্রি ল্যাব ট্রাই করুন",
    desc: "কয়েকটি ফ্রি এক্সপেরিমেন্ট ও AI টিউটর দিয়ে হাতে-কলমে অভিজ্ঞতা নিন।",
    color: "from-indigo-400 to-indigo-600",
  },
  {
    icon: Crown,
    title: "৪. Pro-তে আপগ্রেড করুন",
    desc: "সব ল্যাব, আনলিমিটেড AI চ্যাট ও ভাইভা প্র্যাকটিস আনলক করতে Pricing পেজে যান।",
    color: "from-amber-400 to-orange-500",
  },
  {
    icon: CreditCard,
    title: "৫. বিকাশে পেমেন্ট + রিকোয়েস্ট",
    desc: "নির্দেশনা অনুযায়ী বিকাশ থেকে পেমেন্ট করুন, তারপর যে নাম্বার থেকে পেমেন্ট করেছেন সেই নাম্বার দিয়ে অ্যাপে রিকোয়েস্ট পাঠান — আমরা দ্রুত Pro অ্যাক্টিভ করে দেব।",
    color: "from-rose-400 to-pink-600",
  },
];

const faqs = [
  {
    q: "Dr. Chem আসলে কী?",
    a: "Dr. Chem হচ্ছে Class 9-10-এর জন্য একটি ভার্চুয়াল কেমিস্ট্রি ল্যাব ও AI টিউটর — যেখানে তুমি ব্রাউজারেই ঝুঁকিমুক্তভাবে পরীক্ষণ করতে পারবে, প্রশ্ন করতে পারবে এবং ভাইভা প্র্যাকটিস করতে পারবে।",
  },
  {
    q: "শুরু করতে কী কী লাগবে?",
    a: "শুধু একটি ইমেইল ও ইন্টারনেট সংযোগ। কোনো ইনস্টল করার দরকার নেই — সরাসরি ব্রাউজারেই চলে।",
  },
  {
    q: "Pro-এর সুবিধা কী?",
    a: "Pro-তে সব ৪০+ ভার্চুয়াল ল্যাব আনলক হয়, AI টিউটরের সাথে আনলিমিটেড চ্যাট করা যায়, ভাইভা প্র্যাকটিস ও বিস্তারিত ল্যাব রিপোর্ট পাওয়া যায়। ফ্রি প্ল্যানে কিছু নির্দিষ্ট ল্যাব ও সীমিত চ্যাট থাকে।",
  },
  {
    q: "পেমেন্ট কীভাবে করব?",
    a: "Pricing পেজে গিয়ে প্ল্যান সিলেক্ট করুন। সেখান থেকে বিকাশ নাম্বার ও পরিমাণ দেখানো হবে। বিকাশ থেকে Send Money করে, যে নাম্বার থেকে টাকা পাঠিয়েছেন সেই নাম্বার ও TrxID দিয়ে অ্যাপ থেকেই রিকোয়েস্ট সাবমিট করুন। আমরা যাচাই করে সাধারণত কয়েক ঘণ্টার মধ্যে Pro চালু করে দিই।",
  },
  {
    q: "পেমেন্টের পর কতক্ষণে Pro চালু হয়?",
    a: "সাধারণত ১-৬ ঘণ্টার মধ্যে। যদি বেশি সময় লাগে, drchemhelp247@gmail.com বা 01581-553923-এ যোগাযোগ করুন।",
  },
  {
    q: "মোবাইলে চলবে?",
    a: "হ্যাঁ, মোবাইল ব্রাউজারেও চলবে। তবে ল্যাব এক্সপেরিমেন্টগুলো ট্যাবলেট বা ল্যাপটপের বড় স্ক্রিনে সবচেয়ে ভালো অভিজ্ঞতা দেয়। মোবাইলে ল্যান্ডস্কেপ মোডে ব্যবহার করার পরামর্শ দেওয়া হয়।",
  },
  {
    q: "কোন কোন ক্লাসের জন্য এটা?",
    a: "মূলত Class 9-10 (SSC) NCTB সিলেবাসের জন্য তৈরি। তবে Class 11-12 (HSC) এবং কেমিস্ট্রিতে আগ্রহী যে কেউই ব্যবহার করতে পারবে।",
  },
  {
    q: "AI টিউটর কি বাংলায় উত্তর দেয়?",
    a: "হ্যাঁ, বাংলায় এবং ইংরেজিতে দুই ভাষাতেই। প্রশ্ন যেভাবে করবেন সেই ভাষায়ই উত্তর পাবেন।",
  },
  {
    q: "পেমেন্ট ফেল হলে বা ভুল নাম্বার দিলে কী করব?",
    a: "চিন্তা নেই — 01581-553923 নাম্বারে যোগাযোগ করুন অথবা drchemhelp247@gmail.com-এ ইমেইল করুন। TrxID ও পেমেন্ট নাম্বার জানালেই আমরা ঠিক করে দেব।",
  },
  {
    q: "টাকা রিফান্ড পাওয়া যাবে?",
    a: "যদি টেকনিক্যাল সমস্যার কারণে সার্ভিস ব্যবহার করতে না পারেন, আমাদের সাথে যোগাযোগ করলে সাবস্ক্রিপশনের বাকি অংশ রিফান্ড বা এক্সটেন্ড করে দেওয়া হবে।",
  },
  {
    q: "শিক্ষক হিসেবে ক্লাসে ব্যবহার করা যাবে?",
    a: 'অবশ্যই। সাইনআপের সময় "শিক্ষক" রোল সিলেক্ট করুন। প্রজেক্টরে চালিয়ে সরাসরি ক্লাসে এক্সপেরিমেন্ট দেখাতে পারবেন এবং ছাত্রদের জন্য ভাইভা প্র্যাকটিস সেট করতে পারবেন।',
  },
  {
    q: "ডেটা কি নিরাপদ?",
    a: "হ্যাঁ। আপনার তথ্য এনক্রিপ্টেড ভাবে সংরক্ষিত হয় এবং তৃতীয় পক্ষের সাথে শেয়ার করা হয় না।",
  },
];

export function FaqSection() {
  return (
    <section
      id="faq"
      className="relative py-20 md:py-28 bg-gradient-to-b from-background via-primary/5 to-background overflow-hidden"
    >
      <div className="absolute top-40 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 -right-20 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
            <HelpCircle className="h-3.5 w-3.5" /> Guide & FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">কীভাবে শুরু করব?</h2>
          <p className="mt-4 text-muted-foreground text-lg">
            মাত্র ৫টি ধাপে Dr. Chem-এর সব ফিচার আনলক করুন — সাথে আছে সাধারণ প্রশ্নের উত্তর।
          </p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-16">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-border bg-card p-5 hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div
                className={`h-11 w-11 rounded-xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center mb-3 shadow-md`}
              >
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm leading-snug">{step.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              {i < steps.length - 1 && (
                <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="rounded-3xl border border-border bg-card/50 backdrop-blur p-6 md:p-10 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-blue-500 text-primary-foreground flex items-center justify-center shadow-md">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight">সাধারণ প্রশ্ন</h3>
              <p className="text-sm text-muted-foreground">যা জানতে চান — সব একসাথে</p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-semibold hover:text-primary">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 p-5 border border-primary/20">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
              <p className="text-sm">
                <strong>আরও প্রশ্ন?</strong> ইমেইল করুন{" "}
                <a
                  href="mailto:drchemhelp247@gmail.com"
                  className="text-primary underline underline-offset-2"
                >
                  drchemhelp247@gmail.com
                </a>{" "}
                বা কল করুন <strong>01581-553923</strong>
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link to="/signup">
                <Sparkles className="h-4 w-4" /> ফ্রি সাইনআপ
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Reusable eye-catching Guide/FAQ button — animated gradient + ping dot */
export function GuideFaqButton({
  className = "",
  label = "Guide & FAQ",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <a
      href="#faq"
      className={`group relative inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 bg-[length:200%_100%] bg-left hover:bg-right transition-[background-position] duration-700 hover:shadow-xl hover:shadow-orange-500/40 ${className}`}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
      </span>
      <HelpCircle className="h-4 w-4" />
      {label}
      <Smartphone className="h-3.5 w-3.5 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
    </a>
  );
}
