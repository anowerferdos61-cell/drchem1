import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Flame,
  FlaskConical,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  School,
  ShieldCheck,
  ShieldMinus,
  ShieldPlus,
  Sparkles,
  Trash2,
  Undo2,
  User,
  Users,
  XCircle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUserProfileDetail, type UserProfileDetail } from "@/lib/admin.functions";

interface UserProfileModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAdminId?: string;
  onGrantPro?: (user: { user_id: string; email: string | null }) => void;
  onBan?: (user: { user_id: string; email: string | null }) => void;
  onUnban?: (user: { user_id: string; email: string | null }) => void;
  onPromote?: (user: { user_id: string; email: string | null }) => void;
  onRevoke?: (user: { user_id: string; email: string | null }) => void;
  onDelete?: (user: { user_id: string; email: string | null }) => void;
}

export function UserProfileModal({
  userId,
  open,
  onOpenChange,
  currentAdminId,
  onGrantPro,
  onBan,
  onUnban,
  onPromote,
  onRevoke,
  onDelete,
}: UserProfileModalProps) {
  const getDetailFn = useServerFn(getUserProfileDetail);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "user-profile", userId],
    queryFn: () => getDetailFn({ data: { userId: userId! } }),
    enabled: open && Boolean(userId),
    staleTime: 10_000,
  });

  const handleCopyId = () => {
    if (!profile?.user_id) return;
    void navigator.clipboard.writeText(profile.user_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isBanned = Boolean(
    profile?.banned_until && new Date(profile.banned_until).getTime() > Date.now(),
  );
  const isAdmin = profile?.roles.includes("admin");
  const isSelf = profile?.user_id === currentAdminId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                User Profile
              </DialogTitle>
              <DialogDescription className="mt-1">
                Database থেকে সম্পূর্ণ ব্যবহারকারীর তথ্য ও পরিসংখ্যান
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">ব্যবহারকারীর প্রোফাইল লোড হচ্ছে…</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="p-8 text-center text-rose-500">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-semibold">প্রোফাইল লোড করা সম্ভব হয়নি</p>
            <p className="text-xs text-muted-foreground mt-1">{(error as Error).message}</p>
          </div>
        )}

        {profile && !isLoading && (
          <div className="p-6 space-y-6">
            {/* Header / Avatar Profile Block */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-card border rounded-xl p-4 shadow-sm">
              <Avatar className="h-16 w-16 border-2 border-primary/20 shrink-0">
                <AvatarImage
                  src={profile.avatar_url ?? undefined}
                  alt={profile.display_name ?? ""}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                  {profile.display_name ? profile.display_name.slice(0, 2).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold truncate">
                    {profile.display_name || "নাম সেট করা নেই"}
                  </h3>
                  {isBanned && (
                    <Badge variant="destructive" className="text-[10px] font-bold">
                      BANNED
                    </Badge>
                  )}
                  {profile.roles.map((r) => (
                    <Badge
                      key={r}
                      variant="outline"
                      className={`text-[11px] ${
                        r === "admin"
                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300"
                          : r === "teacher"
                            ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-300"
                            : "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-300"
                      }`}
                    >
                      {r}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span>
                      {profile.email && !profile.email.endsWith("@phone.drchem.local")
                        ? profile.email
                        : "ইমেইল যুক্ত নেই"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span
                      className={
                        profile.phone ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""
                      }
                    >
                      {profile.phone || "ফোন নম্বর নেই"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[220px] sm:max-w-none">
                    ID: {profile.user_id}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-foreground"
                    onClick={handleCopyId}
                    title="Copy User ID"
                  >
                    {copiedId ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Academic & Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border rounded-lg p-3 bg-card space-y-1 sm:col-span-2 bg-emerald-500/5 border-emerald-500/20">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    মোবাইল নম্বর (Phone / Mobile Number)
                  </div>
                  {profile.phone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs flex items-center gap-1 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"
                      onClick={() => {
                        void navigator.clipboard.writeText(profile.phone!);
                        setCopiedPhone(true);
                        setTimeout(() => setCopiedPhone(false), 2000);
                      }}
                    >
                      {copiedPhone ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" /> কপি হয়েছে
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> নম্বর কপি করুন
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {profile.phone || (
                    <span className="text-muted-foreground italic font-sans font-normal text-sm">
                      কোনো মোবাইল নম্বর যুক্ত নেই
                    </span>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-card space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <School className="h-4 w-4 text-primary" />
                  শিক্ষা প্রতিষ্ঠান (School / College)
                </div>
                <div className="text-sm font-medium">
                  {profile.school || <span className="text-muted-foreground italic">দেয়া নেই</span>}
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-card space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  শ্রেণি (Class / Grade)
                </div>
                <div className="text-sm font-medium">
                  {profile.class ? (
                    `Class ${profile.class}`
                  ) : (
                    <span className="text-muted-foreground italic">দেয়া নেই</span>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-card space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  একাউন্ট খোলার তারিখ (Joined)
                </div>
                <div className="text-sm font-medium">
                  {new Date(profile.created_at).toLocaleDateString("bn-BD", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-card space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  সর্বশেষ লগইন (Last Active)
                </div>
                <div className="text-sm font-medium">
                  {profile.last_sign_in_at
                    ? new Date(profile.last_sign_in_at).toLocaleString("bn-BD")
                    : "লগইন তথ্য নেই"}
                </div>
              </div>
            </div>

            {/* Academic Activity & Progress Counters */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                একাডেমিক অগ্রগতি ও পরিসংখ্যান
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="border rounded-xl p-3 bg-card/60 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold leading-none">
                      {profile.stats.labsCompleted.toLocaleString("bn-BD")}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">ল্যাব সম্পন্ন</div>
                  </div>
                </div>

                <div className="border rounded-xl p-3 bg-card/60 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold leading-none">
                      {profile.stats.currentStreak.toLocaleString("bn-BD")}{" "}
                      <span className="text-xs font-normal text-muted-foreground">দিন</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      সর্বোচ্চ {profile.stats.longestStreak.toLocaleString("bn-BD")} দিন
                    </div>
                  </div>
                </div>

                <div className="border rounded-xl p-3 bg-card/60 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold leading-none">
                      {profile.stats.testsTaken.toLocaleString("bn-BD")}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">পরীক্ষা দিয়েছে</div>
                  </div>
                </div>

                <div className="border rounded-xl p-3 bg-card/60 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold leading-none">
                      {profile.stats.classesCount.toLocaleString("bn-BD")}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">যুক্ত ক্লাসরুম</div>
                  </div>
                </div>

                <div className="border rounded-xl p-3 bg-card/60 flex items-center gap-3 col-span-2 sm:col-span-1">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold leading-none">
                      {profile.stats.aiMessagesToday.toLocaleString("bn-BD")}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">আজকের AI প্রশ্ন</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription & Payments */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>সাবস্ক্রিপশন ও পেমেন্ট হিস্ট্রি</span>
                <span className="font-normal lowercase">
                  {profile.subscription ? profile.subscription.status : "free"}
                </span>
              </h4>

              <div className="border rounded-xl p-4 bg-card space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-semibold text-sm">
                        {profile.subscription
                          ? `Plan: ${profile.subscription.plan_code}`
                          : "Free Plan"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {profile.subscription?.current_period_end ? (
                          <>
                            মেয়াদ শেষ:{" "}
                            {new Date(profile.subscription.current_period_end).toLocaleDateString(
                              "bn-BD",
                            )}
                          </>
                        ) : (
                          "কোনো সক্রিয় পেইড প্ল্যান নেই"
                        )}
                      </div>
                    </div>
                  </div>
                  {onGrantPro && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onGrantPro({ user_id: profile.user_id, email: profile.email });
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      Grant / Change Pro
                    </Button>
                  )}
                </div>

                {profile.payments.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="text-xs font-semibold text-muted-foreground mb-2">
                      সাম্প্রতিক পেমেন্ট রিকোয়েস্ট ({profile.payments.length} টি)
                    </div>
                    <div className="space-y-1.5">
                      {profile.payments.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-xs p-2 rounded bg-muted/30 border"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {p.method}
                            </Badge>
                            <span className="font-mono font-medium">{p.trx_id}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">৳{p.amount_bdt}</span>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${
                                p.status === "approved"
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                  : p.status === "rejected"
                                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                              }`}
                            >
                              {p.status}
                            </Badge>
                            <span className="text-muted-foreground text-[10px]">
                              {new Date(p.created_at).toLocaleDateString("bn-BD")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Admin Actions Row */}
            <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">Admin Controls:</div>
              <div className="flex flex-wrap items-center gap-2">
                {!isAdmin &&
                  (isBanned
                    ? onUnban && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onUnban({ user_id: profile.user_id, email: profile.email })
                          }
                        >
                          <Undo2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Unban
                        </Button>
                      )
                    : onBan && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onBan({ user_id: profile.user_id, email: profile.email })}
                        >
                          <Ban className="h-3.5 w-3.5 mr-1 text-amber-600" /> Ban User
                        </Button>
                      ))}

                {isAdmin
                  ? !isSelf &&
                    onRevoke && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRevoke({ user_id: profile.user_id, email: profile.email })}
                      >
                        <ShieldMinus className="h-3.5 w-3.5 mr-1 text-rose-600" /> Revoke Admin
                      </Button>
                    )
                  : onPromote && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onPromote({ user_id: profile.user_id, email: profile.email })
                        }
                      >
                        <ShieldPlus className="h-3.5 w-3.5 mr-1 text-indigo-600" /> Make Admin
                      </Button>
                    )}

                {!isAdmin && onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete({ user_id: profile.user_id, email: profile.email })}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
