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
import { getClassProgress } from "@/lib/progress.functions";


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

interface StudentAgg {
  submissions: number;
  lastSubmitted: string | null;
  totalMarks: number;
  totalPossible: number;
  pending: number;
}

function ClassDetail() {
  const { classId } = Route.useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState<ClassInfo | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [aggByStudent, setAggByStudent] = useState<Map<string, StudentAgg>>(new Map());
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

    // Aggregate per-student submissions & marks across this class's published sets.
    const { data: setsRows } = await supabase
      .from("question_sets")
      .select("id")
      .eq("class_id", classId)
      .eq("status", "published");
    const setIds = (setsRows ?? []).map((s) => s.id);
    const agg = new Map<string, StudentAgg>();
    if (setIds.length && ids.length) {
      const { data: attempts } = await supabase
        .from("test_attempts")
        .select("student_id, submitted_at, mcq_score, mcq_total, cq_score")
        .in("set_id", setIds)
        .in("student_id", ids)
        .not("submitted_at", "is", null);
      for (const a of attempts ?? []) {
        const cur = agg.get(a.student_id) ?? { submissions: 0, lastSubmitted: null, totalMarks: 0, totalPossible: 0, pending: 0 };
        cur.submissions += 1;
        cur.totalMarks += Number(a.mcq_score ?? 0) + Number(a.cq_score ?? 0);
        cur.totalPossible += Number(a.mcq_total ?? 0);
        if (a.cq_score == null) cur.pending += 1;
        if (a.submitted_at && (!cur.lastSubmitted || a.submitted_at > cur.lastSubmitted)) {
          cur.lastSubmitted = a.submitted_at;
        }
        agg.set(a.student_id, cur);
      }
    }
    setAggByStudent(agg);
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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-2">Name</th>
                      <th className="whitespace-nowrap px-4 py-2">Email</th>
                      <th className="whitespace-nowrap px-4 py-2">School / Class</th>
                      <th className="whitespace-nowrap px-4 py-2">Submissions</th>
                      <th className="whitespace-nowrap px-4 py-2">Last Submitted</th>
                      <th className="whitespace-nowrap px-4 py-2">Marks</th>
                      <th className="whitespace-nowrap px-4 py-2">Joined</th>
                      <th className="whitespace-nowrap px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const name = m.display_name || m.email?.split("@")[0] || "Student";
                      const a = aggByStudent.get(m.student_id);
                      return (
                        <tr key={m.id} className="border-t">
                          <td className="whitespace-nowrap px-4 py-2 font-medium">{name}</td>
                          <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">{m.email ?? "—"}</td>
                          <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                            {[m.school, m.class].filter(Boolean).join(" · ") || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2">
                            {a && a.submissions > 0 ? (
                              <span>
                                {a.submissions}
                                {a.pending > 0 && (
                                  <span className="ml-1 text-xs text-amber-600">({a.pending} pending)</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                            {a?.lastSubmitted ? new Date(a.lastSubmitted).toLocaleString() : "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 font-medium">
                            {a && a.submissions > 0
                              ? `${a.totalMarks}${a.totalPossible ? ` / ${a.totalPossible}${a.pending > 0 ? "+" : ""}` : ""}`
                              : <span className="font-normal text-muted-foreground">—</span>}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                            {new Date(m.joined_at).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-right">
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
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <ClassProgressTab classId={classId} label={label} />
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

interface OverviewSet {
  id: string;
  title: string;
  chapter: string;
  question_type: string;
  difficulty: string;
  published_at: string | null;
  due_at: string | null;
  question_count: number;
}
interface OverviewMember { student_id: string; name: string; email: string | null }
interface OverviewAttempt {
  id: string;
  set_id: string;
  student_id: string;
  submitted_at: string | null;
  mcq_score: number;
  mcq_total: number;
  cq_score: number | null;
}

function AssignmentsTab({ classId, label }: { classId: string; label: string }) {
  const load = useServerFn(getClassAssignmentsOverview);
  const [sets, setSets] = useState<OverviewSet[]>([]);
  const [members, setMembers] = useState<OverviewMember[]>([]);
  const [attempts, setAttempts] = useState<OverviewAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSet, setOpenSet] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await load({ data: { class_id: classId } });
      setSets(r.sets as OverviewSet[]);
      setMembers(r.members as OverviewMember[]);
      setAttempts(r.attempts as OverviewAttempt[]);
      setLoading(false);
    })();
  }, [classId]);

  if (loading) return <Card className="p-6 text-sm text-muted-foreground">Loading…</Card>;
  if (sets.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground space-y-2">
        <p>এই ক্লাসে এখনও কোনো পরীক্ষা publish করা হয়নি।</p>
        <Button asChild size="sm"><Link to="/teacher/questions/new">+ Create Test</Link></Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{label} · {sets.length} test{sets.length === 1 ? "" : "s"} · {members.length} student{members.length === 1 ? "" : "s"}</p>
      {sets.map((s) => {
        const setAttempts = attempts.filter((a) => a.set_id === s.id);
        const submittedCount = setAttempts.filter((a) => a.submitted_at).length;
        const isOpen = openSet === s.id;
        const rows = members.map((m) => ({
          member: m,
          attempt: setAttempts.find((a) => a.student_id === m.student_id) ?? null,
        }));
        const avgMcq = submittedCount
          ? (setAttempts.reduce((s, a) => s + (a.mcq_score ?? 0), 0) / submittedCount).toFixed(1)
          : "—";
        return (
          <Card key={s.id} className="overflow-hidden">
            <button
              className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-muted/40"
              onClick={() => setOpenSet(isOpen ? null : s.id)}
            >
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{s.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {s.chapter} · {s.question_type.toUpperCase()} · {s.difficulty} · {s.question_count} প্রশ্ন
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium">{submittedCount} / {members.length} submitted</p>
                <p className="text-xs text-muted-foreground">Avg MCQ · {avgMcq}</p>
              </div>
            </button>
            {isOpen && (
              <div className="overflow-x-auto border-t">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Student</th>
                      <th className="px-4 py-2">MCQ</th>
                      <th className="px-4 py-2">CQ</th>
                      <th className="px-4 py-2">Submitted</th>
                      <th className="px-4 py-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ member, attempt }) => (
                      <tr key={member.student_id} className="border-t">
                        <td className="px-4 py-2 font-medium">{member.name}</td>
                        <td className="px-4 py-2">
                          {attempt?.submitted_at ? `${attempt.mcq_score} / ${attempt.mcq_total}` : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-2">
                          {attempt?.submitted_at
                            ? (attempt.cq_score == null ? <span className="text-amber-600">Pending</span> : attempt.cq_score)
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {attempt?.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : <span className="text-rose-500">Not attempted</span>}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {attempt?.submitted_at ? (
                            <Button asChild size="sm" variant="ghost">
                              <Link to="/teacher/questions/$setId/attempts/$attemptId" params={{ setId: s.id, attemptId: attempt.id }}>
                                খাতা দেখো →
                              </Link>
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {isOpen && (
              <div className="border-t bg-muted/20 p-2 text-right">
                <Button asChild size="sm" variant="outline">
                  <Link to="/teacher/questions/$setId/results" params={{ setId: s.id }}>
                    Full Results →
                  </Link>
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

interface LeaderRow {
  student_id: string;
  display_name: string;
  email: string | null;
  uniqueLabs: number;
  totalAttempts: number;
  avgAccuracy: number;
  testsDone: number;
  currentStreak: number;
  lastActive: string | null;
}

function ClassProgressTab({ classId, label }: { classId: string; label: string }) {
  const load = useServerFn(getClassProgress);
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    load({ data: { class_id: classId } })
      .then((r) => setRows((r?.leaderboard ?? []) as LeaderRow[]))
      .catch((e) => toast.error(e?.message ?? "Failed to load progress"))
      .finally(() => setLoading(false));
  }, [classId, load]);

  if (loading) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">Loading progress…</Card>;
  }
  if (rows.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        No lab activity yet in <span className="font-semibold">{label}</span>.
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Student</th>
              <th className="px-4 py-2">Labs</th>
              <th className="px-4 py-2">Attempts</th>
              <th className="px-4 py-2">Avg Accuracy</th>
              <th className="px-4 py-2">Tests</th>
              <th className="px-4 py-2">Streak</th>
              <th className="px-4 py-2">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.student_id} className="border-t">
                <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-2 font-medium">
                  {r.display_name}
                  {r.email && (
                    <div className="text-xs font-normal text-muted-foreground">{r.email}</div>
                  )}
                </td>
                <td className="px-4 py-2">{r.uniqueLabs}</td>
                <td className="px-4 py-2 text-muted-foreground">{r.totalAttempts}</td>
                <td className="px-4 py-2 font-semibold">{r.avgAccuracy}%</td>
                <td className="px-4 py-2">{r.testsDone}</td>
                <td className="px-4 py-2">🔥 {r.currentStreak}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {r.lastActive ? new Date(r.lastActive).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

