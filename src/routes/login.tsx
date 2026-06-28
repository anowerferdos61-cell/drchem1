import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast, Toaster } from "sonner";
import { FlaskConical, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
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
