"use client";

import {
  AUDIO_SPRITE_SLICES,
  AUDIO_SPRITE_SOURCES,
  type AudioSpriteFormat,
  type CanonicalSoundCue,
} from "./audio-sprite";

// Fixed, calibrated master output aligned with docs/design/17-sound-haptics-design.md.
export const CALIBRATED_MASTER_GAIN = 0.28;
export const LOWPASS_CUTOFF_HZ = 2500;
export const ATTACK_RAMP_SEC = 0.005;
export const RELEASE_RAMP_SEC = 0.005;

export function getCueDebounceMs(cue: CanonicalSoundCue): number {
  return cue === "select" ? 80 : 120;
}

export function shouldAllowCuePlayback(
  cue: CanonicalSoundCue,
  nowMs: number,
  lastPlayedMap: Record<string, number>,
): boolean {
  const previous = lastPlayedMap[cue] ?? -Infinity;
  return nowMs - previous >= getCueDebounceMs(cue);
}

export function selectPreferredSpriteFormat(
  canPlayType?: (mime: string) => string,
): AudioSpriteFormat {
  if (typeof canPlayType === "function") {
    const webmSupport = canPlayType('audio/webm; codecs="opus"');
    if (webmSupport === "probably" || webmSupport === "maybe") {
      return "webm";
    }
    return "mp3";
  }

  if (typeof document !== "undefined") {
    try {
      const probe = document.createElement("audio");
      const webmSupport = probe.canPlayType?.('audio/webm; codecs="opus"');
      if (webmSupport === "probably" || webmSupport === "maybe") {
        return "webm";
      }
      return "mp3";
    } catch {
      return "mp3";
    }
  }

  return "webm";
}

function getAudioContextConstructor(): (typeof AudioContext) | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  return win.AudioContext ?? globalThis.AudioContext ?? win.webkitAudioContext ?? null;
}

export interface ZenithAudioEngine {
  unlock: () => Promise<void>;
  play: (cue: CanonicalSoundCue) => void;
  dispose: () => void;
}

export function createZenithAudioEngine(): ZenithAudioEngine {
  let ctx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let lowpassFilter: BiquadFilterNode | null = null;
  let spriteBuffer: AudioBuffer | null = null;
  let loadedFormat: AudioSpriteFormat = "webm";
  let loadPromise: Promise<void> | null = null;
  let disposed = false;
  const lastPlayedAt: Record<string, number> = {};

  function ensureGraph(): AudioContext | null {
    if (disposed) return null;
    const Ctor = getAudioContextConstructor();
    if (!Ctor) return null;

    if (!ctx) {
      ctx = new Ctor();
      lowpassFilter = ctx.createBiquadFilter();
      lowpassFilter.type = "lowpass";
      lowpassFilter.frequency.setValueAtTime(LOWPASS_CUTOFF_HZ, ctx.currentTime);
      lowpassFilter.Q.setValueAtTime(0.7071, ctx.currentTime);

      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(CALIBRATED_MASTER_GAIN, ctx.currentTime);

      lowpassFilter.connect(masterGain);
      masterGain.connect(ctx.destination);
    }

    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
    }

    return ctx;
  }

  async function fetchAndDecode(audioCtx: AudioContext, format: AudioSpriteFormat): Promise<AudioBuffer> {
    const response = await fetch(AUDIO_SPRITE_SOURCES[format], { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} loading audio sprite`);
    }
    const raw = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(raw);
  }

  function ensureSpriteLoaded(existingCtx?: AudioContext | null): Promise<void> {
    if (disposed || spriteBuffer) return Promise.resolve();
    if (loadPromise) return loadPromise;

    const audioCtx = existingCtx ?? ensureGraph();
    if (!audioCtx) return Promise.resolve();

    const primaryFormat = selectPreferredSpriteFormat();
    const fallbackFormat: AudioSpriteFormat = primaryFormat === "webm" ? "mp3" : "webm";

    loadPromise = (async () => {
      try {
        spriteBuffer = await fetchAndDecode(audioCtx, primaryFormat);
        loadedFormat = primaryFormat;
      } catch {
        try {
          spriteBuffer = await fetchAndDecode(audioCtx, fallbackFormat);
          loadedFormat = fallbackFormat;
        } catch {
          loadPromise = null;
        }
      }
    })();

    return loadPromise;
  }

  function playFallbackTone(audioCtx: AudioContext, cue: CanonicalSoundCue) {
    if (!lowpassFilter) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const env = audioCtx.createGain();
    osc.type = "sine";

    const specs: Record<CanonicalSoundCue, { f0: number; f1: number; dur: number; gain: number }> = {
      select: { f0: 580, f1: 370, dur: 0.042, gain: 0.45 },
      affirm: { f0: 660, f1: 988, dur: 0.095, gain: 0.42 },
      open: { f0: 523, f1: 784, dur: 0.09, gain: 0.36 },
      close: { f0: 740, f1: 494, dur: 0.08, gain: 0.34 },
      complete: { f0: 659, f1: 1175, dur: 0.17, gain: 0.5 },
      warning: { f0: 330, f1: 330, dur: 0.11, gain: 0.44 },
      error: { f0: 311, f1: 220, dur: 0.14, gain: 0.46 },
    };

    const spec = specs[cue];
    osc.frequency.setValueAtTime(spec.f0, now);
    if (spec.f1 !== spec.f0) {
      osc.frequency.exponentialRampToValueAtTime(spec.f1, now + spec.dur * 0.75);
    }

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(spec.gain, now + ATTACK_RAMP_SEC);
    env.gain.exponentialRampToValueAtTime(0.0001, now + spec.dur);

    osc.connect(env);
    env.connect(lowpassFilter);
    osc.start(now);
    osc.stop(now + spec.dur + 0.005);
  }

  function playSpriteSlice(audioCtx: AudioContext, cue: CanonicalSoundCue) {
    if (!spriteBuffer || !lowpassFilter) return;
    const slice = AUDIO_SPRITE_SLICES[loadedFormat][cue];
    if (!slice) return;

    const now = audioCtx.currentTime;
    const source = audioCtx.createBufferSource();
    source.buffer = spriteBuffer;

    const envelope = audioCtx.createGain();
    const fadeStart = now + Math.max(ATTACK_RAMP_SEC, slice.duration - RELEASE_RAMP_SEC);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.linearRampToValueAtTime(1.0, now + ATTACK_RAMP_SEC);
    envelope.gain.setValueAtTime(1.0, fadeStart);
    envelope.gain.linearRampToValueAtTime(0.0001, now + slice.duration);

    source.connect(envelope);
    envelope.connect(lowpassFilter);
    source.start(now, slice.start, slice.duration);
  }

  return {
    async unlock() {
      const audioCtx = ensureGraph();
      if (!audioCtx) return;
      await ensureSpriteLoaded(audioCtx);
    },

    play(cue: CanonicalSoundCue) {
      if (disposed) return;
      const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();
      if (!shouldAllowCuePlayback(cue, nowMs, lastPlayedAt)) return;
      lastPlayedAt[cue] = nowMs;

      const audioCtx = ensureGraph();
      if (!audioCtx) return;

      if (spriteBuffer) {
        playSpriteSlice(audioCtx, cue);
      } else {
        void ensureSpriteLoaded(audioCtx);
        playFallbackTone(audioCtx, cue);
      }
    },

    dispose() {
      disposed = true;
      spriteBuffer = null;
      loadPromise = null;
      masterGain = null;
      lowpassFilter = null;
      if (ctx) {
        void ctx.close().catch(() => {});
        ctx = null;
      }
    },
  };
}
