"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("SW registration failed:", err));
    }

    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      if (!dismissed && !standalone) setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowBanner(false);
  };

  const dismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "1");
    setShowBanner(false);
  };

  if (isStandalone || !showBanner || !installPrompt) return null;

  return (
    <div className="install-banner">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
          <Download size={18} className="text-black" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Install LearnTrack</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Add to home screen for app-like experience</p>
        </div>
        <button type="button" onClick={dismiss} className="btn-icon !min-h-0 !min-w-0 !border-0 !p-1">
          <X size={16} />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={install} className="btn btn-primary flex-1">
          Install
        </button>
        <button type="button" onClick={dismiss} className="btn btn-secondary">
          Later
        </button>
      </div>
    </div>
  );
}
