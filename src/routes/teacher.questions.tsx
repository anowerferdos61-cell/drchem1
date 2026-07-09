import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/questions")({
  component: () => <Outlet />,
});

export { Link };
