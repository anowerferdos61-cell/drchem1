import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { AnalyticsTracker } from "@/lib/analytics-tracker";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dr. Chem — AI-Powered Virtual Chemistry Lab for Class 9-10" },
      {
        name: "description",
        content:
          "Dr. Chem is an AI-powered virtual chemistry lab for Class 9-10 students and teachers — safe interactive experiments, an AI tutor, and viva practice in Bangla and English.",
      },
      { name: "author", content: "Dr. Chem" },
      { property: "og:site_name", content: "Dr. Chem" },
      { property: "og:title", content: "Dr. Chem — AI-Powered Virtual Chemistry Lab for Class 9-10" },
      {
        property: "og:description",
        content:
          "Safe, visual, AI-guided chemistry experiments for Class 9-10 — titration, pH scale, oxygen prep, bonding and more.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Dr. Chem — AI-Powered Virtual Chemistry Lab for Class 9-10" },
      {
        name: "twitter:description",
        content:
          "Safe, visual, AI-guided chemistry experiments for Class 9-10 students and teachers.",
      },
      { name: "description", content: "Perform chemistry experiments safely, learn visually, and get instant help from the Dr. Chem AI tutor. Built for Bangladeshi Class 9-10 students and teachers." },
      { property: "og:description", content: "Perform chemistry experiments safely, learn visually, and get instant help from the Dr. Chem AI tutor. Built for Bangladeshi Class 9-10 students and teachers." },
      { name: "twitter:description", content: "Perform chemistry experiments safely, learn visually, and get instant help from the Dr. Chem AI tutor. Built for Bangladeshi Class 9-10 students and teachers." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/BNbspVP1QLgQXV1xmKzQ4H5W7yJ2/social-images/social-1780481523006-Gemini_Generated_Image_2no3022no3022no3.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/BNbspVP1QLgQXV1xmKzQ4H5W7yJ2/social-images/social-1780481523006-Gemini_Generated_Image_2no3022no3022no3.webp" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Dr. Chem",
          url: "https://drchem.lovable.app",
          description:
            "AI-powered virtual chemistry lab for Class 9-10 students and teachers.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Dr. Chem",
          url: "https://drchem.lovable.app",
        }),
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") {
        return;
      }

      router.invalidate();

      if (event === "SIGNED_OUT") {
        void queryClient.cancelQueries().then(() => queryClient.clear());
        return;
      }

      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
