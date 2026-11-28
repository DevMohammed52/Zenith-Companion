"""
Builds Zenith Companion's cohesive Astral Slate UI audio sprite.

Synthesizes 7 warm, low-harmonic micro-earcons strictly shaped to
docs/design/17-sound-haptics-design.md (300 Hz - 1.5 kHz focus,
steep low-pass rolloff <= 2.5 kHz, 5 ms anti-click envelopes, <= 240 ms decay),
encodes public/audio/zenith-ui-sprite.webm (Opus) and .mp3 (LAME fallback),
decodes both back to PCM to measure exact codec onset offsets, and emits
src/lib/audio-sprite.ts with calibrated slice timings.
"""

from __future__ import annotations

import json
import math
import os
import subprocess
import tempfile
import wave
from pathlib import Path
import numpy as np
import static_ffmpeg

SAMPLE_RATE = 48000
ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "public" / "audio"
SPRITE_TS_PATH = ROOT / "src" / "lib" / "audio-sprite.ts"


def get_ffmpeg_exe() -> str:
    ffmpeg_path, _ = static_ffmpeg.run.get_or_fetch_platform_executables_else_raise()
    return str(ffmpeg_path)


def biquad_lowpass(signal: np.ndarray, cutoff_hz: float, q: float = 0.7071) -> np.ndarray:
    """Two-pass bilinear biquad low-pass filter (4th-order rolloff, zero DC shift)."""
    w0 = 2.0 * math.pi * cutoff_hz / SAMPLE_RATE
    cos_w0 = math.cos(w0)
    alpha = math.sin(w0) / (2.0 * q)

    b0 = (1.0 - cos_w0) / 2.0
    b1 = 1.0 - cos_w0
    b2 = (1.0 - cos_w0) / 2.0
    a0 = 1.0 + alpha
    a1 = -2.0 * cos_w0
    a2 = 1.0 - alpha

    b0 /= a0
    b1 /= a0
    b2 /= a0
    a1 /= a0
    a2 /= a0

    def single_pass(x: np.ndarray) -> np.ndarray:
        y = np.empty_like(x)
        x1 = x2 = y1 = y2 = 0.0
        for i in range(x.shape[0]):
            x0 = float(x[i])
            y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
            y[i] = y0
            x2, x1 = x1, x0
            y2, y1 = y1, y0
        return y

    return single_pass(single_pass(signal))


def fade_envelope(n: int, attack_ms: float = 4.0, release_ms: float = 12.0) -> np.ndarray:
    env = np.ones(n, dtype=np.float64)
    a_samples = min(n // 2, max(1, int(round(attack_ms * SAMPLE_RATE / 1000.0))))
    r_samples = min(n - a_samples, max(1, int(round(release_ms * SAMPLE_RATE / 1000.0))))
    # Smooth half-cosine onset prevents speaker DC pop transients
    env[:a_samples] = 0.5 * (1.0 - np.cos(np.pi * np.arange(a_samples) / a_samples))
    env[-r_samples:] = 0.5 * (1.0 + np.cos(np.pi * np.arange(1, r_samples + 1) / r_samples))
    return env


def synth_mallet_note(
    freq_start: float,
    duration_ms: float,
    *,
    freq_end: float | None = None,
    attack_ms: float = 4.0,
    decay_tau_ms: float = 35.0,
    second_harmonic: float = 0.14,
    third_harmonic: float = 0.03,
    amplitude: float = 0.65,
) -> np.ndarray:
    n = max(1, int(round(duration_ms * SAMPLE_RATE / 1000.0)))
    t = np.arange(n, dtype=np.float64) / SAMPLE_RATE

    if freq_end is None or abs(freq_end - freq_start) < 0.01:
        phase = 2.0 * math.pi * freq_start * t
    else:
        # Smooth pitch glide across the note window
        tau = max(duration_ms * 0.38, 8.0) / 1000.0
        inst_freq = freq_end + (freq_start - freq_end) * np.exp(-t / tau)
        phase = 2.0 * math.pi * np.cumsum(inst_freq) / SAMPLE_RATE

    tau_1 = decay_tau_ms / 1000.0
    tau_2 = tau_1 * 0.42
    tau_3 = tau_1 * 0.25

    tone = (
        np.sin(phase) * np.exp(-t / tau_1)
        + second_harmonic * np.sin(2.0 * phase) * np.exp(-t / tau_2)
        + third_harmonic * np.sin(3.0 * phase) * np.exp(-t / tau_3)
    )
    tone *= fade_envelope(n, attack_ms=attack_ms, release_ms=min(14.0, duration_ms * 0.35))
    peak = np.max(np.abs(tone)) or 1.0
    return (tone / peak) * amplitude


def synth_select() -> np.ndarray:
    # Discrete tactile felt-glass tick (42 ms)
    body = synth_mallet_note(
        620.0,
        42.0,
        freq_end=370.0,
        attack_ms=2.5,
        decay_tau_ms=11.0,
        second_harmonic=0.12,
        third_harmonic=0.02,
        amplitude=0.58,
    )
    # Soft damped felt impulse for organic physical tactility (strictly low-passed)
    rng = np.random.default_rng(42)
    impulse_n = int(round(0.012 * SAMPLE_RATE))
    t_imp = np.arange(impulse_n, dtype=np.float64) / SAMPLE_RATE
    noise = rng.normal(0.0, 1.0, impulse_n) * np.exp(-t_imp / 0.0022)
    noise = biquad_lowpass(noise, 1150.0)
    noise = (noise / (np.max(np.abs(noise)) or 1.0)) * 0.14
    out = body.copy()
    out[:impulse_n] += noise
    return biquad_lowpass(out, 2200.0)


def synth_affirm() -> np.ndarray:
    # Quiet ascending two-note confirmation (115 ms): E5 -> B5
    total_n = int(round(0.115 * SAMPLE_RATE))
    out = np.zeros(total_n, dtype=np.float64)
    n1 = synth_mallet_note(659.25, 65.0, attack_ms=4.0, decay_tau_ms=22.0, second_harmonic=0.14, amplitude=0.45)
    n2 = synth_mallet_note(987.77, 73.0, attack_ms=4.5, decay_tau_ms=28.0, second_harmonic=0.10, amplitude=0.52)
    offset = int(round(0.042 * SAMPLE_RATE))
    out[: n1.shape[0]] += n1
    out[offset : offset + n2.shape[0]] += n2
    return biquad_lowpass(out, 2350.0)


def synth_open() -> np.ndarray:
    # Soft bloom ascending D5 -> A5 (98 ms)
    body = synth_mallet_note(
        523.25,
        98.0,
        freq_end=783.99,
        attack_ms=10.0,
        decay_tau_ms=34.0,
        second_harmonic=0.10,
        third_harmonic=0.0,
        amplitude=0.42,
    )
    return biquad_lowpass(body, 2100.0)


def synth_close() -> np.ndarray:
    # Soft damped descend G5 -> D5 (86 ms)
    body = synth_mallet_note(
        740.0,
        86.0,
        freq_end=493.88,
        attack_ms=5.0,
        decay_tau_ms=26.0,
        second_harmonic=0.09,
        third_harmonic=0.0,
        amplitude=0.40,
    )
    return biquad_lowpass(body, 2000.0)


def synth_complete() -> np.ndarray:
    # Warm dual-tone success chime (220 ms): E5 -> A5 + fifth warmth
    total_n = int(round(0.220 * SAMPLE_RATE))
    out = np.zeros(total_n, dtype=np.float64)
    root = synth_mallet_note(659.25, 115.0, attack_ms=5.0, decay_tau_ms=42.0, second_harmonic=0.15, amplitude=0.46)
    fifth = synth_mallet_note(987.77, 110.0, attack_ms=6.0, decay_tau_ms=36.0, second_harmonic=0.08, amplitude=0.22)
    octave_note = synth_mallet_note(1174.66, 145.0, attack_ms=6.0, decay_tau_ms=56.0, second_harmonic=0.08, amplitude=0.54)
    offset = int(round(0.074 * SAMPLE_RATE))
    out[: root.shape[0]] += root
    out[: fifth.shape[0]] += fifth
    out[offset : offset + octave_note.shape[0]] += octave_note
    return biquad_lowpass(out, 2350.0)


def synth_warning() -> np.ndarray:
    # Neutral low-mid double pulse (155 ms): D4 + A4 soft body
    total_n = int(round(0.155 * SAMPLE_RATE))
    out = np.zeros(total_n, dtype=np.float64)
    p1_a = synth_mallet_note(329.63, 56.0, attack_ms=4.5, decay_tau_ms=20.0, second_harmonic=0.12, amplitude=0.42)
    p1_b = synth_mallet_note(493.88, 56.0, attack_ms=5.0, decay_tau_ms=18.0, second_harmonic=0.06, amplitude=0.18)
    p2_a = synth_mallet_note(329.63, 74.0, attack_ms=4.5, decay_tau_ms=28.0, second_harmonic=0.12, amplitude=0.48)
    p2_b = synth_mallet_note(493.88, 74.0, attack_ms=5.0, decay_tau_ms=24.0, second_harmonic=0.06, amplitude=0.20)
    offset = int(round(0.078 * SAMPLE_RATE))
    out[: p1_a.shape[0]] += p1_a + p1_b
    out[offset : offset + p2_a.shape[0]] += p2_a + p2_b
    return biquad_lowpass(out, 1850.0)


def synth_error() -> np.ndarray:
    # Muted descending negative cue (185 ms): D4 -> B3 -> A3
    total_n = int(round(0.185 * SAMPLE_RATE))
    out = np.zeros(total_n, dtype=np.float64)
    n1 = synth_mallet_note(
        311.13,
        74.0,
        freq_end=261.63,
        attack_ms=5.0,
        decay_tau_ms=26.0,
        second_harmonic=0.14,
        amplitude=0.48,
    )
    n2 = synth_mallet_note(
        246.94,
        104.0,
        freq_end=207.65,
        attack_ms=5.0,
        decay_tau_ms=40.0,
        second_harmonic=0.16,
        amplitude=0.52,
    )
    offset = int(round(0.080 * SAMPLE_RATE))
    out[: n1.shape[0]] += n1
    out[offset : offset + n2.shape[0]] += n2
    return biquad_lowpass(out, 1650.0)


def trim_and_normalize(signal: np.ndarray, target_peak: float = 0.72) -> np.ndarray:
    # Ensure strict 0 ms leading silence while starting on a clean fade
    abs_sig = np.abs(signal)
    nonzero = np.where(abs_sig > 2e-4)[0]
    if nonzero.size > 0:
        start = int(nonzero[0])
        end = int(nonzero[-1]) + 1
        signal = signal[start:end]
    # Remove any sub-LSB DC offset
    signal = signal - float(np.mean(signal))
    peak = float(np.max(np.abs(signal)) or 1.0)
    normalized = (signal / peak) * target_peak
    # Enforce zero-crossing edge smooth taper (1.5 ms tail)
    tail_n = min(normalized.shape[0] // 4, int(round(0.002 * SAMPLE_RATE)))
    if tail_n > 1:
        normalized[-tail_n:] *= np.linspace(1.0, 0.0, tail_n)
    return normalized


def write_wav(path: Path, samples: np.ndarray) -> None:
    clipped = np.clip(samples, -0.999, 0.999)
    pcm = (clipped * 32767.0).astype("<i2")
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm.tobytes())


def read_pcm_float(ffmpeg: str, encoded_path: Path) -> np.ndarray:
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav_path = Path(tmp.name)
    try:
        subprocess.run(
            [ffmpeg, "-y", "-i", str(encoded_path), "-ac", "1", "-ar", str(SAMPLE_RATE), str(wav_path)],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        with wave.open(str(wav_path), "rb") as wf:
            frames = wf.readframes(wf.getnframes())
        return np.frombuffer(frames, dtype="<i2").astype(np.float64) / 32767.0
    finally:
        wav_path.unlink(missing_ok=True)


def measure_slot_bounds(
    pcm: np.ndarray,
    slots: list[tuple[str, float, int]],
    slot_step_sec: float,
) -> dict[str, dict[str, float]]:
    result: dict[str, dict[str, float]] = {}
    for cue, slot_start_sec, expected_samples in slots:
        lo = max(0, int(round((slot_start_sec - 0.03) * SAMPLE_RATE)))
        hi = min(pcm.shape[0], int(round((slot_start_sec + slot_step_sec - 0.03) * SAMPLE_RATE)))
        window = np.abs(pcm[lo:hi])
        active = np.where(window > 0.0025)[0]
        if active.size == 0:
            start_sec = round(slot_start_sec, 4)
            dur_sec = round(expected_samples / SAMPLE_RATE, 4)
        else:
            onset_idx = max(0, lo + int(active[0]) - int(round(0.001 * SAMPLE_RATE)))
            offset_idx = min(pcm.shape[0], lo + int(active[-1]) + int(round(0.006 * SAMPLE_RATE)))
            start_sec = round(onset_idx / SAMPLE_RATE, 4)
            dur_sec = round(max(expected_samples / SAMPLE_RATE, (offset_idx - onset_idx) / SAMPLE_RATE), 4)
        result[cue] = {"start": start_sec, "duration": dur_sec}
    return result


def main() -> None:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    ffmpeg = get_ffmpeg_exe()

    cues: list[tuple[str, np.ndarray]] = [
        ("select", trim_and_normalize(synth_select(), target_peak=0.62)),
        ("affirm", trim_and_normalize(synth_affirm(), target_peak=0.66)),
        ("open", trim_and_normalize(synth_open(), target_peak=0.58)),
        ("close", trim_and_normalize(synth_close(), target_peak=0.56)),
        ("complete", trim_and_normalize(synth_complete(), target_peak=0.72)),
        ("warning", trim_and_normalize(synth_warning(), target_peak=0.68)),
        ("error", trim_and_normalize(synth_error(), target_peak=0.70)),
    ]

    # Guarded slot grid prevents MP3/Opus MDCT frame priming from bleeding across cues
    slot_step_sec = 0.300
    leading_pad_sec = 0.040
    total_samples = int(round((leading_pad_sec + len(cues) * slot_step_sec + 0.060) * SAMPLE_RATE))
    sprite_pcm = np.zeros(total_samples, dtype=np.float64)

    slot_meta: list[tuple[str, float, int]] = []
    for idx, (cue, wav_data) in enumerate(cues):
        slot_start_sec = leading_pad_sec + idx * slot_step_sec
        start_sample = int(round(slot_start_sec * SAMPLE_RATE))
        end_sample = start_sample + wav_data.shape[0]
        sprite_pcm[start_sample:end_sample] = wav_data
        slot_meta.append((cue, slot_start_sec, wav_data.shape[0]))
        dur_ms = round(wav_data.shape[0] * 1000.0 / SAMPLE_RATE, 1)
        rms_db = round(20.0 * math.log10(float(np.sqrt(np.mean(wav_data**2))) + 1e-9), 1)
        print(f"Synthesized {cue:9s}: {dur_ms:5.1f} ms | RMS {rms_db:5.1f} dBFS | peak {float(np.max(np.abs(wav_data))):.2f}")

    webm_path = AUDIO_DIR / "zenith-ui-sprite.webm"
    mp3_path = AUDIO_DIR / "zenith-ui-sprite.mp3"

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_wav:
        master_wav = Path(tmp_wav.name)

    try:
        write_wav(master_wav, sprite_pcm)
        subprocess.run(
            [
                ffmpeg,
                "-y",
                "-i",
                str(master_wav),
                "-c:a",
                "libopus",
                "-b:a",
                "96k",
                "-vbr",
                "on",
                "-application",
                "audio",
                str(webm_path),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        subprocess.run(
            [
                ffmpeg,
                "-y",
                "-i",
                str(master_wav),
                "-c:a",
                "libmp3lame",
                "-b:a",
                "128k",
                str(mp3_path),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    finally:
        master_wav.unlink(missing_ok=True)

    webm_pcm = read_pcm_float(ffmpeg, webm_path)
    mp3_pcm = read_pcm_float(ffmpeg, mp3_path)
    webm_slices = measure_slot_bounds(webm_pcm, slot_meta, slot_step_sec)
    mp3_slices = measure_slot_bounds(mp3_pcm, slot_meta, slot_step_sec)

    webm_size = webm_path.stat().st_size
    mp3_size = mp3_path.stat().st_size
    print(f"Encoded {webm_path.name}: {webm_size} bytes")
    print(f"Encoded {mp3_path.name}: {mp3_size} bytes")

    ts_content = f"""export type AudioSpriteFormat = "webm" | "mp3";

export type CanonicalSoundCue =
  | "select"
  | "affirm"
  | "open"
  | "close"
  | "complete"
  | "warning"
  | "error";

export interface SpriteSlice {{
  start: number;
  duration: number;
}}

export const AUDIO_SPRITE_SOURCES: Record<AudioSpriteFormat, string> = {{
  webm: "/audio/zenith-ui-sprite.webm",
  mp3: "/audio/zenith-ui-sprite.mp3",
}};

// Measured decoded PCM onset/offset slices per codec so encoder delay never adds tap latency.
export const AUDIO_SPRITE_SLICES: Record<AudioSpriteFormat, Record<CanonicalSoundCue, SpriteSlice>> = {json.dumps({"webm": webm_slices, "mp3": mp3_slices}, indent=2)};
"""
    SPRITE_TS_PATH.write_text(ts_content, encoding="utf-8")
    print(f"Wrote {SPRITE_TS_PATH} ({os.path.getsize(SPRITE_TS_PATH)} bytes)")


if __name__ == "__main__":
    main()
