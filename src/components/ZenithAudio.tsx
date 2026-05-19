"use client";

import { useEffect, useRef } from "react";
import { ZENITH_SOUND_EVENT, ZenithSoundCue, ZenithSoundRequest } from "@/lib/audio";
import { usePreferences } from "@/lib/preferences";

const interactiveSelector = [
  "button:not(:disabled)",
  "a[href]",
  "[role='button']",
  "[role='tab']",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
].join(",");

const sfxSources: Record<Exclude<ZenithSoundCue, "lofi">, string> = {
  ui: "/audio/ui/click.ogg",
  open: "/audio/ui/open.ogg",
  close: "/audio/ui/close.ogg",
  notify: "/audio/ui/notify.ogg",
  success: "/audio/ui/success.ogg",
  warning: "/audio/ui/warning.ogg",
  contact: "/audio/ui/contact.ogg",
};

const musicSource = "/audio/music/lofi-loop.ogg";
const notificationCues = new Set<ZenithSoundCue>(["notify", "success", "warning", "contact"]);

export default function ZenithAudio() {
  const { preferences, loaded } = usePreferences();
  const sfxRef = useRef<Partial<Record<Exclude<ZenithSoundCue, "lofi">, HTMLAudioElement>>>({});
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const lastCueRef = useRef<Record<string, number>>({});
  const prefsRef = useRef(preferences);
  const activeRef = useRef(true);

  const currentVolume = (scale = 1) => Math.max(0, Math.min(1, ((prefsRef.current.audioVolume ?? 35) / 100) * scale));

  const refreshVolumes = () => {
    Object.values(sfxRef.current).forEach((audio) => {
      if (audio) audio.volume = currentVolume(0.78);
    });
    if (musicRef.current) musicRef.current.volume = currentVolume(0.48);
  };

  const getSfx = (cue: Exclude<ZenithSoundCue, "lofi">) => {
    if (!sfxRef.current[cue]) {
      const audio = new Audio(sfxSources[cue]);
      audio.preload = "auto";
      audio.volume = currentVolume(0.78);
      sfxRef.current[cue] = audio;
    }
    return sfxRef.current[cue];
  };

  const stopMusic = () => {
    if (!musicRef.current) return;
    musicRef.current.pause();
  };

  const startMusic = () => {
    if (!activeRef.current) return;
    if (!musicRef.current) {
      const audio = new Audio(musicSource);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = currentVolume(0.48);
      musicRef.current = audio;
    }
    refreshVolumes();
    void musicRef.current.play().catch(() => {});
  };

  const playCue = (cue: ZenithSoundCue, options: { force?: boolean } = {}) => {
    if (!activeRef.current) return;
    if (cue === "lofi") {
      startMusic();
      return;
    }
    if (!options.force && notificationCues.has(cue) && !prefsRef.current.notificationSounds) return;
    if (!options.force && !notificationCues.has(cue) && !prefsRef.current.soundEffects) return;

    const now = performance.now();
    const throttle = cue === "ui" ? 75 : 170;
    if (now - (lastCueRef.current[cue] ?? 0) < throttle) return;
    lastCueRef.current[cue] = now;

    const audio = getSfx(cue);
    if (!audio) return;
    refreshVolumes();
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  };

  useEffect(() => {
    prefsRef.current = preferences;
    refreshVolumes();
    if (!loaded) return;
    if (preferences.ambientMusic && activeRef.current) startMusic();
    else stopMusic();
  }, [loaded, preferences, preferences.audioVolume]);

  useEffect(() => {
    const refreshActiveState = () => {
      const active = !document.hidden && document.hasFocus();
      activeRef.current = active;
      if (!active) {
        stopMusic();
        return;
      }
      if (prefsRef.current.ambientMusic) startMusic();
    };

    const handleSound = (event: Event) => {
      const detail = (event as CustomEvent<ZenithSoundRequest | ZenithSoundCue>).detail || "ui";
      const request = typeof detail === "string" ? { cue: detail } : detail;
      playCue(request.cue, { force: request.force });
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!prefsRef.current.soundEffects) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(interactiveSelector)) return;
      playCue("ui");
    };

    window.addEventListener(ZENITH_SOUND_EVENT, handleSound);
    window.addEventListener("focus", refreshActiveState);
    window.addEventListener("blur", refreshActiveState);
    document.addEventListener("visibilitychange", refreshActiveState);
    document.addEventListener("pointerdown", handlePointerDown, true);
    refreshActiveState();

    return () => {
      window.removeEventListener(ZENITH_SOUND_EVENT, handleSound);
      window.removeEventListener("focus", refreshActiveState);
      window.removeEventListener("blur", refreshActiveState);
      document.removeEventListener("visibilitychange", refreshActiveState);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      stopMusic();
      Object.values(sfxRef.current).forEach((audio) => {
        if (!audio) return;
        audio.pause();
        audio.src = "";
      });
      if (musicRef.current) musicRef.current.src = "";
    };
  }, []);

  return null;
}
