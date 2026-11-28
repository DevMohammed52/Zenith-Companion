import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AUDIO_SPRITE_SLICES,
  AUDIO_SPRITE_SOURCES,
  type CanonicalSoundCue,
} from "../../src/lib/audio-sprite";
import {
  mapToastVariantToCue,
  playZenithSound,
  resolveSoundCue,
  ZENITH_SOUND_EVENT,
} from "../../src/lib/audio";
import {
  CALIBRATED_MASTER_GAIN,
  createZenithAudioEngine,
  LOWPASS_CUTOFF_HZ,
  selectPreferredSpriteFormat,
  shouldAllowCuePlayback,
} from "../../src/lib/audio-engine";
import { HAPTIC_PATTERNS, resolveHapticPattern } from "../../src/lib/haptics";

const ROOT = process.cwd();
const ALL_CUES: CanonicalSoundCue[] = [
  "select",
  "affirm",
  "open",
  "close",
  "complete",
  "warning",
  "error",
];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Audio sprite assets & licensing contracts", () => {
  it("bundles compact WebM Opus + MP3 sprites (< 40 KB each) and removes lofi/legacy ogg bloat", () => {
    const webmPath = path.join(ROOT, "public", "audio", "zenith-ui-sprite.webm");
    const mp3Path = path.join(ROOT, "public", "audio", "zenith-ui-sprite.mp3");
    const licensePath = path.join(ROOT, "public", "audio", "LICENSE.md");

    expect(fs.existsSync(webmPath)).toBe(true);
    expect(fs.existsSync(mp3Path)).toBe(true);
    expect(fs.existsSync(licensePath)).toBe(true);
    expect(fs.statSync(webmPath).size).toBeLessThan(40_000);
    expect(fs.statSync(mp3Path).size).toBeLessThan(40_000);

    expect(fs.existsSync(path.join(ROOT, "public", "audio", "music"))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, "public", "audio", "ui"))).toBe(false);
    expect(AUDIO_SPRITE_SOURCES.webm).toBe("/audio/zenith-ui-sprite.webm");
    expect(AUDIO_SPRITE_SOURCES.mp3).toBe("/audio/zenith-ui-sprite.mp3");
  });

  it("maintains non-overlapping <250ms sprite slices across webm and mp3", () => {
    for (const format of ["webm", "mp3"] as const) {
      const slices = ALL_CUES.map((cue) => ({ cue, ...AUDIO_SPRITE_SLICES[format][cue] })).sort(
        (a, b) => a.start - b.start,
      );
      for (let i = 0; i < slices.length; i++) {
        const curr = slices[i];
        expect(curr.start).toBeGreaterThanOrEqual(0);
        expect(curr.duration).toBeGreaterThan(0.02);
        expect(curr.duration).toBeLessThan(0.25);
        if (i + 1 < slices.length) {
          expect(curr.start + curr.duration).toBeLessThan(slices[i + 1].start);
        }
      }
    }
  });
});

describe("Sound cue resolution, toast mapping & Web Audio engine", () => {
  it("resolves canonical and legacy cues and maps toast variants cleanly", () => {
    expect(resolveSoundCue("ui")).toBe("select");
    expect(resolveSoundCue("notify")).toBe("affirm");
    expect(resolveSoundCue("success")).toBe("complete");
    expect(resolveSoundCue("contact")).toBe("complete");
    expect(resolveSoundCue("error")).toBe("error");

    expect(mapToastVariantToCue("success")).toBe("complete");
    expect(mapToastVariantToCue("warning")).toBe("warning");
    expect(mapToastVariantToCue("error")).toBe("error");
    expect(mapToastVariantToCue("info")).toBe("affirm");
    expect(mapToastVariantToCue(undefined)).toBe("affirm");
  });

  it("selects WebM Opus when supported and falls back to MP3 otherwise", () => {
    expect(selectPreferredSpriteFormat((mime) => (mime.includes("webm") ? "probably" : ""))).toBe("webm");
    expect(selectPreferredSpriteFormat(() => "")).toBe("mp3");
  });

  it("enforces per-cue acoustic debounce windows", () => {
    const map: Record<string, number> = { select: 1000, complete: 1000 };
    expect(shouldAllowCuePlayback("select", 1040, map)).toBe(false);
    expect(shouldAllowCuePlayback("select", 1085, map)).toBe(true);
    expect(shouldAllowCuePlayback("complete", 1100, map)).toBe(false);
    expect(shouldAllowCuePlayback("complete", 1125, map)).toBe(true);
  });

  it("dispatches custom sound events via playZenithSound", () => {
    const dispatched: string[] = [];
    const listener = (event: Event) => {
      dispatched.push((event as CustomEvent<{ cue: string }>).detail.cue);
    };
    vi.stubGlobal("window", new EventTarget());
    window.addEventListener(ZENITH_SOUND_EVENT, listener);
    playZenithSound("complete");
    expect(dispatched).toEqual(["complete"]);
  });

  it("builds a lazy Web Audio graph with calibrated gain, 2.5 kHz low-pass filter, sprite slicing, and cleanup", async () => {
    const closeSpy = vi.fn(async () => {});
    const resumeSpy = vi.fn(async () => {});
    const startBufferSpy = vi.fn();
    const startOscSpy = vi.fn();
    const filterFreqSpy = vi.fn();
    const masterGainSpy = vi.fn();

    class FakeAudioContext {
      currentTime = 0;
      state: AudioContextState = "suspended";
      destination = {};
      resume = resumeSpy;
      close = closeSpy;
      createBiquadFilter() {
        return {
          type: "lowpass",
          frequency: { setValueAtTime: filterFreqSpy },
          Q: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
        };
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: masterGainSpy,
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        };
      }
      createOscillator() {
        return {
          type: "sine",
          frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: startOscSpy,
          stop: vi.fn(),
        };
      }
      createBufferSource() {
        return {
          buffer: null,
          connect: vi.fn(),
          start: startBufferSpy,
        };
      }
      async decodeAudioData() {
        return { duration: 2.1 } as AudioBuffer;
      }
    }

    const fetchSpy = vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(16),
    }));

    let ctxConstructCount = 0;
    const WrappedCtx = function () {
      ctxConstructCount += 1;
      return new FakeAudioContext();
    };
    vi.stubGlobal("window", { AudioContext: WrappedCtx });
    vi.stubGlobal("fetch", fetchSpy);

    const engine = createZenithAudioEngine();
    expect(ctxConstructCount).toBe(0);

    await engine.unlock();
    expect(ctxConstructCount).toBe(1);
    expect(resumeSpy).toHaveBeenCalledTimes(1);
    expect(filterFreqSpy).toHaveBeenCalledWith(LOWPASS_CUTOFF_HZ, 0);
    expect(masterGainSpy).toHaveBeenCalledWith(CALIBRATED_MASTER_GAIN, 0);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    engine.play("complete");
    expect(startBufferSpy).toHaveBeenCalledTimes(1);
    const [, startOffset, dur] = startBufferSpy.mock.calls[0];
    expect(startOffset).toBeGreaterThan(1.0);
    expect(dur).toBeCloseTo(AUDIO_SPRITE_SLICES.webm.complete.duration, 4);

    engine.dispose();
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });
});

describe("Semantic haptics & Settings UI constraints", () => {
  it("caps every vibration pulse duration at <= 50ms (even-indexed vibrate segments)", () => {
    for (const cue of ALL_CUES) {
      const pattern = resolveHapticPattern(cue);
      const segments = Array.isArray(pattern) ? pattern : [pattern];
      expect(segments.length).toBeGreaterThan(0);
      for (let i = 0; i < segments.length; i += 2) {
        expect(segments[i]).toBeGreaterThan(0);
        expect(segments[i]).toBeLessThanOrEqual(50);
      }
    }
    expect(HAPTIC_PATTERNS.error).toEqual([35, 50, 35, 50, 45]);
  });

  it("does not expose volume sliders or sound enable/disable toggles in AppearancePanel or Preferences", () => {
    const appearanceSrc = fs.readFileSync(
      path.join(ROOT, "src", "app", "settings", "components", "AppearancePanel.tsx"),
      "utf8",
    );
    const prefsSrc = fs.readFileSync(path.join(ROOT, "src", "lib", "preferences.ts"), "utf8");

    expect(appearanceSrc).not.toContain("Interaction Sounds");
    expect(appearanceSrc).not.toContain("soundEffects");
    expect(appearanceSrc).not.toContain("audioVolume");
    expect(appearanceSrc).toContain("mobileHaptics");
    expect(prefsSrc).not.toContain("ambientMusic:");
    expect(prefsSrc).not.toContain("soundEffects:");
    expect(prefsSrc).not.toContain("audioVolume:");
  });
});
