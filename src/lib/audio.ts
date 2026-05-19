"use client";

export type ZenithSoundCue = "ui" | "open" | "close" | "notify" | "success" | "warning" | "contact";

export const ZENITH_SOUND_EVENT = "zenith-sound";

export function playZenithSound(cue: ZenithSoundCue = "ui") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ZenithSoundCue>(ZENITH_SOUND_EVENT, { detail: cue }));
}
