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

    const pulse = () => {
      if (!prefsRef.current.mobileHaptics) return;
      if (!supportsCoarsePointer()) return;
      if (document.hidden || !document.hasFocus()) return;
      if (!navigator.vibrate) return;
      const now = performance.now();
      if (now - lastPulseRef.current < 120) return;
      lastPulseRef.current = now;
      navigator.vibrate(7);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(hapticTargets)) return;
      pulse();
    };

    document.addEventListener("pointerup", handlePointerUp, true);
    return () => document.removeEventListener("pointerup", handlePointerUp, true);
  }, [loaded]);

  return null;
}
