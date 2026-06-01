import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast, Toaster } from "sonner";
import { FlaskConical, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [{ title: "পাসওয়ার্ড রিসেট · Dr. Chem" }],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  // If user arrived via recovery link, the URL hash contains type=recovery
  const [mode, setMode] = useState<"request" | "set">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash.includes("type=recovery")) setMode("set");
  }, []);

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("রিসেট লিংক ইমেইলে পাঠানো হয়েছে।");
  };

  const handleSet = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে। লগইন করুন।");
    navigate({ to: "/login" });
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
        <h1 className="text-2xl font-bold text-center mb-6">
          {mode === "request" ? "পাসওয়ার্ড রিসেট" : "নতুন পাসওয়ার্ড"}
        </h1>

        {mode === "request" ? (
          <form onSubmit={handleRequest} className="space-y-3">
            <div>
              <Label htmlFor="email">ইমেইল</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "রিসেট লিংক পাঠাও"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSet} className="space-y-3">
            <div>
              <Label htmlFor="newPassword">নতুন পাসওয়ার্ড</Label>
              <Input
                id="newPassword"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "সেট করো"}
            </Button>
          </form>
        )}

        <p className="text-sm text-center mt-6 text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            লগইনে ফেরত যাও
          </Link>
        </p>
      </div>
    </div>
  );
}
