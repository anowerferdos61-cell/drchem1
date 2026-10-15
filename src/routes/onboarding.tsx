import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast, Toaster } from "sonner";
import { FlaskConical, GraduationCap, Loader2, UserCog } from "lucide-react";
import { DrChemLogo } from "@/components/brand/DrChemLogo";

import { useAuth } from "@/lib/auth-store";
import { setMyRole } from "@/lib/onboarding.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [{ title: "Welcome · Dr. Chem" }, { name: "robots", content: "noindex,nofollow" }],
  }),
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, profile, roles, refreshProfile } = useAuth();
  const setMyRoleFn = useServerFn(setMyRole);

  const [role, setRole] = useState<"student" | "teacher">("student");
  const [school, setSchool] = useState("");
  const [klass, setKlass] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      void navigate({ to: "/login", replace: true });
      return;
    }
    // Already onboarded → bounce to right place
    if (profile?.role_selected) {
      if (roles.includes("admin")) void navigate({ to: "/admin", replace: true });
      else void navigate({ to: "/app", replace: true });
    }
  }, [loading, isAuthenticated, profile, roles, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await setMyRoleFn({
        data: { role, school: school || undefined, klass: klass || undefined },
      });
      await refreshProfile();
      toast.success("চমৎকার! শুরু করা যাক 🎉");
      if (res.isAdmin) navigate({ to: "/admin", replace: true });
      else navigate({ to: "/app", replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-10">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-2 justify-center mb-6">
          <DrChemLogo size="md" showText />
        </div>
        <h1 className="text-2xl font-bold text-center mb-1">স্বাগতম! 👋</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">চালিয়ে যেতে কিছু তথ্য দিন</p>

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

        <form onSubmit={handleSubmit} className="space-y-3">
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
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "চালিয়ে যান"}
          </Button>
        </form>
      </div>
    </div>
  );
}
