"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }

    // Handle install prompt
    let deferredPrompt: any = null;
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      // Could show a custom install button here
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  return null;
}
