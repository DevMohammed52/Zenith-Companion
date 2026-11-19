"use client";

import { Check, Sparkles, Volume2 } from "lucide-react";
import { playZenithSound } from "@/lib/audio";
import type { UseSettingsStateReturn } from "../types";

export default function AccountPanel({
  state,
}: {
  state: Pick<
    UseSettingsStateReturn,
    "preferences" | "setPreferences" | "setAudioVolume"
  >;
}) {
  const { preferences, setPreferences, setAudioVolume } = state;

  return (
    <div className="settings-panel">
      <h2><Sparkles size={17} /> Account</h2>
      <div className="settings-fields">
        <label className="settings-field">
          <span><strong>Membership</strong><small>Switches market tax between 15% and 12%.</small></span>
          <button
            type="button"
            className="control-input settings-toggle-button"
            aria-pressed={preferences.membership}
            onClick={() => setPreferences({ membership: !preferences.membership })}
          >
            {preferences.membership && <Check size={14} />} {preferences.membership ? "Member active" : "Free account"}
          </button>
        </label>
      </div>
      <div className="settings-audio-panel" aria-label="Audio feedback settings">
        <div className="settings-audio-heading">
          <span><Volume2 size={15} /> Audio feedback</span>
          <button
            type="button"
            onClick={() => playZenithSound(preferences.notificationSounds ? "success" : "open", { force: true })}
            disabled={!preferences.soundEffects && !preferences.notificationSounds}
          >
            Preview
          </button>
        </div>
        <div className="settings-nav-style settings-nav-style-three" aria-label="Interface and tip sound toggles">
          <span>Sound choices</span>
          <div>
            <button
              type="button"
              className={preferences.soundEffects ? "settings-nav-style-active" : ""}
              aria-pressed={preferences.soundEffects}
              onClick={() => {
                const next = !preferences.soundEffects;
                setPreferences({ soundEffects: next });
                if (next) playZenithSound("open", { force: true });
              }}
            >
              UI sounds
            </button>
            <button
              type="button"
              className={preferences.notificationSounds ? "settings-nav-style-active" : ""}
              aria-pressed={preferences.notificationSounds}
              onClick={() => {
                const next = !preferences.notificationSounds;
                setPreferences({ notificationSounds: next });
                if (next) playZenithSound("notify", { force: true });
              }}
            >
              Tip sounds
            </button>
            <button
              type="button"
              className={preferences.ambientMusic ? "settings-nav-style-active" : ""}
              aria-pressed={preferences.ambientMusic}
              onClick={() => {
                const next = !preferences.ambientMusic;
                setPreferences({ ambientMusic: next });
                if (next) playZenithSound("lofi", { force: true });
              }}
            >
              Lo-fi
            </button>
          </div>
        </div>
        <label className="settings-audio-volume">
          <span>Volume <strong>{preferences.audioVolume ?? 35}%</strong></span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={preferences.audioVolume ?? 35}
            onChange={(event) => setAudioVolume(Number(event.target.value))}
          />
        </label>
      </div>
    </div>
  );
}
