"use client";

import { useCallback, useEffect, useRef } from "react";
import { ZENITH_SOUND_EVENT, type ZenithSoundCue, type ZenithSoundRequest } from "@/lib/audio";
import { usePreferences } from "@/lib/preferences";

const interactiveSelector = [
  "button:not(:disabled)",
  "a[href]",
  "summary",
  "[role='button']",
  "[role='tab']",
  "input[type='button']:not(:disabled)",
  "input[type='checkbox']:not(:disabled)",
  "input[type='radio']:not(:disabled)",
  "input[type='range']:not(:disabled)",
  "input[type='reset']:not(:disabled)",
  "input[type='submit']:not(:disabled)",
  "select:not(:disabled)",
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

const notificationCues = new Set<ZenithSoundCue>(["notify", "success", "warning", "contact"]);

export default function ZenithAudio() {
  const { preferences, loaded } = usePreferences();
  const sfxRef = useRef<Partial<Record<Exclude<ZenithSoundCue, "lofi">, HTMLAudioElement>>>({});
  const lastCueRef = useRef<Record<string, number>>({});
  const prefsRef = useRef(preferences);
  const activeRef = useRef(true);

  const currentVolume = useCallback((scale = 1) => {
    return Math.max(0, Math.min(1, ((prefsRef.current.audioVolume ?? 35) / 100) * scale));
  }, []);

  const refreshVolumes = useCallback(() => {
    Object.values(sfxRef.current).forEach((audio) => {
      if (audio) audio.volume = currentVolume(0.78);
    });
  }, [currentVolume]);

  const getSfx = useCallback((cue: Exclude<ZenithSoundCue, "lofi">) => {
    if (!sfxRef.current[cue]) {
      const audio = new Audio(sfxSources[cue]);
      audio.preload = "auto";
      audio.volume = currentVolume(0.78);
      sfxRef.current[cue] = audio;
    }
    return sfxRef.current[cue];
  }, [currentVolume]);

  const releaseAudio = useCallback(() => {
    Object.values(sfxRef.current).forEach((audio) => {
      if (!audio) return;
      audio.pause();
      audio.src = "";
    });
    sfxRef.current = {};
  }, []);

  const playCue = useCallback((cue: ZenithSoundCue, options: { force?: boolean } = {}) => {
    if (!activeRef.current) return;
    if (cue === "lofi") return;
    if (!options.force && notificationCues.has(cue) && !prefsRef.current.notificationSounds) return;
    if (!options.force && !notificationCues.has(cue) && !prefsRef.current.soundEffects) return;

    const now = performance.now();
    const throttle = cue === "ui" ? 75 : 170;
    if (now - (lastCueRef.current[cue] ?? 0) < throttle) return;
    lastCueRef.current[cue] = now;

    const audio = getSfx(cue as Exclude<ZenithSoundCue, "lofi">);
    if (!audio) return;
    refreshVolumes();
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  }, [getSfx, refreshVolumes]);

  useEffect(() => {
    prefsRef.current = preferences;
    refreshVolumes();
  }, [loaded, preferences, refreshVolumes]);

  useEffect(() => {
    const refreshActiveState = () => {
      activeRef.current = !document.hidden && document.hasFocus();
    };

    const handleSound = (event: Event) => {
      const detail = (event as CustomEvent<ZenithSoundRequest | ZenithSoundCue>).detail || "ui";
      const request = typeof detail === "string" ? { cue: detail } : detail;
      playCue(request.cue, { force: request.force });
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!event.isTrusted || event.defaultPrevented || event.button !== 0) return;
      if (!prefsRef.current.soundEffects) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(interactiveSelector)) return;
      if (target.closest("[aria-disabled='true'], [data-zenith-sound='off']")) return;
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
      releaseAudio();
    };
  }, [playCue, releaseAudio]);

  return null;
}
