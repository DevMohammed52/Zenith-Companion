# Audio Assets

* `zenith-ui-sprite.webm` (~25 KB, ~2.1s, 48 kHz Opus) — Generated via `scripts/build-zenith-audio-sprite.py` (Zenith Companion project, CC0 1.0 Universal). Contains 7 calibrated micro-earcons (`select`, `affirm`, `open`, `close`, `complete`, `warning`, `error`) filtered <= 2.5 kHz with 5 ms envelopes.
* `zenith-ui-sprite.mp3` (~36 KB, ~2.1s, 48 kHz LAME MP3) — Fallback companion sprite generated from the exact same master PCM buffer via `scripts/build-zenith-audio-sprite.py` (Zenith Companion project, CC0 1.0 Universal) for browsers without WebM/Opus decoding.
