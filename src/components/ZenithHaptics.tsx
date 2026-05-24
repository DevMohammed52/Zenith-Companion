"use client";

import { useEffect, useRef } from "react";
import { usePreferences } from "@/lib/preferences";

const hapticTargets = [
  "button:not(:disabled)",
  "a[href]",
  "summary",
  "[role='button']",
  "[role='tab']",
  "input[type='range']:not(:disabled)",
].join(",");

export default function ZenithHaptics() {
  const { preferences, loaded } = usePreferences();
  const prefsRef = useRef(preferences);
  const lastPulseRef = useRef(0);

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

    const pulse = () => {
      if (!prefsRef.current.mobileHaptics) return;
      if (!supportsCoarsePointer()) return;
      if (prefersReducedMotion()) return;
      if (document.hidden || !document.hasFocus()) return;
      if (!navigator.vibrate) return;
      const now = performance.now();
      if (now - lastPulseRef.current < 120) return;
      lastPulseRef.current = now;
      navigator.vibrate(7);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!event.isTrusted || event.defaultPrevented || event.pointerType !== "touch") return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(hapticTargets)) return;
      if (target.closest("[aria-disabled='true'], [data-zenith-haptics='off']")) return;
      pulse();
    };

    document.addEventListener("pointerup", handlePointerUp, true);
    return () => document.removeEventListener("pointerup", handlePointerUp, true);
  }, [loaded]);

  return null;
}
