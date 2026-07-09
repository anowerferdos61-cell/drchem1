import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/teacher/lab-reports")({
  component: () => (
    <Card className="p-8 text-center text-sm text-muted-foreground">
      Lab Reports review coming next · শীঘ্রই আসছে
    </Card>
  ),
});
