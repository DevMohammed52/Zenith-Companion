"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Download, Smartphone } from "lucide-react";
import { ZENITH_INSTALL_PROMPT_EVENT, type ZenithBeforeInstallPromptEvent } from "@/lib/pwa-install";

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

type InstallGuidance = {
  copy: string;
  title: string;
};

function isStandaloneDisplay() {
  const navigatorWithStandalone = navigator as NavigatorWithStandalone;
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function getInstallGuidance(userAgent: string): InstallGuidance {
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return {
      title: "iPhone / iPad",
      copy: "Open Zenith in Safari, use Share, then choose Add to Home Screen.",
    };
  }

  if (/Android/.test(userAgent)) {
    return {
      title: "Android",
      copy: "Use the browser menu, then choose Install app or Add to Home screen.",
    };
  }

  return {
    title: "Desktop",
    copy: "Use the install icon in the address bar when available, or the browser menu install action.",
  };
}

export default function InstallAppHelper() {
  const [promptEvent, setPromptEvent] = useState<ZenithBeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Checking install support.");
  const [guidance, setGuidance] = useState<InstallGuidance>({
    title: "Manual install",
    copy: "Use your browser install action when available.",
  });

  useEffect(() => {
    const syncInstallState = () => {
      const nextInstalled = isStandaloneDisplay();
      const nextPrompt = window.__zenithInstallPromptEvent ?? null;

      setInstalled(nextInstalled);
      setPromptEvent(nextInstalled ? null : nextPrompt);
      setGuidance(getInstallGuidance(navigator.userAgent));

      if (nextInstalled) {
        setMessage("Zenith is already running as an installed app.");
      } else if (nextPrompt) {
        setMessage("Your browser can show the install prompt now.");
      } else {
        setMessage("Use the manual install path for this browser.");
      }
    };

    syncInstallState();
    window.addEventListener(ZENITH_INSTALL_PROMPT_EVENT, syncInstallState);
    window.addEventListener("appinstalled", syncInstallState);

    return () => {
      window.removeEventListener(ZENITH_INSTALL_PROMPT_EVENT, syncInstallState);
      window.removeEventListener("appinstalled", syncInstallState);
    };
  }, []);

  const state = installed ? "installed" : promptEvent ? "ready" : "manual";
  const stateTitle = useMemo(() => {
    if (installed) return "Installed";
    if (promptEvent) return "Ready to install";
    return "Manual install";
  }, [installed, promptEvent]);

  const handleInstall = async () => {
    if (!promptEvent || busy) return;
    setBusy(true);

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      window.__zenithInstallPromptEvent = null;
      setPromptEvent(null);
      setMessage(
        choice.outcome === "accepted"
          ? "Install accepted. Your browser will finish setup."
          : "Install dismissed. You can still use the manual install path."
      );
      window.dispatchEvent(new Event(ZENITH_INSTALL_PROMPT_EVENT));
    } catch {
      setMessage("The browser install prompt could not be opened.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2><Download size={17} /> Install App</h2>
      <p className="settings-panel-note">
        Add Zenith to your device for a standalone app window and quicker access to cached public game data.
      </p>

      <div className={`settings-install-state settings-install-state-${state}`} aria-live="polite">
        <span className="settings-install-icon" aria-hidden="true">
          {installed ? <Check size={18} /> : <Smartphone size={18} />}
        </span>
        <span>
          <strong>{stateTitle}</strong>
          <small>{message}</small>
        </span>
      </div>

      <div className="settings-actions-row settings-install-actions">
        <button
          type="button"
          className="settings-link-button"
          onClick={handleInstall}
          disabled={!promptEvent || installed || busy}
          aria-label="Install Zenith Companion as an app"
        >
          <Download size={14} /> {busy ? "Opening..." : "Install Zenith"}
        </button>
      </div>

      <div className="settings-install-guidance">
        <strong>{guidance.title}</strong>
        <span>{guidance.copy}</span>
      </div>
      <p className="settings-empty-note">
        The install button appears only when the browser exposes a safe install prompt.
      </p>
    </>
  );
}
