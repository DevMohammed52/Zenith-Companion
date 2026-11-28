"use client";

import { useEffect, useRef } from "react";
import { mapToastVariantToCue } from "@/lib/audio";
import type { CanonicalSoundCue } from "@/lib/audio-sprite";
import { resolveHapticPattern, ZENITH_HAPTIC_EVENT } from "@/lib/haptics";
import { usePreferences } from "@/lib/preferences";

const HAPTIC_CLICK_SELECTOR = [
  "button:not(:disabled)",
  "a[href]",
  "summary",
  "[role='button']",
  "[role='tab']",
  "[role='switch']",
  "input[type='checkbox']:not(:disabled)",
  "input[type='radio']:not(:disabled)",
].join(",");

export default function ZenithHaptics() {
  const { preferences, loaded } = usePreferences();
  const prefsRef = useRef(preferences);
  const lastPulseByCueRef = useRef<Record<string, number>>({});

  useEffect(() => {
    prefsRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    if (!loaded) return;

    const supportsCoarsePointer = () => {
      if (typeof window === "undefined" || !window.matchMedia) return false;
      return window.matchMedia("(pointer: coarse)").matches;
    };

    const prefersReducedMotion = () => {
      if (typeof window === "undefined" || !window.matchMedia) return true;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    };

    const pulse = (cue: CanonicalSoundCue) => {
      if (!prefsRef.current.mobileHaptics) return;
      if (!supportsCoarsePointer()) return;
      if (prefersReducedMotion()) return;
      if (document.hidden) return;
      if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;

      const now = performance.now();
      const throttleMs = cue === "select" ? 90 : 160;
      if (now - (lastPulseByCueRef.current[cue] ?? -Infinity) < throttleMs) return;
      lastPulseByCueRef.current[cue] = now;
      navigator.vibrate(resolveHapticPattern(cue));
    };

    const handleClick = (event: MouseEvent) => {
      if (!event.isTrusted || event.defaultPrevented) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(HAPTIC_CLICK_SELECTOR)) return;
      if (target.closest("[aria-disabled='true'], [data-zenith-haptics='off']")) return;
      pulse("select");
    };

    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<{ variant?: string }>).detail;
      pulse(mapToastVariantToCue(detail?.variant));
    };

    const handleCustomHaptic = (event: Event) => {
      const detail = (event as CustomEvent<{ cue?: CanonicalSoundCue }>).detail;
      pulse(detail?.cue ?? "select");
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("zenith:toast", handleToast);
    window.addEventListener(ZENITH_HAPTIC_EVENT, handleCustomHaptic);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("zenith:toast", handleToast);
      window.removeEventListener(ZENITH_HAPTIC_EVENT, handleCustomHaptic);
    };
  }, [loaded]);

  return null;
}
