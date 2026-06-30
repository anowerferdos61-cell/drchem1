/**
 * /app layout — pathless wrapper so child routes like /app/videos
 * and /app/notes can mount under the Home Hub.
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  component: () => <Outlet />,
});
