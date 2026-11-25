import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { AlertTriangle, ArrowLeft, Loader2, Trash2 } from "lucide-react";

import { useAuth } from "@/lib/auth-store";
import { useIsStandaloneApp } from "@/lib/app-mode";
import { deleteOwnAccount } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DrChemLogo } from "@/components/brand/DrChemLogo";

export const Route = createFileRoute("/delete-account")({
  component: DeleteAccountPage,
  head: () => ({
    meta: [
      { title: "Delete Account · Dr. Chem" },
      {
        name: "description",
        content: "Permanently delete your Dr. Chem account and associated personal data.",
      },
    ],
    links: [{ rel: "canonical", href: "https://drchemedu.com/delete-account" }],
  }),
});

function DeleteAccountPage() {
  const navigate = useNavigate();
  const isStandalone = useIsStandaloneApp();
  const { user, isAuthenticated, loading } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  const handleDelete = async () => {
    if (!canDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteOwnAccount();
      await supabase.auth.signOut();
      toast.success("আপনার অ্যাকাউন্ট স্থায়ীভাবে ডিলিট করা হয়েছে।");
      void navigate({ to: "/login", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "অ্যাকাউন্ট ডিলিট করতে সমস্যা হয়েছে");
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <Toaster richColors position="top-center" />
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            to={isAuthenticated ? "/app" : isStandalone ? "/login" : "/"}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            ফিরে যান
          </Link>
          <DrChemLogo size="sm" showText />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">অ্যাকাউন্ট ডিলিট করুন</h1>
              <p className="text-xs text-muted-foreground">
                এই প্রক্রিয়াটি স্থায়ী এবং পূর্বাবস্থায় ফেরানো যাবে না
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            আপনার অ্যাকাউন্ট ডিলিট করলে প্রোফাইল, ল্যাব প্রগ্রেস, সেভ করা নোটস এবং লগইন তথ্য
            স্থায়ীভাবে মুছে যাবে।
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              অ্যাকাউন্ট তথ্য যাচাই হচ্ছে…
            </div>
          ) : isAuthenticated ? (
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">
                বর্তমান অ্যাকাউন্ট:{" "}
                <span className="font-semibold text-foreground">{user?.email}</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-delete" className="text-xs font-medium">
                  নিশ্চিত করতে নিচে <span className="font-bold text-destructive">DELETE</span> লিখুন
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                />
              </div>

              <Button
                type="button"
                variant="destructive"
                className="w-full cursor-pointer"
                disabled={!canDelete || deleting}
                onClick={handleDelete}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ডিলিট হচ্ছে…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    স্থায়ীভাবে অ্যাকাউন্ট ডিলিট করুন
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                অনলাইনে সরাসরি অ্যাকাউন্ট ডিলিট করতে প্রথমে লগইন করুন, অথবা{" "}
                <a
                  href="mailto:drchem.edu@gmail.com?subject=Account%20Deletion%20Request"
                  className="text-primary font-medium hover:underline"
                >
                  drchem.edu@gmail.com
                </a>{" "}
                ঠিকানায় আপনার নিবন্ধিত ইমেইল/ফোন নম্বরসহ মেইল পাঠান।
              </p>
              <Button asChild className="w-full">
                <Link to="/login" search={{ redirect: "/delete-account" }}>
                  লগইন করে ডিলিট করুন
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
