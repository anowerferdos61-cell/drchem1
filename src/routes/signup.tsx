import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast, Toaster } from "sonner";
import {
  Eye,
  EyeOff,
  FlaskConical,
  GraduationCap,
  Loader2,
  UserCog,
  Phone,
  Mail,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { normalizeBdPhone, syntheticAuthEmailForPhone } from "@/lib/phone";

export const Route = createFileRoute("/signup")({
  component: SignupPage,

  head: () => ({
    meta: [
      { title: "সাইনআপ · Dr. Chem" },
      {
        name: "description",
        content:
          "Create a free Dr. Chem account with your phone number to start virtual chemistry experiments, AI tutoring and viva practice for Class 9-10.",
      },
      { property: "og:title", content: "সাইনআপ · Dr. Chem" },
      {
        property: "og:description",
        content:
          "Sign up free for Dr. Chem — virtual chemistry lab, AI tutor and viva practice for Class 9-10 students and teachers.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://drchemedu.com/signup" },
    ],
    links: [{ rel: "canonical", href: "https://drchemedu.com/signup" }],
  }),
});

function SignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  const [role, setRole] = useState<"student" | "teacher" | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [school, setSchool] = useState("");
  const [klass, setKlass] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      void navigate({ to: "/app", replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!role) {
      toast.error("আগে শিক্ষার্থী বা শিক্ষক রোল সিলেক্ট করুন");
      return;
    }
    const normalizedPhone = normalizeBdPhone(phone);
    if (!normalizedPhone) {
      toast.error("সঠিক ফোন নাম্বার দিন (যেমন: 01XXXXXXXXX)");
      return;
    }
    if (password.length < 6) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }
    setSubmitting(true);

    // If user provided a real email use it; otherwise use a synthetic email
    // derived from the phone so Supabase auth (which requires an email) works.
    const trimmedEmail = email.trim();
    const authEmail = trimmedEmail || syntheticAuthEmailForPhone(normalizedPhone);

    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: {
          display_name: displayName,
          school,
          class: klass,
          role,
          phone: normalizedPhone,
        },
      },
    });
    setSubmitting(false);

    if (error) {
      const msg = error.message?.toLowerCase() ?? "";
      if (msg.includes("already") || msg.includes("registered")) {
        toast.error("এই ফোন/ইমেইলে অ্যাকাউন্ট আছে। লগইন করুন।");
      } else {
        toast.error(error.message);
      }
      return;
    }

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });
      if (signInError) {
        toast.success("অ্যাকাউন্ট তৈরি হয়েছে। এখন লগইন করুন।");
        navigate({ to: "/login" });
        return;
      }
    }

    toast.success("অ্যাকাউন্ট তৈরি হয়েছে — স্বাগতম!");
    navigate({ to: "/app", replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-10">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <FlaskConical className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Dr. Chem</span>
        </Link>
        <h1 className="text-2xl font-bold text-center mb-1">নতুন অ্যাকাউন্ট</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          ফ্রি সাইনআপ করে ভার্চুয়াল ল্যাবে শুরু করুন
        </p>

        <Label className="mb-2 block">আপনি কে?</Label>
        <div className="grid grid-cols-2 gap-2 mb-5">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors",
              role === "student"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/40",
            )}
          >
            <GraduationCap className="h-5 w-5" />
            <span className="text-sm font-medium">শিক্ষার্থী</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("teacher")}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors",
              role === "teacher"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/40",
            )}
          >
            <UserCog className="h-5 w-5" />
            <span className="text-sm font-medium">শিক্ষক</span>
          </button>
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          <div>
            <Label htmlFor="name">নাম</Label>
            <Input
              id="name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="তোমার নাম"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="school">স্কুল</Label>
              <Input
                id="school"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder={role === "teacher" ? "প্রতিষ্ঠান" : "স্কুলের নাম"}
              />
            </div>
            <div>
              <Label htmlFor="class">ক্লাস</Label>
              <Input
                id="class"
                value={klass}
                onChange={(e) => setKlass(e.target.value)}
                placeholder={role === "teacher" ? "যে ক্লাস পড়ান" : "৯ / ১০"}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone" className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> ফোন নাম্বার <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              required
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              বাংলাদেশের ১১ ডিজিটের নাম্বার (যেমন: 01712345678)
            </p>
          </div>
          <div>
            <Label htmlFor="email" className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> ইমেইল{" "}
              <span className="text-muted-foreground text-xs">(না দিলেও চলবে)</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">পাসওয়ার্ড</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষর"
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "পাসওয়ার্ড লুকাও" : "পাসওয়ার্ড দেখাও"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !role}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "অ্যাকাউন্ট তৈরি করো"}
          </Button>
        </form>

        <p className="text-sm text-center mt-6 text-muted-foreground">
          আগে থেকেই আছে?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            লগইন করুন
          </Link>
        </p>
      </div>
    </div>
  );
}
