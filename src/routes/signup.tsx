import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast, Toaster } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  FlaskConical,
  GraduationCap,
  Loader2,
  Mail,
  Lock,
  Phone,
  School,
  User,
  UserCog,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { DrChemLogo } from "@/components/brand/DrChemLogo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { normalizeBdPhone } from "@/lib/phone";

export const Route = createFileRoute("/signup")({
  component: SignupPage,

  head: () => ({
    meta: [
      { title: "সাইনআপ · Dr. Chem" },
      {
        name: "description",
        content:
          "Create a free Dr. Chem account with your email and phone number to start virtual chemistry experiments, AI tutoring and viva practice for Class 9-10.",
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

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

interface FormErrors {
  role?: string;
  displayName?: string;
  school?: string;
  klass?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loading && isAuthenticated) {
      void navigate({ to: "/app", replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  // Validation function
  const validate = (
    fieldValues = {
      role,
      displayName,
      school,
      klass,
      phone,
      email,
      password,
      confirmPassword,
    },
  ): FormErrors => {
    const errs: FormErrors = {};

    // 1. Role validation
    if (!fieldValues.role) {
      errs.role = "শিক্ষার্থী নাকি শিক্ষক — একটি রোল নির্বাচন করুন";
    }

    // 2. Name validation
    const nameTrimmed = fieldValues.displayName.trim();
    if (!nameTrimmed) {
      errs.displayName = "আপনার নাম লিখুন";
    } else if (nameTrimmed.length < 2) {
      errs.displayName = "নাম কমপক্ষে ২ অক্ষরের হতে হবে";
    } else if (nameTrimmed.length > 60) {
      errs.displayName = "নাম ৬০ অক্ষরের মধ্যে হতে হবে";
    }

    // 3. Phone validation
    const phoneTrimmed = fieldValues.phone.trim();
    if (!phoneTrimmed) {
      errs.phone = "মোবাইল নম্বর দেওয়া বাধ্যতামূলক";
    } else {
      const normalized = normalizeBdPhone(phoneTrimmed);
      if (!normalized) {
        errs.phone = "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)";
      }
    }

    // 4. Email validation (মাস্ট / আবশ্যক)
    const emailTrimmed = fieldValues.email.trim().toLowerCase();
    if (!emailTrimmed) {
      errs.email = "ইমেইল দেওয়া বাধ্যতামূলক";
    } else if (!EMAIL_REGEX.test(emailTrimmed)) {
      errs.email = "সঠিক ইমেইল ফরম্যাট দিন (যেমন: name@example.com)";
    } else if (emailTrimmed.endsWith("@phone.drchem.local")) {
      errs.email = "অনুগ্রহ করে আপনার আসল ব্যক্তিগত ইমেইল দিন";
    }

    // 5. School validation (for teachers institution is required)
    const schoolTrimmed = fieldValues.school.trim();
    if (fieldValues.role === "teacher" && !schoolTrimmed) {
      errs.school = "আপনার শিক্ষা প্রতিষ্ঠানের নাম লিখুন";
    } else if (schoolTrimmed.length > 100) {
      errs.school = "প্রতিষ্ঠানের নাম ১০০ অক্ষরের মধ্যে হতে হবে";
    }

    // 6. Class validation (for students class is required)
    const classTrimmed = fieldValues.klass.trim();
    if (fieldValues.role === "student" && !classTrimmed) {
      errs.klass = "আপনার শ্রেণি উল্লেখ করুন (যেমন: ৯ বা ১০)";
    } else if (classTrimmed.length > 30) {
      errs.klass = "শ্রেণি ৩০ অক্ষরের মধ্যে হতে হবে";
    }

    // 7. Password validation
    if (!fieldValues.password) {
      errs.password = "পাসওয়ার্ড দেওয়া বাধ্যতামূলক";
    } else if (fieldValues.password.length < 6) {
      errs.password = "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে";
    } else if (fieldValues.password.length > 72) {
      errs.password = "পাসওয়ার্ড ৭২ অক্ষরের বেশি হতে পারবে না";
    }

    // 8. Confirm Password validation
    if (!fieldValues.confirmPassword) {
      errs.confirmPassword = "পাসওয়ার্ড নিশ্চিত করুন";
    } else if (fieldValues.confirmPassword !== fieldValues.password) {
      errs.confirmPassword = "পাসওয়ার্ড দুটি মিলছে না";
    }

    return errs;
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const currentErrors = validate();
    setErrors(currentErrors);
  };

  const handleRoleSelect = (selectedRole: "student" | "teacher") => {
    setRole(selectedRole);
    setTouched((prev) => ({ ...prev, role: true }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.role;
      return next;
    });
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();

    // Mark all fields touched
    setTouched({
      role: true,
      displayName: true,
      school: true,
      klass: true,
      phone: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError || "ফর্মের তথ্যগুলো সঠিকভাবে পূরণ করুন");
      return;
    }

    const normalizedPhone = normalizeBdPhone(phone);
    if (!normalizedPhone) {
      toast.error("সঠিক ফোন নাম্বার দিন (যেমন: 01XXXXXXXXX)");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    setSubmitting(true);

    // Fast pre-check: verify phone uniqueness before signup
    try {
      const { data: existingPhoneEmail } = await (
        supabase.rpc as unknown as (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{ data: string | null; error: { message: string } | null }>
      )("get_auth_email_by_phone", { _phone: normalizedPhone });

      if (existingPhoneEmail) {
        setErrors((prev) => ({
          ...prev,
          phone: "এই মোবাইল নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে। লগইন করুন।",
        }));
        toast.error("এই ফোন নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে। অনুগ্রহ করে লগইন করুন।");
        setSubmitting(false);
        return;
      }
    } catch {
      // Ignore RPC pre-check error and fallback to auth.signUp
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: {
          display_name: displayName.trim(),
          school: school.trim(),
          class: klass.trim(),
          role,
          phone: normalizedPhone,
        },
      },
    });

    setSubmitting(false);

    if (error) {
      const msg = error.message?.toLowerCase() ?? "";
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists") ||
        msg.includes("unique")
      ) {
        setErrors((prev) => ({
          ...prev,
          email: "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে।",
        }));
        toast.error("এই ইমেইল বা ফোন নম্বরে অ্যাকাউন্ট আছে। অনুগ্রহ করে লগইন করুন।");
      } else if (msg.includes("password")) {
        setErrors((prev) => ({
          ...prev,
          password: "পাসওয়ার্ডটি আরও শক্তিশালী করুন।",
        }));
        toast.error(error.message);
      } else {
        toast.error(error.message || "অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
      return;
    }

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInError) {
        toast.success("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! অনুগ্রহ করে লগইন করুন।");
        navigate({ to: "/login" });
        return;
      }
    }

    toast.success("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে — স্বাগতম!");
    navigate({ to: "/app", replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-10">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <DrChemLogo size="md" showText />
        </Link>
        <h1 className="text-2xl font-bold text-center mb-1">নতুন অ্যাকাউন্ট তৈরি করুন</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          ফ্রি সাইনআপ করে ভার্চুয়াল ল্যাবে শুরু করুন
        </p>

        {/* Role Selection */}
        <div className="mb-5">
          <Label className="mb-2 block font-medium">
            আপনি কে? <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleRoleSelect("student")}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left",
                role === "student"
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                  : "border-border hover:border-primary/40 bg-card",
                touched.role && errors.role && !role && "border-destructive/60 bg-destructive/5",
              )}
            >
              <div className="flex items-center gap-1.5">
                <GraduationCap
                  className={cn(
                    "h-5 w-5",
                    role === "student" ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="text-sm font-semibold">শিক্ষার্থী</span>
              </div>
              <span className="text-[11px] text-muted-foreground text-center">
                পরীক্ষা ও ভার্চুয়াল ল্যাব
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("teacher")}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left",
                role === "teacher"
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                  : "border-border hover:border-primary/40 bg-card",
                touched.role && errors.role && !role && "border-destructive/60 bg-destructive/5",
              )}
            >
              <div className="flex items-center gap-1.5">
                <UserCog
                  className={cn(
                    "h-5 w-5",
                    role === "teacher" ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="text-sm font-semibold">শিক্ষক</span>
              </div>
              <span className="text-[11px] text-muted-foreground text-center">
                ক্লাসরুম ও প্রশ্ন ব্যবস্থাপনা
              </span>
            </button>
          </div>
          {touched.role && errors.role && (
            <p className="text-xs text-destructive mt-1.5 font-medium flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errors.role}
            </p>
          )}
        </div>

        <form onSubmit={handleSignup} className="space-y-4" noValidate>
          {/* Display Name */}
          <div>
            <Label htmlFor="name" className="flex items-center gap-1.5 text-xs font-semibold mb-1">
              <User className="h-3.5 w-3.5 text-primary" />
              পূর্ণ নাম <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              required
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (touched.displayName) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    const trimmed = e.target.value.trim();
                    if (trimmed.length >= 2 && trimmed.length <= 60) {
                      delete next.displayName;
                    }
                    return next;
                  });
                }
              }}
              onBlur={() => handleBlur("displayName")}
              placeholder="যেমন: অনিক আহমেদ"
              className={cn(
                touched.displayName &&
                  errors.displayName &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
            {touched.displayName && errors.displayName && (
              <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.displayName}
              </p>
            )}
          </div>

          {/* School & Class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor="school"
                className="flex items-center gap-1.5 text-xs font-semibold mb-1"
              >
                <School className="h-3.5 w-3.5 text-primary" />
                {role === "teacher" ? "প্রতিষ্ঠান" : "স্কুল / কলেজ"}{" "}
                {role === "teacher" && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="school"
                value={school}
                onChange={(e) => {
                  setSchool(e.target.value);
                  if (touched.school && role === "teacher" && e.target.value.trim()) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.school;
                      return next;
                    });
                  }
                }}
                onBlur={() => handleBlur("school")}
                placeholder={role === "teacher" ? "প্রতিষ্ঠানের নাম" : "স্কুলের নাম (ঐচ্ছিক)"}
                className={cn(
                  touched.school &&
                    errors.school &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              {touched.school && errors.school && (
                <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.school}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="class"
                className="flex items-center gap-1.5 text-xs font-semibold mb-1"
              >
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                {role === "teacher" ? "যে শ্রেণি পড়ান" : "শ্রেণি / ক্লাস"}{" "}
                {role === "student" && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="class"
                value={klass}
                onChange={(e) => {
                  setKlass(e.target.value);
                  if (touched.klass && role === "student" && e.target.value.trim()) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.klass;
                      return next;
                    });
                  }
                }}
                onBlur={() => handleBlur("klass")}
                placeholder={role === "teacher" ? "যেমন: ৯-১০" : "যেমন: ৯ বা ১০"}
                className={cn(
                  touched.klass &&
                    errors.klass &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              {touched.klass && errors.klass && (
                <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.klass}
                </p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs font-semibold mb-1">
              <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              মোবাইল নম্বর <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              required
              inputMode="numeric"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (touched.phone) {
                  const normalized = normalizeBdPhone(e.target.value);
                  if (normalized) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.phone;
                      return next;
                    });
                  }
                }
              }}
              onBlur={() => handleBlur("phone")}
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
              className={cn(
                touched.phone &&
                  errors.phone &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
            {touched.phone && errors.phone ? (
              <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.phone}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-1">
                বাংলাদেশের ১১ ডিজিটের সক্রিয় নম্বর (যেমন: 01712345678)
              </p>
            )}
          </div>

          {/* Email (মাস্ট / আবশ্যক) */}
          <div>
            <Label htmlFor="email" className="flex items-center gap-1.5 text-xs font-semibold mb-1">
              <Mail className="h-3.5 w-3.5 text-primary" />
              ইমেইল অ্যাড্রেস <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) {
                  const trimmed = e.target.value.trim().toLowerCase();
                  if (trimmed && EMAIL_REGEX.test(trimmed)) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.email;
                      return next;
                    });
                  }
                }
              }}
              onBlur={() => handleBlur("email")}
              placeholder="yourname@gmail.com"
              autoComplete="email"
              className={cn(
                touched.email &&
                  errors.email &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
            {touched.email && errors.email ? (
              <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.email}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-1">
                পাসওয়ার্ড পুনরুদ্ধার এবং অ্যাকাউন্টের নোটিফিকেশনের জন্য ইমেইল প্রয়োজন
              </p>
            )}
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor="password"
                className="flex items-center gap-1.5 text-xs font-semibold mb-1"
              >
                <Lock className="h-3.5 w-3.5 text-primary" />
                পাসওয়ার্ড <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
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
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  autoComplete="new-password"
                  className={cn(
                    "pr-10",
                    touched.password &&
                      errors.password &&
                      "border-destructive focus-visible:ring-destructive",
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

            <div>
              <Label
                htmlFor="confirmPassword"
                className="flex items-center gap-1.5 text-xs font-semibold mb-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                পাসওয়ার্ড নিশ্চিত করুন <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (touched.confirmPassword && e.target.value === password) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.confirmPassword;
                        return next;
                      });
                    }
                  }}
                  onBlur={() => handleBlur("confirmPassword")}
                  placeholder="একই পাসওয়ার্ড দিন"
                  autoComplete="new-password"
                  className={cn(
                    "pr-10",
                    touched.confirmPassword &&
                      errors.confirmPassword &&
                      "border-destructive focus-visible:ring-destructive",
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
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
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
                অ্যাকাউন্ট তৈরি হচ্ছে…
              </>
            ) : (
              "অ্যাকাউন্ট তৈরি করুন"
            )}
          </Button>
        </form>

        <p className="text-sm text-center mt-6 text-muted-foreground">
          আগে থেকেই অ্যাকাউন্ট আছে?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            লগইন করুন
          </Link>
        </p>
      </div>
    </div>
  );
}
