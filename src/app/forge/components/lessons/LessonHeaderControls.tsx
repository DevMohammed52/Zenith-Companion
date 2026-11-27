"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Drawer,
  Icon,
  NumberInput,
  Select,
  Switch,
  Tag,
} from "@/components/ui";
import { GameImage } from "@/components/GameImage";
import { GoldIcon, ShardIcon } from "@/components/GoldIcon";
import { formatGold } from "@/lib/format";
import { ASCENSION_BUFFS, ASSAULT_OPTIONS, getAssaultBuff, type AssaultRank } from "@/lib/skill-profit";
import type { UseForgeLessonsReturn } from "../../hooks/useForgeLessons";
import styles from "../../Forge.module.css";

const COMMON_DURATIONS = [
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1 hr 30 min" },
  { value: "120", label: "2 hours" },
  { value: "150", label: "2 hr 30 min" },
  { value: "180", label: "3 hours" },
  { value: "240", label: "4 hours" },
  { value: "360", label: "6 hours" },
  { value: "480", label: "8 hours" },
  { value: "600", label: "10 hours" },
  { value: "720", label: "12 hours" },
];

const GROUPED_ASCENSION_BUFFS = {
  Eff: ASCENSION_BUFFS.filter((b) => b.type === "Eff"),
  Exp: ASCENSION_BUFFS.filter((b) => b.type === "Exp"),
};

export function LessonHeaderControls({
  lessons,
  onOpenQueueTab,
}: {
  lessons: UseForgeLessonsReturn;
  onOpenQueueTab?: () => void;
}) {
  const {
    forgeLevel,
    setForgeLevel,
    forgeAscensionLevel = 0,
    profileForgeLevel = 1,
    resetToProfileLevel,
    hasMembershipBuff,
    setHasMembershipBuff,
    conquestRank = "none",
    setConquestRank,
    energizingPoolExp = 0,
    setEnergizingPoolExp,
    ascensionBuffIds = [],
    selectedAscensionBuffs = [],
    toggleAscensionBuff,
    clearAscensionBuffs,
    manualClassBonus = false,
    setManualClassBonus,
    hasCampaignBuff = false,
    setHasCampaignBuff,
    hasDailyBlessing = false,
    setHasDailyBlessing,
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
    activeProfile,
    allCalculatedMaterials,
    fillSessionWithMaterial,
    clearQueue,
    sessionSummary,
  } = lessons;

  const [drawerOpen, setDrawerOpen] = useState(false);

  const totalSessionMinutes = targetHours * 60 + targetMinutes;
  const totalExpPercent = Math.round((totalBuffMultiplier - 1.0) * 100);
  const totalEffPercent = Math.round((totalEffMultiplier - 1.0) * 100);
  const assaultBonus = getAssaultBuff(conquestRank as AssaultRank);

  const activeModifierCount =
    (hasMembershipBuff ? 1 : 0) +
    (hasCampaignBuff ? 1 : 0) +
    (hasDailyBlessing ? 1 : 0) +
    (conquestRank !== "none" ? 1 : 0) +
    (energizingPoolExp > 0 ? 1 : 0) +
    ascensionBuffIds.length +
    (isBlacksmith || (!isCursedOrForsaken && manualClassBonus) ? 1 : 0) +
    (extraExpBuffPercent > 0 ? 1 : 0) +
    (extraEffBuffPercent > 0 ? 1 : 0);

  const applyDurationMinutes = (mins: number) => {
    const clamped = Math.max(30, Math.min(720, Math.round(mins)));
    setTargetHours(Math.floor(clamped / 60));
    setTargetMinutes(clamped % 60);
  };

  const durationValue = COMMON_DURATIONS.some((d) => Number(d.value) === totalSessionMinutes)
    ? String(totalSessionMinutes)
    : "";

  const recommendedCheapest = [...allCalculatedMaterials]
    .filter((m) => !m.hasPenalty && m.displayedEff >= 100)
    .sort((a, b) => a.goldPerExp - b.goldPerExp)[0]
    || [...allCalculatedMaterials].sort((a, b) => a.goldPerExp - b.goldPerExp)[0]
    || null;

  const hasQueuedItems = sessionSummary.queuedItems.length > 0;

  const modifierDrawerBody: ReactNode = (
    <div className={styles.drawerBody}>
      <div className={styles.drawerSyncRow}>
        <div>
          <strong>{activeProfile?.name || "Global loadout"}</strong>
          {forgeAscensionLevel > 0 ? ` · Asc. ${forgeAscensionLevel}` : ""}
          {profileClassName ? ` · ${profileClassName}` : ""}
        </div>
        <Link href="/profiles" className={styles.profileJumpLink}>
          <span>Profiles</span>
          <Icon name="arrowRight" size="xs" aria-hidden="true" />
        </Link>
      </div>

      {isCursedOrForsaken && (
        <Badge variant="danger" size="sm">
          {profileClassName || "Cursed/Forsaken"} applies -50% Forging EXP
        </Badge>
      )}

      <section className={styles.drawerSection} aria-label="Account and seasonal boosts">
        <h3 className={styles.drawerSectionTitle}>
          <Icon name="membership" size="sm" aria-hidden="true" />
          <span>Account &amp; Active Boosts</span>
        </h3>

        <Switch
          label="Membership (+15% EXP, +10% Eff)"
          description="Also updates market sale fee estimate to 12% (vs. 15% non-member)"
          checked={hasMembershipBuff}
          onChange={(e) => setHasMembershipBuff(e.target.checked)}
        />
        {!isBlacksmith && !isCursedOrForsaken && (
          <Switch
            label="Blacksmith Class (+10% EXP)"
            description="Toggle manually when not synced from your active character"
            checked={manualClassBonus}
            onChange={(e) => setManualClassBonus?.(e.target.checked)}
          />
        )}
        <Switch
          label="Campaign Buff (+15% EXP)"
          description="Active world campaign forging bonus"
          checked={hasCampaignBuff}
          onChange={(e) => setHasCampaignBuff?.(e.target.checked)}
        />
        <Switch
          label="Daily Blessing (+5% EXP)"
          description="Active daily blessing bonus"
          checked={hasDailyBlessing}
          onChange={(e) => setHasDailyBlessing?.(e.target.checked)}
        />
      </section>

      <section className={styles.drawerSection} aria-label="Guild Conquest and Energizing Pool">
        <h3 className={styles.drawerSectionTitle}>
          <Icon name="defense" size="sm" aria-hidden="true" />
          <span>Guild Conquest &amp; Energizing Pool</span>
        </h3>

        <div className={styles.drawerTwoCol}>
          <div className={styles.drawerField}>
            <span className={styles.drawerFieldLabel}>Guild Conquest Rank</span>
            <Select
              ariaLabel="Guild Conquest Rank"
              options={ASSAULT_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              value={conquestRank}
              onChange={(val) => setConquestRank?.(val as AssaultRank)}
            />
            <span className={styles.syncText}>
              {conquestRank === "none"
                ? "No Conquest bonus"
                : `+${assaultBonus.exp}% EXP · +${assaultBonus.efficiency}% Eff`}
            </span>
          </div>

          <div className={styles.drawerField}>
            <NumberInput
              label="Energizing Pool EXP (%)"
              min={0}
              max={15}
              value={energizingPoolExp}
              onChange={(val) => setEnergizingPoolExp?.(val)}
              suffix="%"
              helperText="0% to 15%"
            />
          </div>
        </div>
      </section>

      <section className={styles.drawerSection} aria-label="Ascension perks">
        <div className={styles.sectionTopRow}>
          <h3 className={styles.drawerSectionTitle}>
            <Icon name="xp" size="sm" aria-hidden="true" />
            <span>Ascension Perks ({selectedAscensionBuffs.length}/5)</span>
          </h3>
          {selectedAscensionBuffs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => clearAscensionBuffs?.()}>
              Clear all
            </Button>
          )}
        </div>

        {selectedAscensionBuffs.length > 0 && (
          <div className={styles.chipGroup}>
            {selectedAscensionBuffs.map((buff) => (
              <Tag
                key={buff.id}
                label={`${buff.label.replace("Lvl ", "L")} +${buff.value}% ${buff.type}`}
                selected
                onRemove={() => toggleAscensionBuff?.(buff.id)}
                removeAriaLabel={`Remove ${buff.label}`}
              />
            ))}
          </div>
        )}

        <div className={styles.buffGroups}>
          {(["Eff", "Exp"] as const).map((type) => (
            <div key={type}>
              <div className={styles.buffGroupTitle}>{type === "Eff" ? "Efficiency" : "Experience"}</div>
              <div className={styles.buffRail}>
                {GROUPED_ASCENSION_BUFFS[type].map((buff) => {
                  const selected = ascensionBuffIds.includes(buff.id);
                  const disabled = !selected && ascensionBuffIds.length >= 5;
                  return (
                    <button
                      key={buff.id}
                      type="button"
                      aria-pressed={selected}
                      disabled={disabled}
                      onClick={() => toggleAscensionBuff?.(buff.id)}
                      className={`${styles.buffButton} ${selected ? styles.buffSelected : ""}`}
                    >
                      <span>{buff.label.replace("Lvl ", "L")}</span>
                      <strong>+{buff.value}%</strong>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.drawerSection} aria-label="Extra modifiers">
        <h3 className={styles.drawerSectionTitle}>
          <Icon name="filter" size="sm" aria-hidden="true" />
          <span>Extra Modifiers</span>
        </h3>

        <div className={styles.drawerTwoCol}>
          <NumberInput
            label="Extra EXP (%)"
            min={0}
            max={500}
            value={extraExpBuffPercent}
            onChange={(val) => setExtraExpBuffPercent?.(val)}
            suffix="%"
            helperText="Scrolls or unlisted EXP boosts"
          />
          <NumberInput
            label="Extra Efficiency (%)"
            min={0}
            max={500}
            value={extraEffBuffPercent}
            onChange={(val) => setExtraEffBuffPercent?.(val)}
            suffix="%"
            helperText="Additional speed modifiers"
          />
        </div>
      </section>
    </div>
  );

  return (
    <section className={styles.parameterStrip} aria-label="Forge lesson parameters">
      {/* Left Spotlight Zone: Active Queue Summary OR Quick Auto-Fill Recommendation */}
      <div className={styles.spotlightZone}>
        {hasQueuedItems ? (
          <>
            <div className={styles.spotlightIdentity}>
              <div className={styles.spotlightThumb}>
                <GameImage
                  src={sessionSummary.queuedItems[0].material.imageUrl}
                  alt=""
                  width={30}
                  height={30}
                />
              </div>
              <div className={styles.spotlightMeta}>
                <span className={styles.paramLabel}>
                  Active Queue ({sessionSummary.queuedItems.length})
                </span>
                <span className={styles.spotlightTitle}>
                  +{sessionSummary.totalForgeExp.toLocaleString()} Forge XP
                </span>
                <span className={styles.spotlightSub}>
                  <span>~{sessionSummary.estimatedTemperBarPercent}% Temper (~{sessionSummary.estimatedTemperShards}</span>
                  <ShardIcon size={11} />
                  <span>)</span>
                  <span>·</span>
                  <span>{formatGold(sessionSummary.totalCost)}</span>
                  <GoldIcon size={11} />
                </span>
              </div>
            </div>

            <div className={styles.actionsCluster}>
              {onOpenQueueTab && (
                <Button variant="secondary" size="sm" onClick={onOpenQueueTab}>
                  Edit Queue
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                icon={<Icon name="trash" size="xs" aria-hidden="true" />}
                onClick={() => clearQueue()}
                aria-label="Clear Queue"
              />
            </div>
          </>
        ) : (
          <>
            <div className={styles.spotlightIdentity}>
              <div className={styles.spotlightThumb}>
                {recommendedCheapest ? (
                  <GameImage src={recommendedCheapest.imageUrl} alt="" width={30} height={30} />
                ) : (
                  <Icon name="critDamage" size="sm" aria-hidden="true" />
                )}
              </div>
              <div className={styles.spotlightMeta}>
                <span className={styles.paramLabel}>Best Value (Lv. {forgeLevel})</span>
                <span className={styles.spotlightTitle}>
                  {recommendedCheapest ? recommendedCheapest.name : "Select material"}
                </span>
                <span className={styles.spotlightSub}>
                  {recommendedCheapest ? (
                    <>
                      <span>{recommendedCheapest.goldPerExp.toFixed(2)}g/EXP</span>
                      <span>·</span>
                      <span>~{Math.round(recommendedCheapest.expPerSecond * 3600).toLocaleString()} XP/hr</span>
                    </>
                  ) : (
                    <span>Browse catalog below</span>
                  )}
                </span>
              </div>
            </div>

            {recommendedCheapest && (
              <Button
                variant="primary"
                size="sm"
                icon={<Icon name="speed" size="xs" aria-hidden="true" />}
                onClick={() => fillSessionWithMaterial(recommendedCheapest.name)}
              >
                Fill Session
              </Button>
            )}
          </>
        )}
      </div>

      {/* Right Inline Controls Zone */}
      <div className={styles.controlsZone}>
        <div className={styles.controlCell}>
          <span className={styles.paramLabel}>
            <Icon name="critDamage" size="xs" aria-hidden="true" /> Forge Skill
          </span>
          <div className={styles.controlCellRow}>
            <div style={{ width: "160px" }}>
              <NumberInput
                value={forgeLevel}
                min={1}
                max={100}
                prefix="Lv."
                onChange={(val) => setForgeLevel(val)}
                aria-label="Forge Level"
              />
            </div>
            {profileForgeLevel > 0 && forgeLevel !== profileForgeLevel && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Icon name="undo" size="xs" aria-hidden="true" />}
                onClick={resetToProfileLevel}
                aria-label={`Reset to profile level ${profileForgeLevel}`}
                title={`Reset to profile Lv. ${profileForgeLevel}`}
              />
            )}
          </div>
        </div>

        <div className={styles.controlCell}>
          <span className={styles.paramLabel}>
            <Icon name="timer" size="xs" aria-hidden="true" /> Session{" "}
            <span className="sr-only">Offline Session Target</span>
          </span>
          <div className={styles.controlCellRow}>
            <Button
              variant="secondary"
              size="sm"
              disabled={totalSessionMinutes <= 30}
              onClick={() => applyDurationMinutes(totalSessionMinutes - 30)}
              aria-label="Decrease duration 30 minutes"
            >
              -30m
            </Button>
            <div className={styles.durationSelectBox}>
              <Select
                options={COMMON_DURATIONS}
                value={durationValue || String(totalSessionMinutes)}
                placeholder={`${targetHours}h ${targetMinutes > 0 ? `${targetMinutes}m` : ""}`}
                onChange={(val) => applyDurationMinutes(Number(val) || 360)}
                ariaLabel="Select session duration"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={totalSessionMinutes >= 720}
              onClick={() => applyDurationMinutes(totalSessionMinutes + 30)}
              aria-label="Increase duration 30 minutes"
            >
              +30m
            </Button>
          </div>
        </div>

        <div className={styles.controlCell}>
          <span className={styles.paramLabel}>
            <Icon name="xp" size="xs" aria-hidden="true" /> Active Buffs
          </span>
          <div className={styles.buffTriggerCluster}>
            <Badge variant={totalExpPercent < 0 ? "danger" : "neutral"} size="sm">
              {totalExpPercent >= 0 ? `+${totalExpPercent}%` : `${totalExpPercent}%`} EXP
            </Badge>
            <Badge variant="neutral" size="sm">+{totalEffPercent}% Eff</Badge>
            <Button
              variant="secondary"
              size="sm"
              icon={<Icon name="filter" size="xs" aria-hidden="true" />}
              onClick={() => setDrawerOpen(true)}
              aria-label="Configure EXP and Efficiency buffs"
            >
              Loadout &amp; Boosts ({activeModifierCount})
            </Button>
          </div>
        </div>
      </div>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Loadout & Boosts"
        description="Select Membership, Class, Guild Conquest, Energizing Pool, Ascension perks, and extra bonuses."
        side="right"
      >
        {modifierDrawerBody}
      </Drawer>
    </section>
  );
}
