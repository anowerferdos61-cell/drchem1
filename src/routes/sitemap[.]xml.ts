import { createFileRoute } from "@tanstack/react-router";
import { LAB_TOPICS } from "@/lib/lab-topics";
import { CHAPTER_TOPICS } from "@/lib/chapter-topics";

const BASE_URL = "https://drchemedu.com";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const coreEntries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/chapters", changefreq: "daily", priority: "0.95" },
          { path: "/labs", changefreq: "daily", priority: "0.9" },
          { path: "/pricing", changefreq: "weekly", priority: "0.8" },
          { path: "/signup", changefreq: "monthly", priority: "0.7" },
          { path: "/login", changefreq: "monthly", priority: "0.5" },
        ];

        const chapterEntries: SitemapEntry[] = CHAPTER_TOPICS.map((chapter) => ({
          path: `/chapters/${chapter.chapterNumber}`,
          changefreq: "weekly",
          priority: "0.9",
        }));

        const labTopicEntries: SitemapEntry[] = LAB_TOPICS.map((topic) => ({
          path: `/labs/${topic.slug}`,
          changefreq: "weekly",
          priority: "0.85",
        }));

        const entries = [...coreEntries, ...chapterEntries, ...labTopicEntries];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
