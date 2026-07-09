import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const DEMO_VIDEO_ID = "EADWRKtshCY";

export function VideoModal({
  open,
  onOpenChange,
  videoId = DEMO_VIDEO_ID,
  title = "Dr. Chem Demo",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  videoId?: string;
  title?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-0 bg-black">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="relative w-full aspect-video">
          {open && (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
