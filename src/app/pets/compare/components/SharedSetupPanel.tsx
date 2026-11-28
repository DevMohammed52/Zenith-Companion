"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { NumberInput } from "@/components/ui/NumberInput";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import type { CharacterProfile } from "@/lib/profiles";
import type { BattleProfitMode, FoodPolicy, StatKey } from "@/lib/pets";
import {
  BATTLE_OPTIONS,
  EVOLUTION_OPTIONS,
  FOOD_OPTIONS,
  type PetOption,
} from "../types";
import styles from "../page.module.css";

export function SharedSetupPanel({
  activeProfile,
  profilePetOption,
  scenarioModified,
  scenarioSummary,
  isCompactViewport,
  petLevel,
  setPetLevel,
  masteryLevel,
  setMasteryLevel,
  evolutionStage,
  setEvolutionStage,
  evolutionStat,
  setEvolutionStat,
  battleMode,
  setBattleMode,
  battleZone,
  setBattleZone,
  battleZoneOptions,
  foodPolicy,
  setFoodPolicy,
  patBonus,
  setPatBonus,
  onAddPet,
  onResetScenario,
}: {
  activeProfile: CharacterProfile | null;
  profilePetOption: PetOption | null;
  scenarioModified: boolean;
  scenarioSummary: string;
  isCompactViewport: boolean;
  petLevel: number;
  setPetLevel: (val: number) => void;
  masteryLevel: number;
  setMasteryLevel: (val: number) => void;
  evolutionStage: number;
  setEvolutionStage: (val: number) => void;
  evolutionStat: StatKey | "all";
  setEvolutionStat: (val: StatKey | "all") => void;
  battleMode: BattleProfitMode;
  setBattleMode: (val: BattleProfitMode) => void;
  battleZone: string;
  setBattleZone: (val: string) => void;
  battleZoneOptions: Array<{ value: string; label: string }>;
  foodPolicy: FoodPolicy;
  setFoodPolicy: (val: FoodPolicy) => void;
  patBonus: boolean;
  setPatBonus: Dispatch<SetStateAction<boolean>>;
  onAddPet: (id: string) => void;
  onResetScenario: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setIsOpen(!isCompactViewport);
  }, [isCompactViewport]);

  return (
    <section className={styles.panel} aria-labelledby="shared-pet-setup-heading">
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.sectionKicker}>Scenario</span>
          <h2 id="shared-pet-setup-heading" className={styles.panelTitle}>
            Shared Pet Setup
          </h2>
        </div>
        <div className={styles.headerActions}>
          {profilePetOption && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => onAddPet(profilePetOption.id)}
              icon={<Icon name="plus" size="sm" aria-hidden="true" />}
            >
              Add {activeProfile?.name}&apos;s {profilePetOption.title}
            </Button>
          )}
          <Button
            variant="ghost"
            size="md"
            onClick={onResetScenario}
            disabled={!scenarioModified}
            aria-label="Reset setup to defaults"
            icon={<Icon name="undo" size="sm" aria-hidden="true" />}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className={styles.setupAccordion}>
        <button
          type="button"
          className={styles.setupTrigger}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="compare-setup-accordion"
        >
          <span className={styles.setupTriggerLeft}>
            <Icon name="filter" size="sm" aria-hidden="true" />
            <span className={styles.setupTriggerTitle}>Setup Controls</span>
            <span className={styles.setupTriggerMeta}>
              {scenarioSummary}
              {scenarioModified ? " | Custom" : ""}
            </span>
          </span>
          <span className={`${styles.setupChevron} ${isOpen ? styles.setupChevronOpen : ""}`}>
            <Icon name="chevronDown" size="md" aria-hidden="true" />
          </span>
        </button>

        <div
          id="compare-setup-accordion"
          aria-hidden={!isOpen}
          inert={!isOpen ? true : undefined}
          className={`${styles.setupAccordionContent} ${isOpen ? styles.setupAccordionOpen : ""}`}
        >
          <div className={styles.setupInnerWrapper}>
            <div className={styles.setupFieldsGrid}>
              <NumberInput
                label="Pet Level"
                value={petLevel}
                min={1}
                max={100}
                onChange={setPetLevel}
              />
              <NumberInput
                label="Pet Mastery"
                value={masteryLevel}
                min={1}
                max={100}
                onChange={setMasteryLevel}
              />
              <NumberInput
                label="Evolution Stage"
                value={evolutionStage}
                min={0}
                max={5}
                onChange={setEvolutionStage}
              />

              <div className={styles.setupField}>
                <label className={styles.fieldLabel}>Evolution Focus</label>
                <Select
                  ariaLabel="Evolution Focus"
                  value={evolutionStat}
                  options={EVOLUTION_OPTIONS}
                  onChange={(val) => setEvolutionStat(val as StatKey | "all")}
                />
              </div>

              <div className={styles.setupField}>
                <label className={styles.fieldLabel}>Battle Sample</label>
                <Select
                  ariaLabel="Battle Sample"
                  value={battleMode}
                  options={BATTLE_OPTIONS}
                  onChange={(val) => setBattleMode(val as BattleProfitMode)}
                />
              </div>

              <div className={styles.setupField}>
                <label className={styles.fieldLabel}>Battle Zone</label>
                <Select
                  ariaLabel="Battle Zone"
                  value={battleZone}
                  options={battleZoneOptions}
                  onChange={setBattleZone}
                />
              </div>

              <div className={styles.setupField}>
                <label className={styles.fieldLabel}>Food Buff</label>
                <Select
                  ariaLabel="Food Buff"
                  value={foodPolicy}
                  options={FOOD_OPTIONS}
                  onChange={(val) => setFoodPolicy(val as FoodPolicy)}
                />
              </div>
            </div>

            <div className={styles.setupFooterRow}>
              <Switch
                checked={patBonus}
                onChange={(e) => setPatBonus(e.target.checked)}
                label="Pat Buff (+5% stats)"
              />
              <span className={styles.setupHint}>
                Database pets use this setup; owned snapshots keep saved stats.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
