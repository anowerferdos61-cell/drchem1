import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast, Toaster } from "sonner";
import { FlaskConical, GraduationCap, Loader2, UserCog } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  component: SignupPage,

  head: () => ({
    meta: [
      { title: "সাইনআপ · Dr. Chem" },
      {
        name: "description",
        content:
          "Create a free Dr. Chem account to start running virtual chemistry experiments, chatting with the AI tutor and practicing viva for Class 9-10.",
      },
      { property: "og:title", content: "সাইনআপ · Dr. Chem" },
      {
        property: "og:description",
        content:
          "Sign up free for Dr. Chem — virtual chemistry lab, AI tutor and viva practice for Class 9-10 students and teachers.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://drchem.lovable.app/signup" },
    ],
    links: [{ rel: "canonical", href: "https://drchem.lovable.app/signup" }],
  }),

});

function SignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  const [role, setRole] = useState<"student" | "teacher" | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [school, setSchool] = useState("");
  const [klass, setKlass] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    if (password.length < 6) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: {
          display_name: displayName,
          school,
          class: klass,
          role,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        toast.success("অ্যাকাউন্ট তৈরি হয়েছে। এখন একই ইমেইল-পাসওয়ার্ড দিয়ে লগইন করুন।");
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
            <Label htmlFor="email">ইমেইল</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">পাসওয়ার্ড</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="কমপক্ষে ৬ অক্ষর"
            />
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
