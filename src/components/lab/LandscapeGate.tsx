import type { ReactNode } from "react";

/**
 * Previously auto-rotated lab content into landscape on mobile portrait via a
 * CSS transform. That caused disorientation and cut-off canvases on many
 * phones. We now render children as-is and let each lab handle its own
 * responsive layout (stacking vertically on small screens).
 */
export default function LandscapeWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
