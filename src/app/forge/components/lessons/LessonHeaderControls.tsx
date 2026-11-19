"use client";

import { useEffect, useId, useState, useRef, useCallback } from "react";
import { ChevronDown, Clock, Flame, Shield, Sparkles, Zap } from "lucide-react";
import type { UseForgeLessonsReturn } from "../../hooks/useForgeLessons";

const COMMON_DURATIONS = [
  { label: "30 min", totalMinutes: 30 },
  { label: "1 hour", totalMinutes: 60 },
  { label: "1 hr 30 min", totalMinutes: 90 },
  { label: "2 hours", totalMinutes: 120 },
  { label: "2 hr 30 min", totalMinutes: 150 },
  { label: "3 hours", totalMinutes: 180 },
  { label: "4 hours", totalMinutes: 240 },
  { label: "6 hours", totalMinutes: 360 },
  { label: "8 hours", totalMinutes: 480 },
  { label: "10 hours", totalMinutes: 600 },
  { label: "12 hours", totalMinutes: 720 },
];

export function LessonHeaderControls({ lessons }: { lessons: UseForgeLessonsReturn }) {
  const {
    forgeLevel,
    setForgeLevel,
    profileForgeLevel = 1,
    isProfileLevelSynced = true,
    resetToProfileLevel,
    hasMembershipBuff,
    setHasMembershipBuff,
    extraExpBuffPercent = 0,
    setExtraExpBuffPercent,
    extraEffBuffPercent = 0,
    setExtraEffBuffPercent,
    totalBuffMultiplier,
    totalEffMultiplier = 1.0,
    targetHours,
    setTargetHours,
    targetMinutes,
    setTargetMinutes,
    isCursedOrForsaken,
    isBlacksmith,
    profileClassName,
  } = lessons;

  const levelInputId = useId();
  const durationSelectId = useId();
  const extraExpInputId = useId();
  const extraEffInputId = useId();

  const forgeAscensionLevel = lessons.forgeAscensionLevel || 0;

  // Local level state for instant 120fps input feedback during rapid arrow stepping or typing
  const [localLevel, setLocalLevel] = useState(forgeLevel);
  const [rawLevelInput, setRawLevelInput] = useState<string>(String(forgeLevel));
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInteractingRef = useRef<boolean>(false);
  const [durationMenuOpen, setDurationMenuOpen] = useState(false);
  const [highlightedDurationIndex, setHighlightedDurationIndex] = useState<number>(-1);
  const durationMenuRef = useRef<HTMLDivElement>(null);
  const durationTriggerRef = useRef<HTMLButtonElement>(null);
  const durationOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const openDurationMenu = useCallback(() => {
    const activeIdx = COMMON_DURATIONS.findIndex((d) => d.totalMinutes === (targetHours * 60 + targetMinutes));
    const initialIdx = activeIdx >= 0 ? activeIdx : 0;
    setHighlightedDurationIndex(initialIdx);
    setDurationMenuOpen(true);
  }, [targetHours, targetMinutes]);

  const closeDurationMenu = useCallback((focusTrigger: boolean = true) => {
    setDurationMenuOpen(false);
    setHighlightedDurationIndex(-1);
    if (focusTrigger) {
      durationTriggerRef.current?.focus();
    }
  }, []);

  // Auto-scroll highlighted option into view
  useEffect(() => {
    if (durationMenuOpen && highlightedDurationIndex >= 0) {
      const el = durationOptionRefs.current[highlightedDurationIndex];
      if (el) {
        el.scrollIntoView({ block: "nearest" });
      }
    }
  }, [durationMenuOpen, highlightedDurationIndex]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (durationMenuRef.current && !durationMenuRef.current.contains(e.target as Node)) {
        closeDurationMenu(false);
      }
    }
    if (durationMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [durationMenuOpen, closeDurationMenu]);

  // Reset interaction state and sync immediately when active profile switches
  useEffect(() => {
    isInteractingRef.current = false;
    setLocalLevel(forgeLevel);
    setRawLevelInput(String(forgeLevel));
  }, [lessons.activeProfile?.id]);

  // Sync external changes only when user is not actively interacting
  useEffect(() => {
    if (!isInteractingRef.current) {
      setLocalLevel(forgeLevel);
      setRawLevelInput(String(forgeLevel));
    }
  }, [forgeLevel]);

  const commitLevel = useCallback((val: number) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    isInteractingRef.current = false;
    const clamped = Math.min(100, Math.max(1, Math.floor(val)));
    setLocalLevel(clamped);
    setRawLevelInput(String(clamped));
    setForgeLevel(clamped);
  }, [setForgeLevel]);

  const handleLevelChange = (val: number, immediate: boolean = false) => {
    const clamped = Math.min(100, Math.max(1, Math.floor(val)));
    setLocalLevel(clamped);
    setRawLevelInput(String(clamped));
    isInteractingRef.current = true;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (immediate) {
      commitLevel(clamped);
    } else {
      debounceTimerRef.current = setTimeout(() => {
        commitLevel(clamped);
      }, 150);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const totalExpPercent = Math.round((totalBuffMultiplier - 1) * 100);
  const totalEffPercent = Math.round((totalEffMultiplier - 1) * 100);

  // Unified Duration Calculation
  const totalSessionMinutes = targetHours * 60 + targetMinutes;

  const handleDurationSelect = (mins: number) => {
    const clampedMins = Math.min(720, Math.max(15, mins));
    const h = Math.floor(clampedMins / 60);
    const m = clampedMins % 60;
    setTargetHours(h);
    setTargetMinutes(m);
  };

  const stepDuration = (deltaMinutes: number) => {
    handleDurationSelect(totalSessionMinutes + deltaMinutes);
  };

  const handleDurationTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!durationMenuOpen) {
        openDurationMenu();
      } else {
        const delta = e.key === "ArrowDown" ? 1 : -1;
        setHighlightedDurationIndex((prev) => {
          const next = (prev + delta + COMMON_DURATIONS.length) % COMMON_DURATIONS.length;
          return next;
        });
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!durationMenuOpen) {
        openDurationMenu();
      } else if (highlightedDurationIndex >= 0 && highlightedDurationIndex < COMMON_DURATIONS.length) {
        handleDurationSelect(COMMON_DURATIONS[highlightedDurationIndex].totalMinutes);
        closeDurationMenu(true);
      }
    } else if (e.key === "Escape" && durationMenuOpen) {
      e.preventDefault();
      closeDurationMenu(true);
    } else if (e.key === "Home" && durationMenuOpen) {
      e.preventDefault();
      setHighlightedDurationIndex(0);
    } else if (e.key === "End" && durationMenuOpen) {
      e.preventDefault();
      setHighlightedDurationIndex(COMMON_DURATIONS.length - 1);
    } else if (e.key === "Tab" && durationMenuOpen) {
      closeDurationMenu(false);
    }
  };

  return (
    <section className="lesson-header-controls" aria-label="Forge lesson parameters">
      <div className="controls-unified-bar">
        {/* Section 1: Player Level (Clean Stepper, No Pills) */}
        <div className="toolbar-section level-section">
          <div className="toolbar-section-header">
            <span className="panel-kicker">
              <Flame size={14} aria-hidden="true" /> Forge Skill
            </span>
            {profileForgeLevel > 0 && localLevel !== profileForgeLevel ? (
              <button
                type="button"
                className="reset-to-profile-btn"
                onClick={() => {
                  commitLevel(profileForgeLevel);
                }}
                title={`Reset to profile level ${profileForgeLevel}`}
                aria-label={`Reset to profile level ${profileForgeLevel}`}
              >
                Reset to Lv. {profileForgeLevel}
              </button>
            ) : (
              <span className="toolbar-subtext">
                {forgeAscensionLevel > 0 ? `Synced (Asc. ${forgeAscensionLevel})` : "Synced to Profile"}
              </span>
            )}
          </div>
          <div className="stepper-wrap compact">
            <button
              type="button"
              className="stepper-btn mini"
              onClick={() => handleLevelChange(localLevel - 1, false)}
              disabled={localLevel <= 1}
              aria-label="Decrease forge level"
            >
              -
            </button>
            <div className="number-display-wrap compact">
              <label htmlFor={levelInputId} className="sr-only">Forge Level</label>
              <span className="level-prefix">Lv.</span>
              <input
                id={levelInputId}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={rawLevelInput}
                onChange={(e) => {
                  isInteractingRef.current = true;
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setRawLevelInput(raw);
                  if (raw !== "") {
                    const parsed = parseInt(raw, 10);
                    if (!Number.isNaN(parsed)) {
                      const clamped = Math.min(100, Math.max(1, parsed));
                      handleLevelChange(clamped, false);
                    }
                  }
                }}
                onBlur={() => {
                  const val = parseInt(rawLevelInput, 10);
                  const clamped = Number.isNaN(val) || val < 1 ? localLevel : Math.min(100, val);
                  commitLevel(clamped);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = parseInt(rawLevelInput, 10);
                    const clamped = Number.isNaN(val) || val < 1 ? localLevel : Math.min(100, val);
                    commitLevel(clamped);
                  }
                }}
                className="direct-number-input compact"
              />
              {forgeAscensionLevel > 0 && localLevel >= 100 && (
                <span className="ascension-pill" title={`Ascension Level ${forgeAscensionLevel}`}>
                  +{forgeAscensionLevel} Asc
                </span>
              )}
            </div>
            <button
              type="button"
              className="stepper-btn mini"
              onClick={() => handleLevelChange(localLevel + 1, false)}
              disabled={localLevel >= 100}
              aria-label="Increase forge level"
            >
              +
            </button>
          </div>
        </div>

        {/* Section 2: Unified Session Target (Single accessible picker, No Pills) */}
        <div className="toolbar-section duration-section">
          <div className="toolbar-section-header">
            <span className="panel-kicker">
              <Clock size={14} aria-hidden="true" /> Session Duration <span className="sr-only">Offline Session Target</span>
            </span>
            <span className="toolbar-subtext">{targetHours}h {targetMinutes > 0 ? `${targetMinutes}m` : ""}</span>
          </div>
          <div className="unified-duration-control">
            <button
              type="button"
              className="stepper-btn mini duration-step-btn"
              onClick={() => stepDuration(-30)}
              disabled={totalSessionMinutes <= 30}
              aria-label="Decrease duration 30 minutes"
            >
              -30m
            </button>
            <div className={`duration-select-wrapper ${durationMenuOpen ? "open" : ""}`} ref={durationMenuRef}>
              <button
                ref={durationTriggerRef}
                id={durationSelectId}
                type="button"
                className={`duration-trigger-btn ${durationMenuOpen ? "open" : ""}`}
                onClick={() => {
                  if (durationMenuOpen) {
                    closeDurationMenu(false);
                  } else {
                    openDurationMenu();
                  }
                }}
                onKeyDown={handleDurationTriggerKeyDown}
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={durationMenuOpen}
                aria-controls="duration-popover-listbox"
                aria-activedescendant={
                  durationMenuOpen && highlightedDurationIndex >= 0
                    ? `duration-opt-${highlightedDurationIndex}`
                    : undefined
                }
                aria-label="Select session duration"
              >
                <span className="duration-val">
                  {COMMON_DURATIONS.find((d) => d.totalMinutes === totalSessionMinutes)?.label ||
                    `${targetHours}h ${targetMinutes > 0 ? `${targetMinutes}m` : ""}`}
                </span>
                <ChevronDown size={14} className={`chevron-icon ${durationMenuOpen ? "flipped" : ""}`} />
              </button>

              {durationMenuOpen && (
                <div
                  id="duration-popover-listbox"
                  className="duration-popover-menu"
                  role="listbox"
                  aria-label="Available session durations"
                >
                  {COMMON_DURATIONS.map((d, idx) => {
                    const isSelected = d.totalMinutes === totalSessionMinutes;
                    const isHighlighted = idx === highlightedDurationIndex;
                    return (
                      <button
                        key={d.totalMinutes}
                        ref={(el) => {
                          durationOptionRefs.current[idx] = el;
                        }}
                        id={`duration-opt-${idx}`}
                        type="button"
                        className={`duration-option-btn ${isSelected ? "active" : ""} ${isHighlighted ? "highlighted" : ""}`}
                        onMouseEnter={() => setHighlightedDurationIndex(idx)}
                        onClick={() => {
                          handleDurationSelect(d.totalMinutes);
                          closeDurationMenu(true);
                        }}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span>{d.label}</span>
                        {isSelected && <span className="active-dot" aria-hidden="true">•</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              type="button"
              className="stepper-btn mini duration-step-btn"
              onClick={() => stepDuration(30)}
              disabled={totalSessionMinutes >= 720}
              aria-label="Increase duration 30 minutes"
            >
              +30m
            </button>
          </div>
        </div>

        {/* Section 3: EXP & Efficiency Buffs */}
        <div className="toolbar-section buffs-section">
          <div className="toolbar-section-header">
            <span className="panel-kicker">
              <Sparkles size={14} aria-hidden="true" /> EXP & Efficiency Buffs
            </span>
            <div className={`buff-active-badge-group ${totalExpPercent !== 0 || totalEffPercent !== 0 ? "active" : ""}`}>
              {isCursedOrForsaken && (
                <span className="buff-badge-pill penalty-tag" title="Cursed / Forsaken class -50% base EXP penalty">
                  {profileClassName || "Cursed"}
                </span>
              )}
              {isBlacksmith && (
                <span className="buff-badge-pill exp" title="Blacksmith class +10% Forge EXP & +10% Efficiency">
                  Blacksmith (+10%)
                </span>
              )}
              <span
                className={`buff-badge-pill ${totalExpPercent < 0 ? "penalty" : "exp"}`}
                title={`${totalExpPercent >= 0 ? "+" : ""}${totalExpPercent}% Forge Experience modifier`}
              >
                <Zap size={10} aria-hidden="true" />
                <strong>{totalExpPercent >= 0 ? `+${totalExpPercent}%` : `${totalExpPercent}%`}</strong> EXP
              </span>
              <span className="buff-badge-dot" aria-hidden="true">·</span>
              <span className="buff-badge-pill eff" title={`+${totalEffPercent}% Smithing Efficiency bonus`}>
                <Clock size={10} aria-hidden="true" />
                <strong>+{totalEffPercent}%</strong> Eff
              </span>
            </div>
          </div>

          <div className="buff-inputs-grid">
            {/* Membership Status Toggle */}
            <button
              type="button"
              className={`membership-pill-btn ${hasMembershipBuff ? "active" : ""}`}
              onClick={() => setHasMembershipBuff(!hasMembershipBuff)}
              aria-pressed={hasMembershipBuff}
              title="Membership grants +15% EXP and +10% Efficiency"
            >
              <Shield size={13} aria-hidden="true" />
              <span>{hasMembershipBuff ? "Membership (+15% EXP · +10% Eff)" : "No Membership"}</span>
            </button>

            {/* Bonus EXP and Bonus Efficiency Inputs */}
            <div className="buff-extra-inputs-row">
              <div className="buff-field-group" title="Bonus Forge Experience %">
                <label htmlFor={extraExpInputId} className="buff-field-label">
                  <Zap size={11} aria-hidden="true" />
                  <span>+EXP %</span>
                </label>
                <input
                  id={extraExpInputId}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={extraExpBuffPercent === 0 ? "" : extraExpBuffPercent}
                  placeholder="0"
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    if (raw === "") {
                      setExtraExpBuffPercent?.(0);
                      return;
                    }
                    const val = parseInt(raw, 10);
                    if (!Number.isNaN(val)) {
                      setExtraExpBuffPercent?.(Math.min(500, Math.max(0, val)));
                    }
                  }}
                  className="buff-number-field"
                  aria-label="Bonus EXP percentage"
                />
              </div>

              <div className="buff-field-group" title="Bonus Smithing Efficiency %">
                <label htmlFor={extraEffInputId} className="buff-field-label">
                  <Clock size={11} aria-hidden="true" />
                  <span>+Eff %</span>
                </label>
                <input
                  id={extraEffInputId}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={extraEffBuffPercent === 0 ? "" : extraEffBuffPercent}
                  placeholder="0"
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    if (raw === "") {
                      setExtraEffBuffPercent?.(0);
                      return;
                    }
                    const val = parseInt(raw, 10);
                    if (!Number.isNaN(val)) {
                      setExtraEffBuffPercent?.(Math.min(500, Math.max(0, val)));
                    }
                  }}
                  className="buff-number-field"
                  aria-label="Bonus Efficiency percentage"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
