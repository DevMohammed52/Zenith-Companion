"use client";

import type { CanonicalSoundCue } from "./audio-sprite";

export const ZENITH_HAPTIC_EVENT = "zenith-haptic";

// All individual vibration segments stay <= 50ms per docs/design/17-sound-haptics-design.md.
export const HAPTIC_PATTERNS: Record<CanonicalSoundCue, number | number[]> = {
  select: [10],
  open: [8],
  close: [8],
  affirm: [12, 40, 12],
  complete: [20, 60, 20],
  warning: [18, 45, 18],
  error: [35, 50, 35, 50, 45],
};

export function resolveHapticPattern(cue: CanonicalSoundCue = "select"): number | number[] {
  return HAPTIC_PATTERNS[cue] ?? HAPTIC_PATTERNS.select;
}

export function triggerZenithHaptic(cue: CanonicalSoundCue = "select") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<{ cue: CanonicalSoundCue }>(ZENITH_HAPTIC_EVENT, { detail: { cue } }));
}
