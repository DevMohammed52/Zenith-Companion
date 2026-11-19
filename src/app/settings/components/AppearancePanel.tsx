"use client";

import { Bell, Compass, Palette } from "lucide-react";
import { themes, type UseSettingsStateReturn } from "../types";

export default function AppearancePanel({
  state,
}: {
  state: Pick<UseSettingsStateReturn, "preferences" | "setPreferences">;
}) {
  const { preferences, setPreferences } = state;

  return (
    <div className="settings-panel">
      <h2><Palette size={17} /> Appearance</h2>
      <div className="theme-grid" role="radiogroup" aria-label="Color theme">
        {themes.map((theme) => (
          <button
            type="button"
            key={theme.value}
            role="radio"
            aria-checked={preferences.theme === theme.value}
            className={`theme-option ${preferences.theme === theme.value ? "theme-option-active" : ""}`}
            onClick={() => setPreferences({ theme: theme.value })}
          >
            <span>{theme.label}</span>
            <div className="theme-swatch-row">
              {theme.colors.map((color) => <i key={color} style={{ background: color }} />)}
            </div>
          </button>
        ))}
      </div>
      <div className="settings-nav-style settings-desktop-only" aria-label="Desktop navigation style">
        <span><Compass size={15} /> Desktop navigation</span>
        <div>
          {([
            ["sidebar", "Sidebar"],
            ["dock", "Zenith Dock"],
          ] as const).map(([style, label]) => (
            <button
              type="button"
              key={style}
              className={preferences.desktopNavigationStyle === style ? "settings-nav-style-active" : ""}
              aria-pressed={preferences.desktopNavigationStyle === style}
              onClick={() => setPreferences({ desktopNavigationStyle: style })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {preferences.desktopNavigationStyle === "dock" && (
        <div className="settings-nav-style settings-nav-style-three settings-desktop-only" aria-label="Desktop dock position">
          <span><Compass size={15} /> Dock position</span>
          <div>
            {(["bottom", "left", "right"] as const).map((position) => (
              <button
                key={position}
                type="button"
                className={(preferences.desktopDockPosition ?? "bottom") === position ? "settings-nav-style-active" : ""}
                aria-pressed={(preferences.desktopDockPosition ?? "bottom") === position}
                onClick={() => setPreferences({ desktopDockPosition: position })}
              >
                {position[0].toUpperCase() + position.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="settings-nav-style settings-mobile-only" aria-label="Mobile navigation style">
        <span><Compass size={15} /> Mobile navigation</span>
        <div>
          <button
            type="button"
            className={preferences.mobileNavigationStyle !== "command" ? "settings-nav-style-active" : ""}
            aria-pressed={preferences.mobileNavigationStyle !== "command"}
            onClick={() => setPreferences({ mobileNavigationStyle: "standard" })}
          >
            Standard
          </button>
          <button
            type="button"
            className={preferences.mobileNavigationStyle === "command" ? "settings-nav-style-active" : ""}
            aria-pressed={preferences.mobileNavigationStyle === "command"}
            onClick={() => setPreferences({ mobileNavigationStyle: "command" })}
          >
            Radial menu
          </button>
        </div>
      </div>
      {preferences.mobileNavigationStyle === "command" && (
        <div className="settings-nav-style settings-mobile-only" aria-label="Radial menu thumb side">
          <span><Compass size={15} /> Radial reach</span>
          <div>
            <button
              type="button"
              className={(preferences.mobileCommandTriggerSide ?? "left") === "left" ? "settings-nav-style-active" : ""}
              aria-pressed={(preferences.mobileCommandTriggerSide ?? "left") === "left"}
              onClick={() => setPreferences({ mobileCommandTriggerSide: "left" })}
            >
              Left thumb
            </button>
            <button
              type="button"
              className={preferences.mobileCommandTriggerSide === "right" ? "settings-nav-style-active" : ""}
              aria-pressed={preferences.mobileCommandTriggerSide === "right"}
              onClick={() => setPreferences({ mobileCommandTriggerSide: "right" })}
            >
              Right thumb
            </button>
          </div>
        </div>
      )}
      <div className="settings-nav-style settings-mobile-only" aria-label="Mobile haptic feedback">
        <span><Compass size={15} /> Touch feedback</span>
        <div>
          <button
            type="button"
            className={preferences.mobileHaptics ? "settings-nav-style-active" : ""}
            aria-pressed={preferences.mobileHaptics}
            onClick={() => setPreferences({ mobileHaptics: true })}
          >
            Subtle
          </button>
          <button
            type="button"
            className={!preferences.mobileHaptics ? "settings-nav-style-active" : ""}
            aria-pressed={!preferences.mobileHaptics}
            onClick={() => setPreferences({ mobileHaptics: false })}
          >
            Off
          </button>
        </div>
      </div>
      <div className="settings-nav-style" aria-label="In-app notification tips">
        <span><Bell size={15} /> Tips and notices</span>
        <div>
          <button
            type="button"
            className={preferences.inAppNotifications ? "settings-nav-style-active" : ""}
            aria-pressed={preferences.inAppNotifications}
            onClick={() => setPreferences({ inAppNotifications: true })}
          >
            Enabled
          </button>
          <button
            type="button"
            className={!preferences.inAppNotifications ? "settings-nav-style-active" : ""}
            aria-pressed={!preferences.inAppNotifications}
            onClick={() => setPreferences({ inAppNotifications: false })}
          >
            Disabled
          </button>
        </div>
      </div>
      <p className="settings-panel-note">
        These are in-app notices only. Browser notification permission is requested only from Market Watch after you press its permission button.
      </p>
    </div>
  );
}
