"use client";

import { useEffect, useRef } from "react";
import { ZENITH_SOUND_EVENT, ZenithSoundCue } from "@/lib/audio";
import { usePreferences } from "@/lib/preferences";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type AmbientNodes = {
  gain: GainNode;
  filter: BiquadFilterNode;
  oscillators: OscillatorNode[];
  lfo: OscillatorNode;
  lfoGain: GainNode;
};

const interactiveSelector = [
  "button:not(:disabled)",
  "a[href]",
  "[role='button']",
  "[role='tab']",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
].join(",");

export default function ZenithAudio() {
  const { preferences, loaded } = usePreferences();
  const ctxRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<AmbientNodes | null>(null);
  const lastCueRef = useRef<Record<string, number>>({});
  const prefsRef = useRef(preferences);

  useEffect(() => {
    prefsRef.current = preferences;
  }, [preferences]);

  const ensureContext = () => {
    const ExistingAudioContext = window.AudioContext || window.webkitAudioContext;
    if (!ExistingAudioContext) return null;
    if (!ctxRef.current) ctxRef.current = new ExistingAudioContext();
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  };

  const outputLevel = (scale: number) => {
    const volume = Math.max(0, Math.min(1, (prefsRef.current.audioVolume ?? 35) / 100));
    return volume * scale;
  };

  const tone = (
    frequency: number,
    duration: number,
    options: { type?: OscillatorType; gain?: number; delay?: number; slideTo?: number } = {},
  ) => {
    const ctx = ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + (options.delay ?? 0);
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = options.type ?? "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    if (options.slideTo) oscillator.frequency.exponentialRampToValueAtTime(options.slideTo, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(outputLevel(options.gain ?? 0.045), now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.04);
  };

  const playCue = (cue: ZenithSoundCue) => {
    const notificationCue = cue === "notify" || cue === "success" || cue === "warning" || cue === "contact";
    if (notificationCue && !prefsRef.current.notificationSounds) return;
    if (!notificationCue && !prefsRef.current.soundEffects) return;

    const now = performance.now();
    const throttle = cue === "ui" ? 80 : 180;
    if (now - (lastCueRef.current[cue] ?? 0) < throttle) return;
    lastCueRef.current[cue] = now;

    if (cue === "ui") {
      tone(620, 0.05, { gain: 0.018, type: "triangle", slideTo: 760 });
      return;
    }

    if (cue === "open") {
      tone(392, 0.075, { gain: 0.025, type: "triangle" });
      tone(587, 0.09, { gain: 0.022, type: "sine", delay: 0.045 });
      return;
    }

    if (cue === "close") {
      tone(520, 0.08, { gain: 0.02, type: "triangle", slideTo: 330 });
      return;
    }

    if (cue === "success") {
      tone(523.25, 0.09, { gain: 0.032, type: "sine" });
      tone(659.25, 0.11, { gain: 0.03, type: "sine", delay: 0.06 });
      tone(783.99, 0.14, { gain: 0.024, type: "sine", delay: 0.13 });
      return;
    }

    if (cue === "warning") {
      tone(246.94, 0.08, { gain: 0.032, type: "sawtooth" });
      tone(196, 0.1, { gain: 0.028, type: "sawtooth", delay: 0.11 });
      return;
    }

    if (cue === "contact") {
      tone(349.23, 0.08, { gain: 0.026, type: "triangle" });
      tone(523.25, 0.13, { gain: 0.024, type: "sine", delay: 0.07 });
      return;
    }

    tone(440, 0.08, { gain: 0.022, type: "triangle" });
    tone(659.25, 0.13, { gain: 0.026, type: "sine", delay: 0.08 });
  };

  const stopAmbient = () => {
    const nodes = ambientRef.current;
    if (!nodes) return;
    const ctx = ctxRef.current;
    const now = ctx?.currentTime ?? 0;
    try {
      nodes.gain.gain.cancelScheduledValues(now);
      nodes.gain.gain.setTargetAtTime(0.0001, now, 0.45);
      window.setTimeout(() => {
        nodes.oscillators.forEach((oscillator) => {
          try { oscillator.stop(); } catch {}
        });
        try { nodes.lfo.stop(); } catch {}
      }, 800);
    } catch {}
    ambientRef.current = null;
  };

  const startAmbient = () => {
    if (ambientRef.current) return;
    const ctx = ensureContext();
    if (!ctx) return;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const now = ctx.currentTime;
    const oscillators = [196, 246.94, 329.63].map((frequency, index) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = index === 1 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.setValueAtTime(index === 0 ? -5 : index === 1 ? 3 : 8, now);
      oscillator.connect(filter);
      oscillator.start(now);
      return oscillator;
    });

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(720, now);
    filter.Q.setValueAtTime(0.35, now);
    lfo.frequency.setValueAtTime(0.045, now);
    lfoGain.gain.setValueAtTime(outputLevel(0.012), now);
    lfo.connect(lfoGain).connect(gain.gain);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.setTargetAtTime(outputLevel(0.035), now, 1.8);
    filter.connect(gain).connect(ctx.destination);
    lfo.start(now);
    ambientRef.current = { gain, filter, oscillators, lfo, lfoGain };
  };

  useEffect(() => {
    if (!loaded) return;
    if (preferences.ambientMusic) startAmbient();
    else stopAmbient();

    const nodes = ambientRef.current;
    if (nodes && ctxRef.current) {
      const now = ctxRef.current.currentTime;
      nodes.gain.gain.setTargetAtTime(outputLevel(0.035), now, 0.35);
      nodes.lfoGain.gain.setTargetAtTime(outputLevel(0.012), now, 0.35);
    }
  }, [loaded, preferences.ambientMusic, preferences.audioVolume]);

  useEffect(() => {
    const handleSound = (event: Event) => {
      const cue = (event as CustomEvent<ZenithSoundCue>).detail || "ui";
      playCue(cue);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!prefsRef.current.soundEffects) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(interactiveSelector)) return;
      playCue("ui");
    };
    window.addEventListener(ZENITH_SOUND_EVENT, handleSound);
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      window.removeEventListener(ZENITH_SOUND_EVENT, handleSound);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      stopAmbient();
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return null;
}
