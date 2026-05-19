"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Settings, Upload, UserRound, X } from "lucide-react";
import { playZenithSound } from "@/lib/audio";
import { usePreferences } from "@/lib/preferences";
import { isStarterProfile, useProfiles } from "@/lib/profiles";

const SETUP_STORAGE_KEY = "zenith.firstRunSetup.dismissed.v1";

export default function FirstRunSetup() {
  const { loaded: preferencesLoaded } = usePreferences();
  const { activeProfile, state, loaded: profilesLoaded } = useProfiles();
  const [visible, setVisible] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!preferencesLoaded || !profilesLoaded) return;
    if (window.localStorage.getItem(SETUP_STORAGE_KEY)) return;
    const timer = window.setTimeout(() => {
      setVisible(true);
      playZenithSound("open");
    }, 700);
    return () => window.clearTimeout(timer);
  }, [preferencesLoaded, profilesLoaded]);

  useEffect(() => {
    if (!visible) return;
    document.body.classList.add("zenith-setup-open");
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      dismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("zenith-setup-open");
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible]);

  const dismiss = () => {
    window.localStorage.setItem(SETUP_STORAGE_KEY, new Date().toISOString());
    setVisible(false);
    playZenithSound("close");
  };

  const finish = () => {
    window.localStorage.setItem(SETUP_STORAGE_KEY, new Date().toISOString());
    setVisible(false);
    playZenithSound("success", { force: true });
  };

  if (!visible) return null;

  const hasProfile = state.profiles.length > 0 && !isStarterProfile(activeProfile);
  const profileLabel = activeProfile?.name?.trim() || (hasProfile ? "Profile saved" : "No profile yet");

  return (
    <div className="setup-overlay" role="presentation">
      <section className="setup-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title">
        <button ref={closeRef} type="button" className="setup-close" onClick={dismiss} aria-label="Close setup guide">
          <X size={16} />
        </button>
        <div className="setup-kicker">First time setup</div>
        <h2 id="setup-title">Make Zenith match your character before planning.</h2>
        <p>
          Zenith works best after you import or create a local profile, check your settings, and know how to back up your data.
        </p>

        <div className="setup-step-grid">
          <Link href="/profiles" className={`setup-step ${hasProfile ? "setup-step-done" : ""}`} onClick={finish}>
            <span><UserRound size={17} /></span>
            <strong>{hasProfile ? profileLabel : "Create or import profile"}</strong>
            <small>{hasProfile ? "Profile data is ready for calculators." : "Use your visible IdleMMO character hash or create one manually."}</small>
            {hasProfile && <CheckCircle2 size={16} />}
          </Link>

          <Link href="/settings" className="setup-step" onClick={finish}>
            <span><Settings size={17} /></span>
            <strong>Configure settings</strong>
            <small>Set membership, theme, navigation, sound, fallback tools, and custom prices.</small>
          </Link>

          <Link href="/profiles" className="setup-step" onClick={finish}>
            <span><Upload size={17} /></span>
            <strong>Know your backup path</strong>
            <small>Profiles are browser-local. Export JSON before changing browser or clearing data.</small>
          </Link>
        </div>

        <div className="setup-actions">
          <button type="button" className="setup-secondary" onClick={dismiss}>Remind me through tips</button>
          <button type="button" className="setup-primary" onClick={finish}>Start exploring</button>
        </div>
      </section>
    </div>
  );
}
