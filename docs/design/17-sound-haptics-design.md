# Zenith Design Standards: Sound & Haptics

This document establishes the UI sound design principles, mobile tactile haptics, Web Audio API implementation architecture, accessibility compliance (WCAG 2.2), and asset licensing standards for Zenith Companion.

## 1. Core Principles & Acoustic Identity
* **Informative, Reassuring, Honest**: Following Material Design sound guidelines, audio cues in Zenith communicate system status and confirm user intent. Audio is never decorative, theatrical, or playful filler.
* **Silence as Intentional Negative Space**: Silence is the default state of Zenith. Audio is reserved strictly for meaningful interaction boundaries. An interface without sound is clean; an interface with excessive sound is irritating.
* **Abstract Micro-Earcons**: Zenith uses short, abstract synthesized micro-cues rather than skeuomorphic imitations (such as physical typewriter clicks or mechanical gears).
* **Single Acoustic Family**: All audio assets must share an identical acoustic timbre (soft, warm attack, low harmonic distortion, minimal high-frequency sharpness) so the application sounds cohesive.
* **Fletcher-Munson Equal Loudness & Frequency Banding**: The human ear is acutely sensitive to frequencies between 2 kHz and 5 kHz. Earcons must concentrate energy in the comfortable 300 Hz to 1.5 kHz range, with a steep low-pass filter rolloff above 2.5 kHz to eliminate piercing high-end sibilance.
* **Ambient Audio Category & Non-Interruption**: Following Apple Human Interface Guidelines, Zenith operates in the ambient category. It must never take exclusive audio focus or interrupt the player's background music (such as Spotify, YouTube, or podcasts). On iOS devices, all UI audio must respect the hardware Silent switch.
* **Semantic Meaning Over Component Coupling**: Sounds map to systemic outcomes, not specific DOM elements or button variants. Five universal meanings cover the entire application:
  1. `select` / `toggle`: Discrete tactile tick (30 to 50ms) for view changes.
  2. `copy` / `affirm`: Quiet ascending tone (80 to 140ms) confirming clipboard copy or quick save.
  3. `complete` / `sync`: Warm dual-tone chime (180 to 240ms) confirming character sync or market data refresh.
  4. `warning`: Low-mid neutral double-tap (120 to 160ms) for threshold alerts or rate limits.
  5. `error`: Muted descending tone (140 to 200ms) for network failure or validation error.

## 2. Accessibility & Non-Exclusivity (WCAG 2.2 Standards)
* **Sound Non-Exclusivity (SC 1.4.1)**: Audio and haptics must never serve as the sole indicator of any event, status change, or user action. Every sound must duplicate an explicit visual state change (such as an in-place checkmark, toast banner, or inline error text). Zenith must remain 100% functional, informative, and understandable when completely muted.
* **Audio Control & Autoplay Prevention (SC 1.4.2 & Advisory Technique G171)**:
  * Audio plays strictly in response to an intentional, direct user gesture (tap, click, or keyboard activation).
  * Never play audio on page load, route transition, or ambient background polling.
  * Zenith uses a fixed, calibrated master output level (`CALIBRATED_MASTER_GAIN = 0.28`) with steep low-pass filtering (`2.5 kHz`) rather than exposing sound volume or mute toggles in Settings, while providing a dedicated Master Haptics toggle (`preferences.mobileHaptics`) for mobile touch feedback.
  * Respect system accessibility settings and media playback state.
* **Screen Reader Coexistence**: Micro-sounds must not interfere with screen reader speech synthesizers (NVDA, JAWS, VoiceOver, TalkBack). Sound cues must feature immediate decay (sub-250ms), gentle attacks, and zero lingering reverb so screen reader announcements remain intelligible.

## 3. Strict Prohibitions (Banned Sound Triggers)
To prevent user annoyance, the following sound triggers are strictly forbidden:
* **No Hover Sounds**: Never trigger audio on cursor hover, focus traversal, or mouseover.
* **No Keystroke Sounds**: Never trigger audio on typing into text fields, search bars, or number inputs.
* **No Scroll Sounds**: Never trigger audio on page scroll or list panning.
* **No Page Load Sounds**: Never play introductory, ambient, or route entry sounds.
* **No Unprompted Recurring Sounds**: Never play timer ticks, unprompted carousel chimes, or background loops.

## 4. Web Audio API Architecture
* **Autoplay Policy & Context Lifecycle**:
  Modern browsers block `AudioContext` from running on initial document load (`state: "suspended"`). Attempting to play audio before an explicit gesture triggers browser warnings.
  * Do not create or resume `AudioContext` at script evaluation or component mount.
  * Initialize or resume the shared `AudioContext` strictly inside the first user gesture handler (`pointerdown`, `click`, or `keydown`).
* **Memory Buffer & Audio Sprites Over Media Elements**:
  * Avoid `<audio>` HTML elements: They suffer from high trigger latency (50 to 150ms), cannot reliably overlap, and require individual network connections.
  * Use the Web Audio API with pre-decoded `AudioBuffer` memory nodes or a single bundled audio sprite (`.webm` with `.mp3` fallback). Audio sprites package all 5 micro-sounds into one compact asset (<40 KB) loaded once and cached immutably.
* **Library & Implementation Engine Evaluation**:
  * **Raw Web Audio API (Recommended for Zenith)**: Zero external bundle footprint (0 KB). Provides direct microsecond-level control over `AudioContext` state, `AudioBufferSourceNode` creation, master `GainNode` scaling, and custom event decoupling (`zenith:toast`).
  * **use-sound / Howler.js**: Excellent React hook abstraction (`useSound`) built on top of Howler. If adopted in future iterations, audio sprites (`sprite` map) must be used to bundle all sounds into a single file, and leading silence must be trimmed to 0ms to eliminate tap-to-audio latency.
  * **Tone.js**: Powerful synthesis and scheduling library, but introduces substantial bundle weight (~150 KB minified). For 5 short utility earcons, synthesized Tone.js oscillators are disproportionate and unnecessary.
* **Gain Nodes & Volume Envelope**:
  * Route all playback through a shared `2.5 kHz` low-pass `BiquadFilterNode` into a calibrated master `GainNode` (`0.28`).
  * Apply a 5ms linear attack and release ramp (`gainNode.gain.linearRampToValueAtTime`) on playback initiation and termination to prevent audible DC-offset speaker clicks or popping transients.
* **Rate Limiting & Debounce Guard**:
  * Enforce an 80ms acoustic debounce window per sound key. If a player rapidly clicks ten item prices or copy buttons in a second, subsequent triggers within the window are dropped silently to prevent acoustic clipping and audio fatigue.
* **Pitch & Polarity**:
  * Positive affirmations feature rising pitch polarity.
  * Negative failures feature descending pitch polarity.
  * Never rely on pitch alone to communicate severity.

## 5. Mobile Tactile Haptics (`navigator.vibrate`)
On touch-enabled mobile devices (Android / PWA), haptic vibrations provide tactile confirmation matching physical hardware clicks.
* **Hardware Availability & User Consent**:
  * Check `typeof navigator.vibrate === 'function'` before invocation.
  * Gate execution behind `preferences.mobileHaptics` independently so muted mobile users still receive tactile feedback when enabled.
* **Standard Vibration Patterns**:
  * **Light Selection** (segmented control, dock tab): `[10]` (single 10ms crisp tap).
  * **Affirmation / Copy** (clipboard copy, quick save): `[12, 40, 12]` (two micro-pulses).
  * **Success / Sync Complete** (profile import, cloud save): `[20, 60, 20]` (two solid pulses).
  * **Error / Conflict** (network drop, invalid input): `[35, 50, 35, 50, 45]` (three distinct warning pulses).
* **Battery & Ergonomic Protection**: Never run haptic patterns longer than 50ms per pulse or trigger haptics during high-frequency gestures (e.g. dragging sliders or scrolling tables).

## 6. Sound Asset Sourcing & Licensing Standards
* **Permitted Licenses**: Every audio asset added to Zenith Companion must carry explicit permissive licensing suitable for commercial and open-source distribution:
  * Creative Commons Zero (CC0 1.0 Universal - Public Domain).
  * MIT or BSD audio code generators.
* **Approved Primary Repositories**:
  * **Kenney UI Audio & Interface Sounds** (CC0 Public Domain).
  * **sfxr / jsfxr** (synthesized algorithmic 8-bit/retro micro-clicks, 100% public domain).
  * **Freesound.org** (CC0 files only; license and author must be verified and logged).
* **Licensing Manifest Requirement**:
  Any committed sound file or sprite in `public/audio/` must be catalogued in `public/audio/LICENSE.md` with file name, duration, source URL, author, and license grant.
