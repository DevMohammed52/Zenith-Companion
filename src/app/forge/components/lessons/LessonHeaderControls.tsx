"use client";

import { Clock, Flame, Shield, Sparkles } from "lucide-react";
import type { UseForgeLessonsReturn } from "../../hooks/useForgeLessons";
import { MAX_OFFLINE_SECONDS } from "../../hooks/useForgeLessons";
import { getForgeHourlyRate } from "@/lib/forge-lesson-math";

const LEVEL_MILESTONES = [1, 10, 25, 50, 75, 90, 99];
const DURATION_PRESETS = [
  { label: "30m", hours: 0, mins: 30 },
  { label: "1h", hours: 1, mins: 0 },
  { label: "2h", hours: 2, mins: 0 },
  { label: "4h", hours: 4, mins: 0 },
  { label: "6h (Max)", hours: 6, mins: 0 },
];

const SHRINE_TIERS = [
  { label: "None", percent: 0 },
  { label: "T1 (+10%)", percent: 10 },
  { label: "T2 (+15%)", percent: 15 },
  { label: "T3 (+20%)", percent: 20 },
  { label: "All (+45%)", percent: 45 },
];

export function LessonHeaderControls({ lessons }: { lessons: UseForgeLessonsReturn }) {
  const {
    forgeLevel,
    setForgeLevel,
    hasMembershipBuff,
    setHasMembershipBuff,
    hasCampaignBuff,
    setHasCampaignBuff,
    shrineBuffPercent,
    setShrineBuffPercent,
    hasDailyBlessing,
    setHasDailyBlessing,
    customBuffPercent,
    setCustomBuffPercent,
    totalBuffMultiplier,
    targetHours,
    setTargetHours,
    targetMinutes,
    setTargetMinutes,
    totalTargetDurationSeconds,
  } = lessons;

  const totalBuffDisplay = Math.round((totalBuffMultiplier - 1) * 100);
  const baseHourlyRate = getForgeHourlyRate(forgeLevel);
  const activeHourlyRate = baseHourlyRate * totalBuffMultiplier;
  const nextLvlRate = getForgeHourlyRate(Math.min(100, forgeLevel + 1));
  const rateSlopeText = forgeLevel >= 100 ? "Max Level" : `+${(nextLvlRate - baseHourlyRate).toFixed(2)}/hr`;
  const sweetSpotMin = Math.max(1, forgeLevel - 10);
  const sweetSpotMax = Math.min(100, forgeLevel + 10);

  const applyFullBuffsPreset = () => {
    setHasMembershipBuff(true);
    setShrineBuffPercent(45);
    setHasDailyBlessing(true);
    setHasCampaignBuff(false);
    setCustomBuffPercent(0);
  };

  const applyMemberT3Preset = () => {
    setHasMembershipBuff(true);
    setShrineBuffPercent(20);
    setHasDailyBlessing(false);
    setHasCampaignBuff(false);
    setCustomBuffPercent(0);
  };

  const resetBuffs = () => {
    setHasMembershipBuff(false);
    setShrineBuffPercent(0);
    setHasDailyBlessing(false);
    setHasCampaignBuff(false);
    setCustomBuffPercent(0);
  };

  return (
    <section className="lesson-header-controls" aria-label="Forge lesson parameters">
      <div className="controls-panel-grid">
        {/* Panel 1: Player Level */}
        <div className="control-card">
          <div className="control-card-header">
            <span className="panel-kicker"><Flame size={14} aria-hidden="true" /> Forge Skill</span>
            <span className="card-hint">Sets 10-level grace range</span>
          </div>
          <div className="stepper-input-row">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setForgeLevel(Math.max(1, forgeLevel - 1))}
              disabled={forgeLevel <= 1}
              aria-label="-1 level"
            >
              -1
            </button>
            <div className="number-display-wrap">
              <label htmlFor="forge-level-input" className="sr-only">Forge Level</label>
              <span className="level-prefix">Lv.</span>
              <input
                id="forge-level-input"
                type="number"
                min={1}
                max={100}
                value={forgeLevel}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!Number.isNaN(val)) {
                    setForgeLevel(Math.min(100, Math.max(1, val)));
                  }
                }}
                className="direct-number-input"
              />
            </div>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setForgeLevel(Math.min(100, forgeLevel + 1))}
              disabled={forgeLevel >= 100}
              aria-label="+1 level"
            >
              +1
            </button>
          </div>
          <div className="milestone-pill-row" aria-label="Level milestones">
            {LEVEL_MILESTONES.map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`milestone-pill ${forgeLevel === lvl ? "active" : ""}`}
                onClick={() => setForgeLevel(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Panel 2: EXP Buffs */}
        <div className="control-card">
          <div className="control-card-header">
            <span className="panel-kicker"><Sparkles size={14} aria-hidden="true" /> Experience Buffs</span>
            <span className="card-hint">
              {totalBuffDisplay > 0 ? `+${totalBuffDisplay}% active` : "Base 100%"}
            </span>
          </div>
          <div className="buff-toggles-row">
            <button
              type="button"
              className={`buff-toggle-btn ${hasMembershipBuff ? "active" : ""}`}
              onClick={() => setHasMembershipBuff(!hasMembershipBuff)}
              aria-pressed={hasMembershipBuff}
            >
              <Shield size={14} aria-hidden="true" />
              <span>+15% Member</span>
            </button>
            <button
              type="button"
              className={`buff-toggle-btn ${hasDailyBlessing ? "active" : ""}`}
              onClick={() => setHasDailyBlessing(!hasDailyBlessing)}
              aria-pressed={hasDailyBlessing}
            >
              <Sparkles size={14} aria-hidden="true" />
              <span>+5% Blessing</span>
            </button>
          </div>

          <div style={{ marginTop: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Shrine Buff</span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-accent)", fontWeight: 700 }}>
                {shrineBuffPercent > 0 ? `+${shrineBuffPercent}%` : "None"}
              </span>
            </div>
            <div className="milestone-pill-row" aria-label="Shrine buff tiers">
              {SHRINE_TIERS.map((tier) => (
                <button
                  key={tier.label}
                  type="button"
                  className={`milestone-pill mini ${shrineBuffPercent === tier.percent ? "active" : ""}`}
                  onClick={() => setShrineBuffPercent(tier.percent)}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          <div className="custom-buff-row" style={{ marginTop: "0.4rem" }}>
            <label htmlFor="custom-buff-input" className="custom-buff-label">Other Buff %</label>
            <input
              id="custom-buff-input"
              type="number"
              min={0}
              max={100}
              value={customBuffPercent || ""}
              placeholder="0"
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setCustomBuffPercent(Number.isNaN(val) ? 0 : Math.max(0, Math.min(100, val)));
              }}
              className="custom-buff-input"
            />
          </div>

          <div className="milestone-pill-row" style={{ marginTop: "0.4rem" }} aria-label="Quick buff presets">
            <button
              type="button"
              className="milestone-pill mini"
              onClick={applyFullBuffsPreset}
              title="Membership (+15%) + All Shrines (+45%) + Blessing (+5%)"
            >
              Full +65%
            </button>
            <button
              type="button"
              className="milestone-pill mini"
              onClick={applyMemberT3Preset}
              title="Membership (+15%) + Shrine T3 (+20%)"
            >
              T3 +35%
            </button>
            <button
              type="button"
              className="milestone-pill mini"
              onClick={resetBuffs}
              title="Reset all buffs to Base 100%"
            >
              Reset 0%
            </button>
          </div>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.35rem 0 0" }}>
            Campaign tasks only advance from crafting, not lessons.
          </p>
        </div>

        {/* Panel 3: Session Duration Planner (NO SLIDERS) */}
        <div className="control-card">
          <div className="control-card-header">
            <span className="panel-kicker"><Clock size={14} aria-hidden="true" /> Offline Session Target</span>
            <span className="card-hint">Up to 12h (Housing + Member)</span>
          </div>
          <div className="duration-input-row">
            <div className="duration-unit-group">
              <label htmlFor="target-hours-input">Hours</label>
              <div className="unit-stepper-wrap">
                <button
                  type="button"
                  className="unit-step-btn"
                  onClick={() => setTargetHours(Math.max(0, targetHours - 1))}
                  disabled={targetHours <= 0}
                  aria-label="-1 hour"
                >
                  -
                </button>
                <input
                  id="target-hours-input"
                  type="number"
                  min={0}
                  max={12}
                  value={targetHours}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!Number.isNaN(val)) {
                      const clampedH = Math.min(12, Math.max(0, val));
                      setTargetHours(clampedH);
                      if (clampedH === 12) {
                        setTargetMinutes(0);
                      }
                    }
                  }}
                  className="duration-number-input"
                />
                <button
                  type="button"
                  className="unit-step-btn"
                  onClick={() => {
                    const nextH = Math.min(12, targetHours + 1);
                    setTargetHours(nextH);
                    if (nextH === 12) {
                      setTargetMinutes(0);
                    }
                  }}
                  disabled={targetHours >= 12}
                  aria-label="+1 hour"
                >
                  +
                </button>
              </div>
            </div>

            <div className="duration-unit-group">
              <label htmlFor="target-mins-input">Mins</label>
              <div className="unit-stepper-wrap">
                <button
                  type="button"
                  className="unit-step-btn"
                  onClick={() => setTargetMinutes(Math.max(0, targetMinutes - 15))}
                  disabled={targetMinutes <= 0 || targetHours >= 12}
                  aria-label="-15 minutes"
                >
                  -
                </button>
                <input
                  id="target-mins-input"
                  type="number"
                  min={0}
                  max={targetHours >= 12 ? 0 : 59}
                  step={5}
                  value={targetHours >= 12 ? 0 : targetMinutes}
                  disabled={targetHours >= 12}
                  onChange={(e) => {
                    if (targetHours >= 12) {
                      setTargetMinutes(0);
                      return;
                    }
                    const val = parseInt(e.target.value, 10);
                    if (!Number.isNaN(val)) {
                      setTargetMinutes(Math.min(59, Math.max(0, val)));
                    }
                  }}
                  className="duration-number-input"
                />
                <button
                  type="button"
                  className="unit-step-btn"
                  onClick={() => setTargetMinutes(Math.min(59, targetMinutes + 15))}
                  disabled={targetHours >= 12 || targetMinutes >= 45}
                  aria-label="+15 minutes"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="preset-pill-row" aria-label="Session duration presets">
            {DURATION_PRESETS.map((p) => {
              const isMatch = targetHours === p.hours && targetMinutes === p.mins;
              return (
                <button
                  key={p.label}
                  type="button"
                  className={`preset-pill ${isMatch ? "active" : ""}`}
                  onClick={() => {
                    setTargetHours(p.hours);
                    setTargetMinutes(p.mins);
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rate-context-strip" aria-label="Hourly training rate and grace window context">
        <div className="context-stat">
          <span className="stat-label">Base Speed</span>
          <strong>{baseHourlyRate.toFixed(2)} EXP/hr</strong>
        </div>
        <div className="context-stat">
          <span className="stat-label">Active Rate ({totalBuffDisplay > 0 ? `+${totalBuffDisplay}%` : "1.0x"})</span>
          <strong className="good-val">{activeHourlyRate.toFixed(2)} EXP/hr</strong>
        </div>
        <div className="context-stat">
          <span className="stat-label">100% Sweet Spot</span>
          <strong>Lv. {sweetSpotMin} – {sweetSpotMax}</strong>
        </div>
        <div className="context-stat">
          <span className="stat-label">Next Level Slope</span>
          <span>{rateSlopeText}</span>
        </div>
      </div>
    </section>
  );
}
