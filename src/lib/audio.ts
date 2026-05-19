"use client";

export type ZenithSoundCue = "ui" | "open" | "close" | "notify" | "success" | "warning" | "contact";
export type ZenithSoundRequest = {
  cue: ZenithSoundCue;
  force?: boolean;
};

export const ZENITH_SOUND_EVENT = "zenith-sound";

export function playZenithSound(cue: ZenithSoundCue = "ui", options: { force?: boolean } = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ZenithSoundRequest>(ZENITH_SOUND_EVENT, { detail: { cue, force: options.force } }));
}
