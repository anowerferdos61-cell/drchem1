/**
 * /app/videos — Video Lessons module.
 * Embedded YouTube iframe with premium gate.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, PlayCircle, Video as VideoIcon } from "lucide-react";
import {
  LibraryShell,
  PremiumLockCard,
  useLibraryRows,
} from "@/components/library/LibraryLayout";
import { useEntitlements } from "@/hooks/useEntitlements";

interface VideoRow {
  id: string;
  chapter_number: number;
  title: string;
  video_platform: string;
  video_id: string;
  is_premium: boolean;
}

export const Route = createFileRoute("/app/videos")({
  component: VideosPage,
  head: () => ({
    meta: [
      { title: "Video Lessons · Dr. Chem" },
      {
        name: "description",
        content:
          "Bilingual NCTB Class 9-10 chemistry video lessons — chapter-wise, embedded, ad-free.",
      },
      { property: "og:title", content: "Video Lessons · Dr. Chem" },
      { property: "og:description", content: "Chapter-wise NCTB chemistry video lessons." },
    ],
  }),
});

function VideosPage() {
  const { data: rows = [], isLoading } = useLibraryRows<VideoRow>(
    "videos",
    "id, chapter_number, title, video_platform, video_id, is_premium",
  );
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { isPro } = useEntitlements();

  const countsByChapter = useMemo(() => {
    const m: Record<number, number> = {};
    rows.forEach((r) => {
      m[r.chapter_number] = (m[r.chapter_number] ?? 0) + 1;
    });
    return m;
  }, [rows]);

  const chapterVideos = useMemo(
    () => rows.filter((r) => r.chapter_number === activeChapter),
    [rows, activeChapter],
  );

  const selected =
    chapterVideos.find((v) => v.id === selectedId) ?? chapterVideos[0] ?? null;
  const locked = !!selected && selected.is_premium && !isPro;

  return (
    <LibraryShell
      module="videos"
      headerTitleBn="ভিডিও লেসন"
      headerSubtitle="Video Lessons · NCTB"
      accent="from-rose-500 to-pink-600"
      activeChapter={activeChapter}
      setActiveChapter={(n) => {
        setActiveChapter(n);
        setSelectedId(null);
      }}
      countsByChapter={countsByChapter}
    >
      {isLoading ? (
        <div className="grid h-64 place-items-center text-sm text-muted-foreground">
          লোড হচ্ছে…
        </div>
      ) : chapterVideos.length === 0 ? (
        <Card className="grid h-64 place-items-center border-dashed text-center">
          <div>
            <VideoIcon className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              এই অধ্যায়ে এখনো কোনো ভিডিও নেই। শীঘ্রই আসছে।
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Player */}
          {selected && (
            <div>
              {locked ? (
                <PremiumLockCard kind="video" />
              ) : (
                <Card className="overflow-hidden border-0 shadow-2xl shadow-rose-500/10">
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      key={selected.id}
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${selected.video_id}?modestbranding=1&rel=0`}
                      title={selected.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <h2 className="text-base font-extrabold md:text-lg">{selected.title}</h2>
                      <p className="text-xs text-muted-foreground">Chapter {selected.chapter_number}</p>
                    </div>
                    {selected.is_premium && (
                      <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300">Pro</Badge>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Playlist */}
          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              এই অধ্যায়ের অন্যান্য ভিডিও
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {chapterVideos.map((v) => {
                const vLocked = v.is_premium && !isPro;
                const isActive = selected?.id === v.id;
                return (
                  <Card
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    className={`group relative cursor-pointer overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg ${
                      isActive ? "ring-2 ring-rose-500" : ""
                    }`}
                  >
                    <div className="relative aspect-video w-full bg-muted">
                      <img
                        src={`https://i.ytimg.com/vi/${v.video_id}/hqdefault.jpg`}
                        alt={v.title}
                        loading="lazy"
                        className={`h-full w-full object-cover ${vLocked ? "blur-sm" : ""}`}
                      />
                      <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                        {vLocked ? (
                          <Lock className="h-10 w-10 text-white drop-shadow" />
                        ) : (
                          <PlayCircle className="h-12 w-12 text-white drop-shadow" />
                        )}
                      </div>
                      {vLocked && (
                        <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2 py-0.5 text-[10px] font-bold text-white">
                          <Lock className="h-3 w-3" /> Pro
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-2 text-sm font-semibold">{v.title}</h3>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </LibraryShell>
  );
}
