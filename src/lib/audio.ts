"use client";

import type { CanonicalSoundCue } from "./audio-sprite";

export type LegacySoundCue = "ui" | "notify" | "success" | "contact";
export type ZenithSoundCue = CanonicalSoundCue | LegacySoundCue;

export type ZenithSoundRequest = {
  cue: ZenithSoundCue;
};

export const ZENITH_SOUND_EVENT = "zenith-sound";

const CUE_ALIASES: Record<ZenithSoundCue, CanonicalSoundCue> = {
  select: "select",
  ui: "select",
  affirm: "affirm",
  notify: "affirm",
  open: "open",
  close: "close",
  complete: "complete",
  success: "complete",
  contact: "complete",
  warning: "warning",
  error: "error",
};

export function resolveSoundCue(cue: ZenithSoundCue = "select"): CanonicalSoundCue {
  return CUE_ALIASES[cue] ?? "select";
}

export function mapToastVariantToCue(variant?: string): CanonicalSoundCue {
  if (variant === "success") return "complete";
  if (variant === "warning") return "warning";
  if (variant === "error") return "error";
  return "affirm";
}

export function playZenithSound(cue: ZenithSoundCue = "select") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ZenithSoundRequest>(ZENITH_SOUND_EVENT, { detail: { cue } }));
}
