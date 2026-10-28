import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast, Toaster } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  FlaskConical,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { DrChemLogo } from "@/components/brand/DrChemLogo";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "পাসওয়ার্ড রিসেট · Dr. Chem" },
      {
        name: "description",
        content:
          "Reset your Dr. Chem account password to regain access to the virtual chemistry lab and AI tutor for Class 9-10.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function ResetPasswordPage() {
  const navigate = useNavigate();
  // If user arrived via recovery link, the URL hash contains type=recovery
  const [mode, setMode] = useState<"request" | "set">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash.includes("type=recovery")) setMode("set");
  }, []);

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setEmailError("ইমেইল দেওয়া বাধ্যতামূলক");
      toast.error("ইমেইল ঠিকানা দিন");
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError("সঠিক ইমেইল ফরম্যাট দিন (যেমন: you@example.com)");
      toast.error("সঠিক ইমেইল ঠিকানা দিন");
      return;
    }
    setEmailError("");

    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "রিসেট লিংক পাঠাতে সমস্যা হয়েছে");
      return;
    }
    toast.success("পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে!");
  };

  const handleSet = async (e: FormEvent) => {
    e.preventDefault();
    let hasErr = false;

    if (!password) {
      setPasswordError("নতুন পাসওয়ার্ড দিন");
      hasErr = true;
    } else if (password.length < 6) {
      setPasswordError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      hasErr = true;
    } else {
      setPasswordError("");
    }

    if (!confirmPassword) {
      setConfirmPasswordError("পাসওয়ার্ড নিশ্চিত করুন");
      hasErr = true;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError("পাসওয়ার্ড দুটি মিলছে না");
      hasErr = true;
    } else {
      setConfirmPasswordError("");
    }

    if (hasErr) {
      toast.error("পাসওয়ার্ড সঠিকভাবে দিন");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে");
      return;
    }
    toast.success("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! এবার লগইন করুন।");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <DrChemLogo size="md" showText />
        </Link>
        <h1 className="text-2xl font-bold text-center mb-1">
          {mode === "request" ? "পাসওয়ার্ড রিসেট" : "নতুন পাসওয়ার্ড সেট করুন"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {mode === "request"
            ? "আপনার অ্যাকাউন্টের নিবন্ধিত ইমেইল ঠিকানা দিন"
            : "আপনার অ্যাকাউন্টের জন্য নতুন একটি পাসওয়ার্ড দিন"}
        </p>

        {mode === "request" ? (
          <form onSubmit={handleRequest} className="space-y-4" noValidate>
            <div>
              <Label
                htmlFor="email"
                className="flex items-center gap-1.5 text-xs font-semibold mb-1"
              >
                <Mail className="h-3.5 w-3.5 text-primary" />
                ইমেইল ঠিকানা <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError && EMAIL_REGEX.test(e.target.value.trim())) {
                    setEmailError("");
                  }
                }}
                placeholder="yourname@example.com"
                autoComplete="email"
                className={cn(emailError && "border-destructive focus-visible:ring-destructive")}
              />
              {emailError && (
                <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {emailError}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full cursor-pointer font-semibold"
              size="lg"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  রিসেট লিংক পাঠানো হচ্ছে…
                </>
              ) : (
                "রিসেট লিংক পাঠাও"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSet} className="space-y-4" noValidate>
            <div>
              <Label
                htmlFor="newPassword"
                className="flex items-center gap-1.5 text-xs font-semibold mb-1"
              >
                <Lock className="h-3.5 w-3.5 text-primary" />
                নতুন পাসওয়ার্ড <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError && e.target.value.length >= 6) setPasswordError("");
                  }}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  className={cn(
                    "pr-10",
                    passwordError && "border-destructive focus-visible:ring-destructive",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {passwordError}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="confirmNewPassword"
                className="flex items-center gap-1.5 text-xs font-semibold mb-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                পাসওয়ার্ড নিশ্চিত করুন <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmNewPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError && e.target.value === password)
                      setConfirmPasswordError("");
                  }}
                  placeholder="একই পাসওয়ার্ড পুনরায় দিন"
                  className={cn(
                    "pr-10",
                    confirmPasswordError && "border-destructive focus-visible:ring-destructive",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {confirmPasswordError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full cursor-pointer font-semibold"
              size="lg"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  সংরক্ষণ করা হচ্ছে…
                </>
              ) : (
                "নতুন পাসওয়ার্ড সংরক্ষণ করুন"
              )}
            </Button>
          </form>
        )}

        <p className="text-sm text-center mt-6 text-muted-foreground">
          <Link to="/login" className="text-primary font-medium hover:underline">
            লগইন পেজে ফেরত যান
          </Link>
        </p>
      </div>
    </div>
  );
}
