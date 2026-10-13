import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast, Toaster } from "sonner";
import { AlertCircle, Eye, EyeOff, FlaskConical, Loader2, Lock, User } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { normalizeBdPhone, syntheticAuthEmailForPhone } from "@/lib/phone";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,

  head: () => ({
    meta: [
      { title: "লগইন · Dr. Chem" },
      {
        name: "description",
        content:
          "Log in to Dr. Chem with your phone number or email to continue virtual chemistry experiments, AI tutoring and viva practice for Class 9-10.",
      },
      { property: "og:title", content: "লগইন · Dr. Chem" },
      {
        property: "og:description",
        content:
          "Log in to your Dr. Chem account with phone or email to continue learning chemistry with the virtual lab and AI tutor.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://drchemedu.com/login" },
    ],
    links: [{ rel: "canonical", href: "https://drchemedu.com/login" }],
  }),
});

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** Resolve any user-entered identifier (phone or email) into the auth email. */
async function resolveAuthEmail(identifier: string): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  // Looks like an email → use as-is.
  if (trimmed.includes("@")) return trimmed.toLowerCase();

  // Otherwise treat as a BD phone number.
  const normalized = normalizeBdPhone(trimmed);
  if (!normalized) return null;

  // First try the synthetic email (legacy phone-only signups).
  const synthetic = syntheticAuthEmailForPhone(normalized);

  // Then look up in profiles for accounts where user provided a real email.
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: string | null; error: { message: string } | null }>
  )("get_auth_email_by_phone", { _phone: normalized });
  if (error) {
    console.warn("phone lookup failed", error);
    return synthetic;
  }
  return data ?? synthetic;
}

function LoginPage() {
  const navigate = useNavigate();
  const { redirect = "/app" } = useSearch({ from: "/login" });
  const { isAuthenticated, loading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ identifier?: boolean; password?: boolean }>({});

  useEffect(() => {
    if (!loading && isAuthenticated) {
      void navigate({ to: redirect, replace: true });
    }
  }, [loading, isAuthenticated, navigate, redirect]);

  const validate = () => {
    const errs: { identifier?: string; password?: string } = {};
    const idTrimmed = identifier.trim();

    if (!idTrimmed) {
      errs.identifier = "ফোন নম্বর বা ইমেইল ঠিকানা দিন";
    } else if (idTrimmed.includes("@")) {
      if (!EMAIL_REGEX.test(idTrimmed)) {
        errs.identifier = "সঠিক ইমেইল ফরম্যাট দিন (যেমন: you@example.com)";
      }
    } else {
      const normalized = normalizeBdPhone(idTrimmed);
      if (!normalized) {
        errs.identifier = "সঠিক ১১ ডিজিটের ফোন নম্বর দিন (যেমন: 01XXXXXXXXX)";
      }
    }

    if (!password) {
      errs.password = "পাসওয়ার্ড দিন";
    } else if (password.length < 6) {
      errs.password = "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে";
    }

    return errs;
  };

  const handleBlur = (field: "identifier" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ identifier: true, password: true });

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      const first = Object.values(validationErrors)[0];
      toast.error(first || "সঠিক তথ্য দিন");
      return;
    }

    setSubmitting(true);
    const authEmail = await resolveAuthEmail(identifier);
    if (!authEmail) {
      setSubmitting(false);
      setErrors((prev) => ({
        ...prev,
        identifier: "সঠিক ফোন নাম্বার বা ইমেইল দিন",
      }));
      toast.error("সঠিক ফোন নাম্বার বা ইমেইল দিন");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });
    setSubmitting(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
        toast.error("ফোন/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়");
      } else {
        toast.error(error.message || "লগইন করতে সমস্যা হয়েছে");
      }
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
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-sm">
            <FlaskConical className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Dr. Chem</span>
        </Link>
        <h1 className="text-2xl font-bold text-center mb-1">আবার স্বাগতম 👋</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          ভার্চুয়াল কেমিস্ট্রি ল্যাবে লগইন করুন
        </p>

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="identifier" className="flex items-center gap-1.5 text-xs font-semibold mb-1">
              <User className="h-3.5 w-3.5 text-primary" />
              ফোন নাম্বার বা ইমেইল <span className="text-destructive">*</span>
            </Label>
            <Input
              id="identifier"
              required
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (touched.identifier) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    if (e.target.value.trim()) delete next.identifier;
                    return next;
                  });
                }
              }}
              onBlur={() => handleBlur("identifier")}
              placeholder="01XXXXXXXXX অথবা you@example.com"
              autoComplete="username"
              className={cn(
                touched.identifier && errors.identifier && "border-destructive focus-visible:ring-destructive",
              )}
            />
            {touched.identifier && errors.identifier && (
              <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.identifier}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="password" className="flex items-center gap-1.5 text-xs font-semibold">
                <Lock className="h-3.5 w-3.5 text-primary" />
                পাসওয়ার্ড <span className="text-destructive">*</span>
              </Label>
              <Link to="/reset-password" className="text-xs text-primary font-medium hover:underline">
                ভুলে গেছেন?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password && e.target.value.length >= 6) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.password;
                      return next;
                    });
                  }
                }}
                onBlur={() => handleBlur("password")}
                placeholder="••••••••"
                autoComplete="current-password"
                className={cn(
                  "pr-10",
                  touched.password && errors.password && "border-destructive focus-visible:ring-destructive",
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
            {touched.password && errors.password && (
              <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.password}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full mt-2 cursor-pointer font-semibold shadow-md"
            size="lg"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                লগইন হচ্ছে…
              </>
            ) : (
              "লগইন করুন"
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          পাসওয়ার্ড রিসেট লিংকের জন্য সঠিক ইমেইল প্রয়োজন।
        </p>

        <p className="text-sm text-center mt-6 text-muted-foreground">
          নতুন এখানে?{" "}
          <Link to="/signup" className="text-primary font-semibold hover:underline">
            সাইনআপ করুন
          </Link>
        </p>
      </div>
    </div>
  );
}
