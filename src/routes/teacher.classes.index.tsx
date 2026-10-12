import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
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
import { toast } from "sonner";
import { Copy, Plus, Trash2, Users, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/teacher/classes/")({
  component: ClassesPage,
});

interface ClassRow {
  id: string;
  name: string;
  section: string | null;
  subject: string | null;
  class_code: string;
  created_at: string;
  member_count: number;
}

function ClassesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("Chemistry");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: classes, error } = await supabase
      .from("classes")
      .select("id, name, section, subject, class_code, created_at")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    const ids = (classes ?? []).map((c) => c.id);
    const counts = new Map<string, number>();
    if (ids.length > 0) {
      const { data: members } = await supabase
        .from("class_members")
        .select("class_id")
        .in("class_id", ids);
      for (const m of members ?? []) {
        counts.set(m.class_id, (counts.get(m.class_id) ?? 0) + 1);
      }
    }
    setRows((classes ?? []).map((c) => ({ ...c, member_count: counts.get(c.id) ?? 0 })));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast.error("Class name required");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("classes").insert({
      teacher_id: user.id,
      name: name.trim(),
      section: section.trim() || null,
      subject: subject.trim() || null,
    });
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Class created");
    setOpen(false);
    setName("");
    setSection("");
    void load();
  };

  const remove = async (id: string, label: string) => {
    if (!confirm(`Delete "${label}"? Members will be removed.`)) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Class deleted");
    void load();
  };

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success(`Code copied · ${code}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Classes · ক্লাসসমূহ</h1>
          <p className="text-sm text-muted-foreground">
            Share the code with students so they can join.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a class</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Class name</Label>
                <Input
                  placeholder="Class 10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Section (optional)</Label>
                <Input
                  placeholder="A"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={create} disabled={creating}>
                {creating ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No classes yet. Create your first class to get a join code.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => {
            const label = `${c.name}${c.section ? ` · ${c.section}` : ""}`;
            return (
              <Card key={c.id} className="flex flex-col gap-3 p-4">
                <div>
                  <h3 className="font-semibold">{label}</h3>
                  <p className="text-xs text-muted-foreground">{c.subject ?? "—"}</p>
                </div>
                <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Join code</p>
                    <p className="font-mono text-lg font-bold tracking-widest">{c.class_code}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => copyCode(c.class_code)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {c.member_count} student{c.member_count === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-auto flex gap-2">
                  <Button asChild size="sm" variant="secondary" className="flex-1">
                    <Link to="/teacher/classes/$classId" params={{ classId: c.id }}>
                      Open <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(c.id, label)}>
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
