"use client";

import { useEffect, useRef } from "react";
import { ZENITH_SOUND_EVENT, ZenithSoundCue, ZenithSoundRequest } from "@/lib/audio";
import { usePreferences } from "@/lib/preferences";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type LofiLoopNodes = {
  gain: GainNode;
  timer: number;
  nextStep: number;
  nextTime: number;
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
  const lofiRef = useRef<LofiLoopNodes | null>(null);
  const lastCueRef = useRef<Record<string, number>>({});
  const prefsRef = useRef(preferences);
  const activeRef = useRef(true);

  useEffect(() => {
    prefsRef.current = preferences;
  }, [preferences]);

  const ensureContext = () => {
    if (!activeRef.current) return null;
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

  const playCue = (cue: ZenithSoundCue, options: { force?: boolean } = {}) => {
    if (!activeRef.current) return;
    if (cue === "lofi") {
      startAmbient();
      return;
    }
    const notificationCue = cue === "notify" || cue === "success" || cue === "warning" || cue === "contact";
    if (!options.force && notificationCue && !prefsRef.current.notificationSounds) return;
    if (!options.force && !notificationCue && !prefsRef.current.soundEffects) return;

    const now = performance.now();
    const throttle = cue === "ui" ? 80 : 180;
    if (now - (lastCueRef.current[cue] ?? 0) < throttle) return;
    lastCueRef.current[cue] = now;

    if (cue === "ui") {
      tone(620, 0.055, { gain: 0.035, type: "triangle", slideTo: 760 });
      return;
    }

    if (cue === "open") {
      tone(392, 0.085, { gain: 0.048, type: "triangle" });
      tone(587, 0.11, { gain: 0.042, type: "sine", delay: 0.045 });
      return;
    }

    if (cue === "close") {
      tone(520, 0.09, { gain: 0.038, type: "triangle", slideTo: 330 });
      return;
    }

    if (cue === "success") {
      tone(523.25, 0.1, { gain: 0.06, type: "sine" });
      tone(659.25, 0.13, { gain: 0.055, type: "sine", delay: 0.06 });
      tone(783.99, 0.16, { gain: 0.045, type: "sine", delay: 0.13 });
      return;
    }

    if (cue === "warning") {
      tone(246.94, 0.09, { gain: 0.05, type: "sawtooth" });
      tone(196, 0.12, { gain: 0.045, type: "sawtooth", delay: 0.11 });
      return;
    }

    if (cue === "contact") {
      tone(349.23, 0.09, { gain: 0.048, type: "triangle" });
      tone(523.25, 0.15, { gain: 0.045, type: "sine", delay: 0.07 });
      return;
    }

    tone(440, 0.09, { gain: 0.045, type: "triangle" });
    tone(659.25, 0.14, { gain: 0.05, type: "sine", delay: 0.08 });
  };

  const scheduleKick = (ctx: AudioContext, destination: AudioNode, time: number) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(92, time);
    oscillator.frequency.exponentialRampToValueAtTime(46, time + 0.16);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(outputLevel(0.16), time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);
    oscillator.connect(gain).connect(destination);
    oscillator.start(time);
    oscillator.stop(time + 0.32);
  };

  const scheduleNoiseHit = (
    ctx: AudioContext,
    destination: AudioNode,
    time: number,
    options: { duration: number; gain: number; frequency: number; type: BiquadFilterType },
  ) => {
    const samples = Math.max(1, Math.floor(ctx.sampleRate * options.duration));
    const buffer = ctx.createBuffer(1, samples, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < samples; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / samples);
    }
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = options.type;
    filter.frequency.setValueAtTime(options.frequency, time);
    filter.Q.setValueAtTime(0.7, time);
    gain.gain.setValueAtTime(outputLevel(options.gain), time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + options.duration);
    source.connect(filter).connect(gain).connect(destination);
    source.start(time);
  };

  const scheduleChord = (ctx: AudioContext, destination: AudioNode, time: number, root: number) => {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, time);
    filter.Q.setValueAtTime(0.45, time);
    filter.connect(destination);

    [root, root * 1.25, root * 1.5].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, time);
      oscillator.detune.setValueAtTime(index === 1 ? -7 : index === 2 ? 5 : -3, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(outputLevel(0.032), time + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.82);
      oscillator.connect(gain).connect(filter);
      oscillator.start(time);
      oscillator.stop(time + 0.9);
    });
  };

  const stopAmbient = () => {
    const nodes = lofiRef.current;
    if (!nodes) return;
    const ctx = ctxRef.current;
    const now = ctx?.currentTime ?? 0;
    try {
      nodes.gain.gain.cancelScheduledValues(now);
      nodes.gain.gain.setTargetAtTime(0.0001, now, 0.25);
      window.clearInterval(nodes.timer);
    } catch {}
    lofiRef.current = null;
  };

  const startAmbient = () => {
    if (!activeRef.current) return;
    if (lofiRef.current) return;
    const ctx = ensureContext();
    if (!ctx) return;
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.setTargetAtTime(outputLevel(0.38), now, 0.35);
    gain.connect(ctx.destination);

    const nodes: LofiLoopNodes = {
      gain,
      timer: 0,
      nextStep: 0,
      nextTime: now + 0.08,
    };

    const stepDuration = 0.48;
    const chords = [174.61, 146.83, 164.81, 130.81];
    const schedule = () => {
      const live = lofiRef.current;
      if (!live) return;
      while (live.nextTime < ctx.currentTime + 0.75) {
        const step = live.nextStep % 16;
        const bar = Math.floor(live.nextStep / 16) % chords.length;

        if (step === 0 || step === 8) scheduleKick(ctx, live.gain, live.nextTime);
        if (step === 4 || step === 12) {
          scheduleNoiseHit(ctx, live.gain, live.nextTime, {
            duration: 0.16,
            gain: 0.052,
            frequency: 1550,
            type: "bandpass",
          });
        }
        if (step % 2 === 1) {
          scheduleNoiseHit(ctx, live.gain, live.nextTime, {
            duration: 0.045,
            gain: 0.018,
            frequency: 5200,
            type: "highpass",
          });
        }
        if (step === 0 || step === 6 || step === 10) {
          scheduleChord(ctx, live.gain, live.nextTime + 0.025, chords[bar]);
        }

        live.nextStep += 1;
        live.nextTime += stepDuration;
      }
    };

    schedule();
    nodes.timer = window.setInterval(schedule, 180);
    lofiRef.current = nodes;
  };

  useEffect(() => {
    if (!loaded) return;
    if (preferences.ambientMusic && activeRef.current) startAmbient();
    else stopAmbient();

    const nodes = lofiRef.current;
    if (nodes && ctxRef.current) {
      const now = ctxRef.current.currentTime;
      nodes.gain.gain.setTargetAtTime(outputLevel(0.38), now, 0.25);
    }
  }, [loaded, preferences.ambientMusic, preferences.audioVolume]);

  useEffect(() => {
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
    const refreshActiveState = () => {
      const active = !document.hidden && document.hasFocus();
      activeRef.current = active;
      if (!active) {
        stopAmbient();
        void ctxRef.current?.suspend();
        return;
      }
      if (prefsRef.current.ambientMusic) startAmbient();
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
      stopAmbient();
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return null;
}
