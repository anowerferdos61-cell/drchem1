import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Copy, RefreshCw, Trash2, UserMinus, Users, BarChart3, FileCheck2, ClipboardList, Mic2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { regenerateClassCode } from "@/lib/teacher.functions";
import { getClassAssignmentsOverview } from "@/lib/grading.functions";

export const Route = createFileRoute("/teacher/classes/$classId")({
  component: ClassDetail,
});

interface ClassInfo {
  id: string;
  name: string;
  section: string | null;
  subject: string | null;
  class_code: string;
}

interface MemberRow {
  id: string;
  student_id: string;
  joined_at: string;
  display_name: string | null;
  email: string | null;
  school: string | null;
  class: string | null;
}

function ClassDetail() {
  const { classId } = Route.useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState<ClassInfo | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const regen = useServerFn(regenerateClassCode);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: c, error } = await supabase
      .from("classes")
      .select("id, name, section, subject, class_code")
      .eq("id", classId)
      .maybeSingle();
    if (error || !c) {
      toast.error(error?.message ?? "Class not found");
      setLoading(false);
      return;
    }
    setInfo(c);

    const { data: mm } = await supabase
      .from("class_members")
      .select("id, student_id, joined_at")
      .eq("class_id", classId)
      .order("joined_at", { ascending: false });
    const ids = (mm ?? []).map((m) => m.student_id);
    let profilesById = new Map<string, { display_name: string | null; email: string | null; school: string | null; class: string | null }>();
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, school, class")
        .in("user_id", ids);
      profilesById = new Map(
        (profiles ?? []).map((p) => [
          p.user_id,
          { display_name: p.display_name, email: p.email, school: p.school, class: p.class },
        ]),
      );
    }
    setMembers(
      (mm ?? []).map((m) => ({
        id: m.id,
        student_id: m.student_id,
        joined_at: m.joined_at,
        ...(profilesById.get(m.student_id) ?? {
          display_name: null,
          email: null,
          school: null,
          class: null,
        }),
      })),
    );
    setLoading(false);
  }, [classId]);

  useEffect(() => {
    void load();
  }, [load]);

  const copyCode = () => {
    if (!info) return;
    void navigator.clipboard.writeText(info.class_code);
    toast.success(`Code copied · ${info.class_code}`);
  };

  const doRegen = async () => {
    if (!info) return;
    if (!confirm("Regenerate join code? The old code will stop working.")) return;
    const res = await regen({ data: { classId: info.id } });
    if (res.error || !res.code) return toast.error(res.error ?? "Failed");
    toast.success(`New code · ${res.code}`);
    setInfo({ ...info, class_code: res.code });
  };

  const removeMember = async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from this class?`)) return;
    const { error } = await supabase.from("class_members").delete().eq("id", memberId);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    void load();
  };

  const deleteClass = async () => {
    if (!info) return;
    if (!confirm(`Delete class "${info.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("classes").delete().eq("id", info.id);
    if (error) return toast.error(error.message);
    toast.success("Class deleted");
    void navigate({ to: "/teacher/classes" });
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!info) return <p className="text-sm">Class not found.</p>;

  const label = `${info.name}${info.section ? ` · ${info.section}` : ""}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/teacher/classes">
              <ArrowLeft className="h-4 w-4" /> All Classes
            </Link>
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={deleteClass}>
          <Trash2 className="h-4 w-4 text-rose-500" /> Delete Class
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{label}</h1>
            <p className="text-sm text-muted-foreground">
              {info.subject ?? "—"} · {members.length} student{members.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-4 py-2">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Join code</p>
              <p className="font-mono text-xl font-bold tracking-widest">{info.class_code}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={copyCode} title="Copy">
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={doRegen} title="Regenerate">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="students"><Users className="h-4 w-4 mr-1" />Students · ছাত্র</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-1" />Lab Analytics</TabsTrigger>
          <TabsTrigger value="reports"><FileCheck2 className="h-4 w-4 mr-1" />Lab Reports</TabsTrigger>
          <TabsTrigger value="assignments"><ClipboardList className="h-4 w-4 mr-1" />Assignments</TabsTrigger>
          <TabsTrigger value="viva"><Mic2 className="h-4 w-4 mr-1" />Viva</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Card className="overflow-hidden">
            {members.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No students have joined yet. Share the code <span className="font-mono font-bold">{info.class_code}</span>.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">School / Class</th>
                    <th className="px-4 py-2">Joined</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const name = m.display_name || m.email?.split("@")[0] || "Student";
                    return (
                      <tr key={m.id} className="border-t">
                        <td className="px-4 py-2 font-medium">{name}</td>
                        <td className="px-4 py-2 text-muted-foreground">{m.email ?? "—"}</td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {[m.school, m.class].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {new Date(m.joined_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeMember(m.id, name)}
                          >
                            <UserMinus className="h-4 w-4 text-rose-500" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Lab Analytics for <span className="font-semibold">{label}</span> · শীঘ্রই আসছে
          </Card>
        </TabsContent>
        <TabsContent value="reports">
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Lab Reports for <span className="font-semibold">{label}</span> · শীঘ্রই আসছে
          </Card>
        </TabsContent>
        <TabsContent value="assignments">
          <AssignmentsTab classId={classId} label={label} />
        </TabsContent>
        <TabsContent value="viva">
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Viva sessions for <span className="font-semibold">{label}</span> · শীঘ্রই আসছে
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
