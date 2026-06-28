import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast, Toaster } from "sonner";
import { FlaskConical, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/app",
  }),
  component: LoginPage,

  head: () => ({
    meta: [
      { title: "লগইন · Dr. Chem" },
      {
        name: "description",
        content:
          "Log in to Dr. Chem to continue your virtual chemistry experiments, AI tutoring sessions and viva practice for Class 9-10.",
      },
      { property: "og:title", content: "লগইন · Dr. Chem" },
      {
        property: "og:description",
        content:
          "Log in to your Dr. Chem account to continue learning chemistry with the virtual lab and AI tutor.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://drchem.lovable.app/login" },
    ],
    links: [{ rel: "canonical", href: "https://drchem.lovable.app/login" }],
  }),

});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const { isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      void navigate({ to: redirect, replace: true });
    }
  }, [loading, isAuthenticated, navigate, redirect]);

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("স্বাগতম!");
    navigate({ to: redirect, replace: true });
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + redirect,
    });
    if (result.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <FlaskConical className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Dr. Chem</span>
        </Link>
        <h1 className="text-2xl font-bold text-center mb-1">আবার স্বাগতম 👋</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          ভার্চুয়াল কেমিস্ট্রি ল্যাবে লগইন করুন
        </p>

        <Button
          type="button"
          variant="outline"
          className="w-full mb-4"
          onClick={handleGoogle}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.48-1.12 2.74-2.39 3.58v2.98h3.85c2.25-2.07 3.59-5.12 3.59-8.8z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.93l-3.85-2.98c-1.07.72-2.45 1.15-4.08 1.15-3.13 0-5.79-2.11-6.74-4.96H1.29v3.09C3.25 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.26 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.63H1.29A11.99 11.99 0 0 0 0 12c0 1.94.46 3.78 1.29 5.37l3.97-3.09z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.29 6.63l3.97 3.09C6.21 6.86 8.87 4.75 12 4.75z"
            />
          </svg>
          Google দিয়ে লগইন
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">অথবা</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-3">
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
            <div className="flex justify-between">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Link
                to="/reset-password"
                className="text-xs text-primary hover:underline"
              >
                ভুলে গেছেন?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "লগইন"}
          </Button>
        </form>

        <p className="text-sm text-center mt-6 text-muted-foreground">
          নতুন এখানে?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            সাইনআপ করুন
          </Link>
        </p>
      </div>
    </div>
  );
}
