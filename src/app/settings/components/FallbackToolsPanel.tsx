"use client";

import { Check, Wrench } from "lucide-react";
import type { ToolSkill } from "@/lib/skill-profit";
import type { UseSettingsStateReturn } from "../types";
import ToolPicker from "./ToolPicker";

export default function FallbackToolsPanel({
  state,
}: {
  state: Pick<
    UseSettingsStateReturn,
    "preferences" | "setPreferences" | "openToolPicker" | "setOpenToolPicker"
  >;
}) {
  const { preferences, setPreferences, openToolPicker, setOpenToolPicker } = state;

  return (
    <div className="settings-panel settings-fallback-panel">
      <h2><Wrench size={17} /> Fallback Tools</h2>
      <div className="settings-fields settings-compat-fields">
        <label className="settings-field">
          <span><strong>Skill Class Helper</strong><small>Used when no active profile class is available.</small></span>
          <button
            type="button"
            className="control-input settings-toggle-button"
            aria-pressed={preferences.skillClassBonus}
            onClick={() => setPreferences({ skillClassBonus: !preferences.skillClassBonus })}
          >
            {preferences.skillClassBonus && <Check size={14} />} {preferences.skillClassBonus ? "Class helper active" : "No helper"}
          </button>
        </label>
      </div>
      <div className="settings-tool-grid">
        {(["Woodcutting", "Mining", "Fishing"] as ToolSkill[]).map((skill) => (
          <ToolPicker
            key={skill}
            skill={skill}
            value={preferences.skillTools[skill]}
            open={openToolPicker === skill}
            onToggle={() => setOpenToolPicker((current) => current === skill ? null : skill)}
            onChange={(value) => {
              setPreferences({ skillTools: { ...preferences.skillTools, [skill]: value } });
              setOpenToolPicker(null);
            }}
          />
        ))}
      </div>
    </div>
  );
}
