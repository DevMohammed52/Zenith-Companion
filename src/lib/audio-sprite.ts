export type AudioSpriteFormat = "webm" | "mp3";

export type CanonicalSoundCue =
  | "select"
  | "affirm"
  | "open"
  | "close"
  | "complete"
  | "warning"
  | "error";

export interface SpriteSlice {
  start: number;
  duration: number;
}

export const AUDIO_SPRITE_SOURCES: Record<AudioSpriteFormat, string> = {
  webm: "/audio/zenith-ui-sprite.webm",
  mp3: "/audio/zenith-ui-sprite.mp3",
};

// Measured decoded PCM onset/offset slices per codec so encoder delay never adds tap latency.
export const AUDIO_SPRITE_SLICES: Record<AudioSpriteFormat, Record<CanonicalSoundCue, SpriteSlice>> = {
  "webm": {
    "select": {
      "start": 0.0383,
      "duration": 0.047
    },
    "affirm": {
      "start": 0.3391,
      "duration": 0.1196
    },
    "open": {
      "start": 0.6392,
      "duration": 0.1021
    },
    "close": {
      "start": 0.9392,
      "duration": 0.0896
    },
    "complete": {
      "start": 1.2392,
      "duration": 0.2232
    },
    "warning": {
      "start": 1.5378,
      "duration": 0.1573
    },
    "error": {
      "start": 1.8368,
      "duration": 0.1903
    }
  },
  "mp3": {
    "select": {
      "start": 0.0392,
      "duration": 0.0462
    },
    "affirm": {
      "start": 0.3391,
      "duration": 0.1195
    },
    "open": {
      "start": 0.6392,
      "duration": 0.102
    },
    "close": {
      "start": 0.9392,
      "duration": 0.0897
    },
    "complete": {
      "start": 1.2392,
      "duration": 0.2233
    },
    "warning": {
      "start": 1.5392,
      "duration": 0.1559
    },
    "error": {
      "start": 1.8392,
      "duration": 0.1879
    }
  }
};
