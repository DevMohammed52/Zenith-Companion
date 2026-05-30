"use client";

import { useEffect } from "react";
import { ZENITH_INSTALL_PROMPT_EVENT, type ZenithBeforeInstallPromptEvent } from "@/lib/pwa-install";

export default function PwaInstallPromptCapture() {
  useEffect(() => {
    const notify = () => window.dispatchEvent(new Event(ZENITH_INSTALL_PROMPT_EVENT));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      window.__zenithInstallPromptEvent = event as ZenithBeforeInstallPromptEvent;
      notify();
    };

    const handleAppInstalled = () => {
      window.__zenithInstallPromptEvent = null;
      notify();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return null;
}
