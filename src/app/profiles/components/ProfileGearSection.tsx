"use client";

import React from "react";
import { FileUp, Shield, Swords } from "lucide-react";
import type { CharacterProfile, CombatStyle, ProfileFieldSource, ProfileUpdateOptions } from "@/lib/profiles";
import {
  calculateProfileSecondaryStats,
  formatStatName,
  getItemRequirementLevel,
  getToolEfficiency,
  type ProfileItemRecord,
} from "@/lib/profile-calculations";
import QualityText from "@/components/QualityText";
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
  return entries.map((effect) => {
    const target = String(effect.target || "").replace(/_/g, " ");
    const attribute = String(effect.attribute || "").replace(/_/g, " ");
    const value = Number(effect.value || 0);
    const suffix = effect.value_type === "percentage" || effect.value_type === "efficiency" ? "%" : "";
    const label = attribute === "magic find" ? "MF" : formatStatName(attribute);
    return `${target ? `${target} ` : ""}${label} +${value}${suffix}`;
  }).join(" / ");
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
        <QualityText value={item.quality || "UNKNOWN"}>{item.quality || "UNKNOWN"}</QualityText> - {String(item.type || "").replace(/_/g, " ")}
        {getItemRequirementLevel(item) ? ` - Lv. ${getItemRequirementLevel(item)}` : ""}
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
    const selectedOption = selected ? itemPickerOption(selected) : {
      id: "none",
      title: `Select ${label}`,
      subtitle: label,
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
      <div key={key} className={`profile-item-slot rich ${disabled ? "disabled" : ""}`}>
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
        {selected && (
          <div className="profile-slot-stats">
            <span>{formatShortStats(selected.stats, 5) || formatItemEffects(selected.effects, 4) || "No base stats"}</span>
            {selected.tier_modifiers && <small>Tier gain: {formatShortStats(selected.tier_modifiers, 5)}</small>}
            {tiered && <small>Slot preview: AP {stats.attackPower}, Prot {stats.protection}, Agi {stats.agility}, Acc {stats.accuracy}</small>}
          </div>
        )}
        {disabled && <div className="profile-slot-stats"><span>Disabled by current weapon setup.</span></div>}
      </div>
    );
  };

  return (
    <section id="profile-gear" className="profile-panel" tabIndex={-1}>
      <div className="profile-panel-heading">
        <div>
          <h2>Gear And Tools</h2>
          <p>Gear and tools come from the item database. Tier 1 is the base item; higher tiers apply stored tier modifiers.</p>
        </div>
      </div>
      <div className="profile-dual-grid">
        <div>
          <h3><Shield size={14} /> Gear</h3>
          <div className="profile-loadout-card">
            <span><Swords size={14} /> Weapon Setup</span>
            <div className="profile-loadout-options">
              {COMBAT_STYLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={profile.combatStyle === option.value ? "active" : ""}
                  onClick={() => updateCombatStyle(option.value)}
                >
                  <strong>{option.label}</strong>
                  <small>{option.hint}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="profile-grid single">
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
        </div>
        <div>
          <h3><FileUp size={14} /> Tools</h3>
          <div className="profile-grid single">
            {TOOL_FIELDS.map(([key, label, types]) => {
              const selected = itemByName[profile.tools[key] || ""];
              return (
                <div key={key} className="profile-item-slot tool-slot">
                  <ProfilePicker
                    id={`tool-${key}`}
                    label={label}
                    placeholder={`Select ${label}`}
                    selected={selected ? itemPickerOption(selected) : {
                      id: "none",
                      title: `Select ${label}`,
                      subtitle: "Tool",
                      searchText: "none",
                      value: null,
                    }}
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
                  <div className="profile-slot-stats">
                    <span>{selected ? `Efficiency: +${getToolEfficiency(selected)}%` : "No tool selected"}</span>
                    {selected?.requirements && <small>Requires Lv. {getItemRequirementLevel(selected)}</small>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
