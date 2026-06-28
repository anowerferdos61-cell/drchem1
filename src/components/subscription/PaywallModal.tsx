/**
 * Paywall modal — shown when a free user clicks a locked feature.
 * Wraps children, intercepting their click when locked.
 */
import { Link } from "@tanstack/react-router";
import { Lock, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  reason?: string;
}

export function PaywallModal({
  open,
  onOpenChange,
  featureName = "এই feature",
  reason,
}: PaywallModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-3">
            <Lock className="h-7 w-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-xl">
            🔒 {featureName} Pro এ পাওয়া যাবে
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {reason ?? "Free tier এ এই feature unlock নাই। Pro plan নাও।"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
            <div className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Pro এ যা পাবে
            </div>
            <ul className="text-sm space-y-1.5 text-muted-foreground">
              <li>✓ সব ১২টি interactive lab</li>
              <li>✓ Unlimited AI Tutor (RAG সহ)</li>
              <li>✓ Smart Notes লেখা ও শেয়ার</li>
              <li>✓ Viva practice + auto grading</li>
            </ul>
          </div>
          <div className="text-center text-2xl font-bold">
            মাত্র ৳৯৯<span className="text-sm text-muted-foreground font-normal">/মাস</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            পরে
          </Button>
          <Button asChild className="flex-1">
            <Link to="/billing">👑 Pro নিন</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
