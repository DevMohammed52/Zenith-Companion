"use client";

import React from "react";
import type { CharacterProfile, CombatStyle, ProfileFieldSource, ProfileUpdateOptions } from "@/lib/profiles";
import {
  calculateProfileSecondaryStats,
  formatStatName,
  getItemRequirementLevel,
  getToolEfficiency,
  type ProfileItemRecord,
} from "@/lib/profile-calculations";
import QualityText from "@/components/QualityText";
import { Icon } from "@/components/ui/Icon";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import styles from "../Profiles.module.css";
import { ProfileNumberField, ProfilePicker, type PickerOption } from "./ProfileControls";

export const ARMOR_GEAR_FIELDS: Array<[string, string, string[]]> = [
  ["helmet", "Helmet", ["HELMET"]],
  ["chestplate", "Chestplate", ["CHESTPLATE"]],
  ["greaves", "Greaves", ["GREAVES"]],
  ["boots", "Boots", ["BOOTS"]],
  ["gauntlets", "Gauntlets", ["GAUNTLETS"]],
];

export const COMBAT_STYLE_OPTIONS: Array<{ value: CombatStyle; label: string; hint: string }> = [
  { value: "swordShield", label: "Sword + Shield", hint: "One sword, optional shield" },
  { value: "dualDaggers", label: "Dual Daggers", hint: "Two dagger slots" },
  { value: "bow", label: "Bow", hint: "Bow only, no shield" },
];

export const TOOL_FIELDS: Array<[string, string, string[]]> = [
  ["woodcutting", "Woodcutting", ["FELLING_AXE"]],
  ["mining", "Mining", ["PICKAXE"]],
  ["fishing", "Fishing", ["FISHING_ROD"]],
];

export function formatShortStats(stats?: Record<string, number> | null, limit = 3): string {
  const entries = Object.entries(stats || {}).filter(([, value]) => Number(value) !== 0).slice(0, limit);
  if (!entries.length) return "";
  return entries.map(([key, value]) => `${formatStatName(key)} ${value}`).join(" / ");
}

export function formatItemEffects(effects?: ProfileItemRecord["effects"], limit = 3): string {
  const entries = (effects || [])
    .filter((effect) => Number(effect?.value || 0) !== 0)
    .slice(0, limit);
  if (!entries.length) return "";
  return entries
    .map((effect) => {
      const target = String(effect.target || "").replace(/_/g, " ");
      const attribute = String(effect.attribute || "").replace(/_/g, " ");
      const value = Number(effect.value || 0);
      const suffix = effect.value_type === "percentage" || effect.value_type === "efficiency" ? "%" : "";
      const label = attribute === "magic find" ? "MF" : formatStatName(attribute);
      return `${target ? `${target} ` : ""}${label} +${value}${suffix}`;
    })
    .join(" / ");
}

export interface ProfileGearSectionProps {
  profile: CharacterProfile;
  itemByName: Record<string, ProfileItemRecord>;
  itemOptionsByType: Record<string, ProfileItemRecord[]>;
  openPicker: string | null;
  setOpenPicker: (id: string | null) => void;
  updateCombatStyle: (combatStyle: CombatStyle) => void;
  patchActive: (patch: Partial<CharacterProfile>, options?: ProfileUpdateOptions) => void;
  fieldSource: (path: string) => ProfileFieldSource | undefined;
}

export function ProfileGearSection({
  profile,
  itemByName,
  itemOptionsByType,
  openPicker,
  setOpenPicker,
  updateCombatStyle,
  patchActive,
  fieldSource,
}: ProfileGearSectionProps) {
  const getSlotOptions = (types: string[]) => types.flatMap((type) => itemOptionsByType[type] || []);

  const itemPickerOption = (item: ProfileItemRecord): PickerOption<ProfileItemRecord> => ({
    id: item.name || "",
    title: item.name || "Unknown item",
    subtitle: (
      <>
        <QualityText value={item.quality || "UNKNOWN"}>{item.quality || "UNKNOWN"}</QualityText> ·{" "}
        {String(item.type || "").replace(/_/g, " ")}
        {getItemRequirementLevel(item) ? ` · Lv. ${getItemRequirementLevel(item)}` : ""}
      </>
    ),
    image: item.image_url,
    badge: item.max_tier ? `T${item.max_tier}` : undefined,
    searchText: `${item.name} ${item.quality} ${item.type} ${formatShortStats(item.stats, 6)}`,
    value: item,
  });

  const renderGearSlot = (key: string, label: string, types: string[], disabled = false, tiered = true) => {
    const options = getSlotOptions(types);
    const selected = itemByName[profile.gear[key] || ""];
    const selectedOption = selected
      ? itemPickerOption(selected)
      : {
          id: "none",
          title: `Select ${label}`,
          subtitle: "Empty slot",
          searchText: "none",
          value: null,
        };
    const maxTier = Number(selected?.max_tier || 1);
    const previewProfile = {
      ...profile,
      gear: { ...Object.fromEntries(Object.keys(profile.gear).map((slot) => [slot, ""])), [key]: profile.gear[key] },
      gearTiers: { ...profile.gearTiers, [key]: profile.gearTiers[key] || 1 },
      combatStyle: key === "bow" ? "bow" : key === "offhandWeapon" ? "dualDaggers" : profile.combatStyle,
    } as CharacterProfile;
    const stats = calculateProfileSecondaryStats(previewProfile, itemByName);

    return (
      <div key={key} className={styles.gearSlotRow}>
        <div className={tiered ? styles.gearSlotInputs : undefined}>
          <ProfilePicker
            id={`gear-${key}`}
            label={label}
            placeholder={`Select ${label}`}
            selected={selectedOption}
            options={[
              { id: "none", title: "None", subtitle: "Clear this slot", searchText: "none clear", value: null, muted: true },
              ...options.map(itemPickerOption),
            ]}
            openId={openPicker}
            setOpenId={setOpenPicker}
            disabled={disabled}
            source={fieldSource(`gear.${key}`)}
            onSelect={(item) => {
              const next = item as ProfileItemRecord | null;
              patchActive({
                gear: { ...profile.gear, [key]: next?.name || "" },
                gearTiers: { ...profile.gearTiers, [key]: 1 },
              });
            }}
          />
          {tiered && (
            <ProfileNumberField
              label={`Tier / ${maxTier}`}
              value={profile.gearTiers?.[key] ?? 1}
              min={1}
              max={maxTier}
              onChange={(value) => {
                patchActive({
                  gearTiers: {
                    ...profile.gearTiers,
                    [key]: value === "" ? "" : Math.min(Math.max(Number(value) || 1, 1), maxTier),
                  },
                });
              }}
              onBlur={() => {
                if (profile.gearTiers?.[key] === "") {
                  patchActive({ gearTiers: { ...profile.gearTiers, [key]: 1 } });
                }
              }}
              source={fieldSource(`gearTiers.${key}`)}
            />
          )}
        </div>

        {selected && (
          <div className={styles.gearSummaryRow}>
            <strong>
              {formatShortStats(selected.stats, 4) || formatItemEffects(selected.effects, 3) || "No base stats"}
            </strong>
            {selected.tier_modifiers && <span>Tier gain: {formatShortStats(selected.tier_modifiers, 3)}</span>}
            {tiered && (
              <span>
                AP {stats.attackPower} · Prot {stats.protection} · Agi {stats.agility} · Acc {stats.accuracy}
              </span>
            )}
          </div>
        )}
        {disabled && (
          <div className={styles.gearSummaryRow}>
            <span>Disabled by current weapon setup.</span>
          </div>
        )}
      </div>
    );
  };

  const activeStyleOption = COMBAT_STYLE_OPTIONS.find((opt) => opt.value === profile.combatStyle);

  return (
    <section id="profile-gear" className={styles.panel} tabIndex={-1}>
      <div className={styles.panelHeading}>
        <div>
          <h2>Gear & Tools</h2>
          <p>Click any equipment or tool slot to search the item database in full view.</p>
        </div>
        <div style={{ display: "grid", gap: "0.3rem", minWidth: "min(22rem, 100%)" }}>
          <SegmentedControl<CombatStyle>
            ariaLabel="Weapon setup"
            value={profile.combatStyle}
            onChange={updateCombatStyle}
            fullWidth
            options={COMBAT_STYLE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
          {activeStyleOption && (
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", textAlign: "right" }}>
              {activeStyleOption.hint}
            </small>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <Icon name="defense" size="sm" aria-hidden="true" />
        <h3 style={{ margin: 0, fontSize: "0.96rem", fontWeight: 800 }}>Combat Equipment</h3>
      </div>

      <div className={styles.gridGear}>
        {ARMOR_GEAR_FIELDS.map(([key, label, types]) => renderGearSlot(key, label, types))}
        {renderGearSlot("special", "Special", ["SPECIAL"], false, false)}
        {profile.combatStyle === "swordShield" && (
          <>
            {renderGearSlot("weapon", "Sword", ["SWORD"])}
            {renderGearSlot("shield", "Shield", ["SHIELD"])}
          </>
        )}
        {profile.combatStyle === "dualDaggers" && (
          <>
            {renderGearSlot("weapon", "Main Dagger", ["DAGGER"])}
            {renderGearSlot("offhandWeapon", "Offhand Dagger", ["DAGGER"])}
            {renderGearSlot("shield", "Shield", ["SHIELD"], true)}
          </>
        )}
        {profile.combatStyle === "bow" && (
          <>
            {renderGearSlot("bow", "Bow", ["BOW"])}
            {renderGearSlot("shield", "Shield", ["SHIELD"], true)}
          </>
        )}
      </div>

      <div className={styles.subHeading}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Icon name="craftTool" size="sm" aria-hidden="true" />
          <h3>Gathering Tools</h3>
        </div>
      </div>

      <div className={styles.gridTools}>
        {TOOL_FIELDS.map(([key, label, types]) => {
          const selected = itemByName[profile.tools[key] || ""];
          return (
            <div key={key} className={styles.gearSlotRow}>
              <ProfilePicker
                id={`tool-${key}`}
                label={label}
                placeholder={`Select ${label}`}
                selected={
                  selected
                    ? itemPickerOption(selected)
                    : {
                        id: "none",
                        title: `Select ${label}`,
                        subtitle: "Tool",
                        searchText: "none",
                        value: null,
                      }
                }
                options={[
                  { id: "none", title: "None", subtitle: "Clear this tool", searchText: "none clear", value: null, muted: true },
                  ...getSlotOptions(types).map(itemPickerOption),
                ]}
                openId={openPicker}
                setOpenId={setOpenPicker}
                source={fieldSource(`tools.${key}`)}
                onSelect={(item) => {
                  const next = item as ProfileItemRecord | null;
                  patchActive({ tools: { ...profile.tools, [key]: next?.name || "" } });
                }}
              />
              <div className={styles.gearSummaryRow}>
                <strong>{selected ? `Efficiency: +${getToolEfficiency(selected)}%` : "No tool selected"}</strong>
                {selected?.requirements && <span>Req. Lv. {getItemRequirementLevel(selected)}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
