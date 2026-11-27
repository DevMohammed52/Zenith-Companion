"use client";

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
import { ASCENSION_BUFFS, ASSAULT_OPTIONS, type AssaultRank } from "@/lib/skill-profit";
import type { AlchemyBuffTotals } from "@/lib/alchemy-profit";
import type { WhatIfClassOverride } from "../types";
import styles from "../page.module.css";

interface AlchemyLoadoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  hasConfiguredProfile: boolean;
  activeProfileName: string;
  profileClassName: string;
  profileAlchemyLevel: number;
  parsedBartering: number;
  profileBartering: number;
  barteringOverride: number | "";
  onBarteringOverrideChange: (next: number | "") => void;
  membership: boolean;
  onMembershipChange: (next: boolean) => void;
  classOverride: WhatIfClassOverride;
  onClassOverrideChange: (next: WhatIfClassOverride) => void;
  conquestOverride: AssaultRank | "profile";
  profileConquestRank: AssaultRank;
  onConquestOverrideChange: (next: AssaultRank | "profile") => void;
  ascensionBuffIds: string[];
  onToggleAscension: (id: string) => void;
  onClearAscension: () => void;
  energizingPoolExp: number;
  onEnergizingPoolChange: (next: number) => void;
  baseIdleHours: number;
  housingAlchemyHours: number;
  defaultSessionHours: number;
  customSessionHours: number | "";
  onCustomSessionHoursChange: (next: number | "") => void;
  sessionHoursSource: string;
  hasWhatIfOverrides: boolean;
  onResetLoadout: () => void;
  buffTotals: AlchemyBuffTotals;
}

const EFF_PERKS = ASCENSION_BUFFS.filter((b) => b.type === "Eff");
const EXP_PERKS = ASCENSION_BUFFS.filter((b) => b.type === "Exp");

export function AlchemyLoadoutDrawer({
  isOpen,
  onClose,
  hasConfiguredProfile,
  activeProfileName,
  profileClassName,
  profileAlchemyLevel,
  parsedBartering,
  profileBartering,
  barteringOverride,
  onBarteringOverrideChange,
  membership,
  onMembershipChange,
  classOverride,
  onClassOverrideChange,
  conquestOverride,
  profileConquestRank,
  onConquestOverrideChange,
  ascensionBuffIds,
  onToggleAscension,
  onClearAscension,
  energizingPoolExp,
  onEnergizingPoolChange,
  baseIdleHours,
  housingAlchemyHours,
  defaultSessionHours,
  customSessionHours,
  onCustomSessionHoursChange,
  sessionHoursSource,
  hasWhatIfOverrides,
  onResetLoadout,
  buffTotals,
}: AlchemyLoadoutDrawerProps) {
  const effText = buffTotals.efficiencyBonus >= 0 ? `+${buffTotals.efficiencyBonus}%` : `${buffTotals.efficiencyBonus}%`;
  const expText = buffTotals.expBonus >= 0 ? `+${buffTotals.expBonus}%` : `${buffTotals.expBonus}%`;
  const taxText = `${Math.round(buffTotals.marketTaxRate * 100)}% tax`;

  const profileConquestLabel =
    ASSAULT_OPTIONS.find((opt) => opt.value === profileConquestRank)?.label || "No conquest buff";

  const classOptions = [
    {
      value: "profile",
      label: hasConfiguredProfile
        ? `Synced: ${profileClassName || "Standard"}`
        : "Default: Standard (0%)",
    },
    { value: "alchemist", label: "Test Alchemist (+10% Eff, +10% EXP)" },
    { value: "standard", label: "Test Other Class (0% bonus)" },
    { value: "penalty", label: "Test Cursed / Forsaken (-50% EXP)" },
  ];

  const conquestOptions = [
    {
      value: "profile",
      label: hasConfiguredProfile ? `Synced: ${profileConquestLabel}` : "Synced: Default",
    },
    ...ASSAULT_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      side="right"
      title="Loadout & Boosts"
      description="Synced from your character profile. Adjust any field here to test What-If setups without changing your profile."
      footer={
        <div className={styles.drawerFooterBar}>
          <div className={styles.drawerFooterSummary}>
            <span>{effText} Eff</span>
            <span className={styles.hairlineDivider} aria-hidden="true" />
            <span>{expText} EXP</span>
            <span className={styles.hairlineDivider} aria-hidden="true" />
            <span>{taxText}</span>
          </div>
          <Button variant="primary" size="sm" className={styles.drawerDoneBtn} onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div className={styles.drawerStack}>
        <section className={styles.drawerSection}>
          <div className={styles.drawerRowBetween}>
            <div className={styles.inlineGroup}>
              <h3 className={styles.drawerSectionTitle}>Character Profile</h3>
              {hasWhatIfOverrides && (
                <Badge size="sm" variant="warning">
                  What-If active
                </Badge>
              )}
            </div>
            <div className={styles.inlineGroup}>
              {hasWhatIfOverrides && (
                <Button variant="ghost" size="sm" onClick={onResetLoadout}>
                  <Icon name="undo" size="xs" aria-hidden="true" />
                  <span>Reset</span>
                </Button>
              )}
              <Link href="/profiles" className={styles.navPillLink}>
                <Icon name="profile" size="xs" aria-hidden="true" />
                <span>Profile</span>
              </Link>
            </div>
          </div>

          <div className={styles.profileStatusCard}>
            <strong>{hasConfiguredProfile ? activeProfileName : "Guest / Default Mode"}</strong>
            <div className={styles.profileStatsGrid}>
              <div className={styles.profileStatTile}>
                <span className={styles.profileStatLabel}>Alchemy Lv</span>
                <span className={styles.profileStatValue}>
                  {hasConfiguredProfile ? profileAlchemyLevel : "--"}
                </span>
              </div>
              <div className={styles.profileStatTile}>
                <span className={styles.profileStatLabel}>Profile Class</span>
                <span className={styles.profileStatValue}>
                  {hasConfiguredProfile ? profileClassName || "Standard" : "None"}
                </span>
              </div>
              <div className={styles.profileStatTile}>
                <span className={styles.profileStatLabel}>Bartering</span>
                <span className={styles.profileStatValue}>
                  +{parsedBartering.toFixed(1).replace(/\.0$/, "")}%
                </span>
              </div>
            </div>
            <div className={styles.inlineGroup}>
              <span className={styles.recipeSubline}>Session window: {sessionHoursSource}</span>
              {housingAlchemyHours > 0 && (
                <Badge size="sm" variant="refined">
                  Distillation Rig +{housingAlchemyHours}h
                </Badge>
              )}
            </div>
          </div>
        </section>

        <section className={styles.drawerSection}>
          <h3 className={styles.drawerSectionTitle}>Membership &amp; Temporary Class</h3>
          <Switch
            label="Membership"
            description="+10% Eff, +15% EXP, 12% market tax"
            checked={membership}
            onChange={(e) => onMembershipChange(e.target.checked)}
          />

          <div className={styles.fieldBlock}>
            <span className={styles.fieldLabel}>Class (What-If simulation)</span>
            <Select
              ariaLabel="Temporary class simulation"
              value={classOverride}
              onChange={(val) => onClassOverrideChange(val as WhatIfClassOverride)}
              options={classOptions}
            />
          </div>
        </section>

        <section className={styles.drawerSection}>
          <h3 className={styles.drawerSectionTitle}>Conquest, Bartering &amp; Session Cap</h3>
          <div className={styles.fieldBlock}>
            <span className={styles.fieldLabel}>Guild Conquest Rank (What-If)</span>
            <Select
              ariaLabel="Guild Conquest rank"
              value={conquestOverride}
              onChange={(val) => onConquestOverrideChange(val as AssaultRank | "profile")}
              options={conquestOptions}
            />
          </div>

          <div className={styles.popoverRow}>
            <NumberInput
              label={`Bartering % (Sync ${profileBartering}%)`}
              min={0}
              max={20}
              step={1}
              value={barteringOverride === "" ? profileBartering : Number(barteringOverride)}
              onChange={(val) => {
                if (Math.abs(val - profileBartering) < 0.01) onBarteringOverrideChange("");
                else onBarteringOverrideChange(Math.max(0, Math.min(20, val)));
              }}
            />
            <NumberInput
              label="Energizing Pool (+% EXP)"
              min={0}
              max={50}
              step={5}
              value={energizingPoolExp}
              onChange={(val) => onEnergizingPoolChange(Math.max(0, Math.min(50, val)))}
            />
          </div>

          <NumberInput
            label={`Idle Session Hours (Auto ${defaultSessionHours}h)`}
            min={0.5}
            max={24}
            step={0.5}
            value={customSessionHours === "" ? defaultSessionHours : Number(customSessionHours)}
            onChange={(val) => {
              if (Math.abs(val - defaultSessionHours) < 0.01) onCustomSessionHoursChange("");
              else onCustomSessionHoursChange(Math.max(0.5, Math.min(24, val)));
            }}
          />
          {customSessionHours !== "" && (
            <Button variant="ghost" size="sm" onClick={() => onCustomSessionHoursChange("")}>
              Reset session cap to {defaultSessionHours}h ({baseIdleHours}h base +{" "}
              {housingAlchemyHours}h housing)
            </Button>
          )}
        </section>

        <section className={styles.drawerSection}>
          <div className={styles.drawerRowBetween}>
            <h3 className={styles.drawerSectionTitle}>
              Ascension Perks ({ascensionBuffIds.length}/5)
            </h3>
            {ascensionBuffIds.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onClearAscension}>
                Clear
              </Button>
            )}
          </div>
          <div className={styles.inlineGroup}>
            <span className={styles.recipeSubline}>Efficiency +{buffTotals.ascensionEff}%</span>
            <span className={styles.hairlineDivider} aria-hidden="true" />
            <span className={styles.recipeSubline}>EXP +{buffTotals.ascensionExp}%</span>
          </div>
          <div className={styles.fieldBlock}>
            <span className={styles.fieldLabel}>Efficiency Perks</span>
            <div className={styles.ascensionList}>
              {EFF_PERKS.map((buff) => (
                <Tag
                  key={buff.id}
                  label={`${buff.label} +${buff.value}%`}
                  selected={ascensionBuffIds.includes(buff.id)}
                  onSelect={() => onToggleAscension(buff.id)}
                />
              ))}
            </div>
          </div>
          <div className={styles.fieldBlock}>
            <span className={styles.fieldLabel}>EXP Perks</span>
            <div className={styles.ascensionList}>
              {EXP_PERKS.map((buff) => (
                <Tag
                  key={buff.id}
                  label={`${buff.label} +${buff.value}%`}
                  selected={ascensionBuffIds.includes(buff.id)}
                  onSelect={() => onToggleAscension(buff.id)}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </Drawer>
  );
}
