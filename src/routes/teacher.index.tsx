import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { Users, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/teacher/")({
  component: TeacherHome,
});

function TeacherHome() {
  const { user } = useAuth();
  const [classCount, setClassCount] = useState<number | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { count: cc } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", user.id);
      setClassCount(cc ?? 0);

      const { data: myClasses } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", user.id);
      const ids = (myClasses ?? []).map((c) => c.id);
      if (ids.length === 0) {
        setStudentCount(0);
        return;
      }
      const { count: sc } = await supabase
        .from("class_members")
        .select("*", { count: "exact", head: true })
        .in("class_id", ids);
      setStudentCount(sc ?? 0);
    })();
  }, [user]);

  const kpis = [
    { label: "My Classes · আমার ক্লাস", value: classCount, icon: Users, to: "/teacher/classes" },
    { label: "Total Students · মোট ছাত্র", value: studentCount, icon: Users, to: "/teacher/classes" },
  ] as const;

  const links = [
    { to: "/teacher/classes", label: "Manage Classes · ক্লাস ব্যবস্থাপনা", desc: "Create classes, share join codes, see student progress.", icon: Users },
    { to: "/teacher/questions", label: "AI Question Generator · AI প্রশ্ন", desc: "AI দিয়ে NCTB standard MCQ / সৃজনশীল প্রশ্ন বানাও, ক্লাসে assign করো।", icon: Sparkles },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome · স্বাগতম. Manage your classes, monitor labs, and assign work.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <k.icon className="h-5 w-5 text-primary" />
              <Link to={k.to} className="text-xs text-primary hover:underline">
                Open <ArrowRight className="inline h-3 w-3" />
              </Link>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{k.label}</p>
            <p className="text-2xl font-bold">{k.value ?? "—"}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {links.map((l) => (
          <Link key={l.to} to={l.to}>
            <Card className="h-full p-4 transition hover:border-primary hover:shadow-md">
              <div className="flex items-start gap-3">
                <l.icon className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">{l.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{l.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
