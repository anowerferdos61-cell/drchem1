import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/teacher/lab-analytics")({
  component: () => (
    <Card className="p-8 text-center text-sm text-muted-foreground">
      Lab Analytics coming next · শীঘ্রই আসছে
    </Card>
  ),
});
