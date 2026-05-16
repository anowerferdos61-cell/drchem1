import { createFileRoute } from "@tanstack/react-router";
import TitrationLab from "@/components/TitrationLab";
import { Toaster } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Virtual Chemistry Lab — Acid-Base Titration" },
      {
        name: "description",
        content:
          "Interactive 3D-isometric virtual chemistry lab. Perform an acid-base titration with realistic drag-and-drop apparatus, live volume tracking, and color-change endpoint.",
      },
    ],
  }),
});

function Index() {
  return (
    <>
      <TitrationLab />
      <Toaster position="top-center" richColors />
    </>
  );
}
