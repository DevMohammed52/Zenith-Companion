"use client";

import { useEffect, useRef } from "react";
import {
  mapToastVariantToCue,
  resolveSoundCue,
  ZENITH_SOUND_EVENT,
  type ZenithSoundRequest,
} from "@/lib/audio";
import { createZenithAudioEngine, type ZenithAudioEngine } from "@/lib/audio-engine";

// Trigger tactile select clicks on genuine button/tab/toggle activations (excluding range drags and text typing).
const INTERACTIVE_CLICK_SELECTOR = [
  "button:not(:disabled)",
  "a[href]",
  "summary",
  "[role='button']",
  "[role='tab']",
  "[role='switch']",
  "input[type='button']:not(:disabled)",
  "input[type='checkbox']:not(:disabled)",
  "input[type='radio']:not(:disabled)",
  "input[type='reset']:not(:disabled)",
  "input[type='submit']:not(:disabled)",
  "select:not(:disabled)",
].join(",");

export default function ZenithAudio() {
  const engineRef = useRef<ZenithAudioEngine | null>(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    const engine = createZenithAudioEngine();
    engineRef.current = engine;

    const canEmitSound = () => typeof document !== "undefined" && !document.hidden;

    const unlockFromGesture = () => {
      if (!canEmitSound()) return;
      unlockedRef.current = true;
      void engine.unlock();
    };

    const handleClick = (event: MouseEvent) => {
      if (!event.isTrusted || event.defaultPrevented || !canEmitSound()) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(INTERACTIVE_CLICK_SELECTOR)) return;
      if (target.closest("[aria-disabled='true'], [data-zenith-sound='off']")) return;
      unlockedRef.current = true;
      engine.play("select");
    };

    const handleCustomSound = (event: Event) => {
      if (!canEmitSound() || !unlockedRef.current) return;
      const detail = (event as CustomEvent<ZenithSoundRequest | string>).detail;
      const rawCue = typeof detail === "string" ? detail : detail?.cue;
      engine.play(resolveSoundCue(rawCue as Parameters<typeof resolveSoundCue>[0]));
    };

    const handleToast = (event: Event) => {
      if (!canEmitSound() || !unlockedRef.current) return;
      const detail = (event as CustomEvent<{ variant?: string }>).detail;
      engine.play(mapToastVariantToCue(detail?.variant));
    };

    document.addEventListener("pointerdown", unlockFromGesture, { capture: true, passive: true });
    document.addEventListener("keydown", unlockFromGesture, { capture: true, passive: true });
    document.addEventListener("click", handleClick, true);
    window.addEventListener(ZENITH_SOUND_EVENT, handleCustomSound);
    window.addEventListener("zenith:toast", handleToast);

    return () => {
      document.removeEventListener("pointerdown", unlockFromGesture, true);
      document.removeEventListener("keydown", unlockFromGesture, true);
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener(ZENITH_SOUND_EVENT, handleCustomSound);
      window.removeEventListener("zenith:toast", handleToast);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  return null;
}
