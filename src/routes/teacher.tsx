import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import UserMenu from "@/components/auth/UserMenu";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Users,
  BarChart3,
  FileCheck2,
  ClipboardList,
  Mic2,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/teacher")({
  head: () => ({
    meta: [{ title: "Teacher Dashboard · Dr. Chem" }],
  }),
  component: TeacherLayout,
});

const NAV = [
  { to: "/teacher", label: "Overview", icon: GraduationCap, exact: true },
  { to: "/teacher/classes", label: "Classes · ক্লাস", icon: Users },
  { to: "/teacher/lab-analytics", label: "Lab Analytics", icon: BarChart3 },
  { to: "/teacher/lab-reports", label: "Lab Reports", icon: FileCheck2 },
  { to: "/teacher/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/teacher/viva", label: "Viva", icon: Mic2 },
] as const;

function TeacherLayout() {
  const { isTeacher, loading, rolesLoaded, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !rolesLoaded) return;
    if (!isAuthenticated) {
      void navigate({ to: "/login" });
      return;
    }
    if (!isTeacher) void navigate({ to: "/app" });
  }, [loading, rolesLoaded, isAuthenticated, isTeacher, navigate]);

  if (loading || !rolesLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!isAuthenticated || !isTeacher) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/app">
                <ArrowLeft className="h-4 w-4" /> Lab
              </Link>
            </Button>
            <span className="hidden font-semibold sm:inline">Teacher · শিক্ষক</span>
          </div>
          <UserMenu />
        </div>
        <nav className="mx-auto max-w-7xl overflow-x-auto px-2">
          <ul className="flex gap-1 pb-2 text-sm">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  activeOptions={{ exact: n.exact }}
                  activeProps={{ className: "bg-primary text-primary-foreground" }}
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-accent"
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
