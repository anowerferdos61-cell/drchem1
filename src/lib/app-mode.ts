import { useEffect, useState } from "react";

const APP_MODE_STORAGE_KEY = "drchem_app_mode";

/**
 * Detects whether the app is running inside an installed PWA or Android TWA
 * (Play Store app shell) rather than a normal web browser tab.
 */
export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("source") === "app") {
      window.sessionStorage.setItem(APP_MODE_STORAGE_KEY, "1");
      return true;
    }

    if (window.sessionStorage.getItem(APP_MODE_STORAGE_KEY) === "1") {
      return true;
    }
  } catch {
    // Ignore storage access errors in restricted contexts.
  }

  if (window.matchMedia?.("(display-mode: standalone)").matches) {
    return true;
  }

  // iOS Safari home screen mode
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) {
    return true;
  }

  // Android TWA referrer
  if (typeof document !== "undefined" && document.referrer.startsWith("android-app://")) {
    return true;
  }

  return false;
}

/** Hydration-safe hook that returns true when running inside the installed app/TWA. */
export function useIsStandaloneApp(): boolean {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneApp());
  }, []);

  return standalone;
}
