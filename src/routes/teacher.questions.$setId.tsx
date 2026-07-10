import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/questions/$setId")({
  component: () => <Outlet />,
});
