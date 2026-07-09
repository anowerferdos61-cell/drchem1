import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/classes")({
  component: () => <Outlet />,
});
