"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Download, Smartphone } from "lucide-react";
import { ZENITH_INSTALL_PROMPT_EVENT, type ZenithBeforeInstallPromptEvent } from "@/lib/pwa-install";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import styles from "@/app/settings/Settings.module.css";

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
    <Card
      className={`settings-panel settings-install-panel ${styles.fullWidth}`}
      title={
        <h2 className={styles.cardTitle}>
          <Download size={18} style={{ color: "var(--text-accent)" }} />
          Install App
        </h2>
      }
      subtitle={
        <p className={styles.cardSubtitle}>
          Add Zenith to your device for a standalone app window and quicker access to cached public game data.
        </p>
      }
    >
      <div
        className={`settings-install-state settings-install-state-${state}`}
        aria-live="polite"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "8px",
          padding: "0.75rem 1rem",
        }}
      >
        <span
          className="settings-install-icon"
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: installed
              ? "rgba(34, 197, 94, 0.15)"
              : "color-mix(in srgb, var(--text-accent), transparent 85%)",
            color: installed ? "#22c55e" : "var(--text-accent)",
          }}
        >
          {installed ? <Check size={18} /> : <Smartphone size={18} />}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <strong style={{ color: "var(--text-main)", fontSize: "0.95rem" }}>
            {stateTitle}
          </strong>
          <small style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            {message}
          </small>
        </div>
      </div>

      <div
        className="settings-actions-row settings-install-actions"
        style={{ marginTop: "1rem" }}
      >
        <Button
          variant="secondary"
          size="sm"
          icon={<Download size={14} />}
          onClick={handleInstall}
          disabled={!promptEvent || installed || busy}
          aria-label="Install Zenith Companion as an app"
          className="settings-link-button"
        >
          {busy ? "Opening..." : "Install Zenith"}
        </Button>
      </div>

      <div
        className="settings-install-guidance"
        style={{
          marginTop: "1rem",
          background: "rgba(255, 255, 255, 0.015)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "8px",
          padding: "0.75rem 0.95rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}
      >
        <strong style={{ color: "var(--text-main)", fontSize: "0.85rem" }}>
          {guidance.title}
        </strong>
        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.45 }}>
          {guidance.copy}
        </span>
      </div>

      <p className={styles.storageStatusNote}>
        The install button appears only when the browser exposes a safe install prompt.
      </p>
    </Card>
  );
}
