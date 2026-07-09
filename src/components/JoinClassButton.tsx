import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { joinClassByCode } from "@/lib/teacher.functions";

interface MyClass {
  id: string;
  name: string;
  section: string | null;
}

export default function JoinClassButton() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<MyClass[]>([]);
  const join = useServerFn(joinClassByCode);

  const loadMine = async () => {
    if (!user) return;
    const { data: mm } = await supabase
      .from("class_members")
      .select("class_id")
      .eq("student_id", user.id);
    const ids = (mm ?? []).map((m) => m.class_id);
    if (ids.length === 0) {
      setMine([]);
      return;
    }
    const { data: cs } = await supabase
      .from("classes")
      .select("id, name, section")
      .in("id", ids);
    setMine(cs ?? []);
  };

  useEffect(() => {
    if (isAuthenticated) void loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated) return null;

  const doJoin = async () => {
    if (!code.trim()) return toast.error("Enter a class code");
    setBusy(true);
    const res = await join({ data: { code } });
    setBusy(false);
    if (res.error) return toast.error(res.error);
    toast.success("Joined class!");
    setCode("");
    setOpen(false);
    void loadMine();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4" />
          {mine.length > 0 ? `My Classes (${mine.length})` : "Join Class"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a class · ক্লাসে যোগ দিন</DialogTitle>
        </DialogHeader>
        {mine.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Your classes</p>
            <ul className="space-y-1 text-sm">
              {mine.map((c) => (
                <li key={c.id} className="rounded border px-2 py-1">
                  {c.name}
                  {c.section ? ` · ${c.section}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="space-y-1">
          <Label>Class code</Label>
          <Input
            placeholder="6-character code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="font-mono tracking-widest"
            maxLength={12}
          />
          <p className="text-xs text-muted-foreground">
            Ask your teacher for the class code · শিক্ষকের কাছ থেকে কোড নিন
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={doJoin} disabled={busy}>
            {busy ? "Joining…" : "Join"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
