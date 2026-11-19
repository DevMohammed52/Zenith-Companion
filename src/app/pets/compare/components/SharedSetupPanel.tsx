"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  Clock3,
  ChevronDown,
  Database,
  HeartPulse,
  MapPinned,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Utensils,
} from "lucide-react";
import type { CharacterProfile } from "@/lib/profiles";
import type { BattleProfitMode, FoodPolicy, StatKey } from "@/lib/pets";
import {
  BATTLE_OPTIONS,
  BEST_BATTLE_ZONE,
  EVOLUTION_OPTIONS,
  FOOD_OPTIONS,
  type PetOption,
} from "../types";
import { getBattleModeLabel, getFoodPolicyLabel } from "../utils/compare-helpers";
import { NumberField } from "./NumberField";
import { OptionMenu } from "./OptionMenu";
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
  openMenu,
  setOpenMenu,
  battleCoverage,
  rowsCount,
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
  openMenu: string | null;
  setOpenMenu: (menu: string | null) => void;
  battleCoverage: { petsWithBattle: number; selectedZonePets: number; comparedWithZone: number };
  rowsCount: number;
  onAddPet: (id: string) => void;
  onResetScenario: () => void;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.kicker}>Scenario</span>
          <h2>Shared Pet Setup</h2>
        </div>
        <div className={styles.headerActions}>
          {profilePetOption && (
            <button
              type="button"
              className={styles.profilePetButton}
              onClick={() => onAddPet(profilePetOption.id)}
            >
              <Sparkles size={16} />
              Add {activeProfile?.name}&apos;s {profilePetOption.title}
            </button>
          )}
          <button
            type="button"
            className={styles.resetButton}
            onClick={onResetScenario}
            disabled={!scenarioModified}
            aria-label="Reset setup to defaults"
          >
            <RotateCcw size={16} />
            Reset setup
          </button>
        </div>
      </div>
      <details className={styles.scenarioDrawer} open={!isCompactViewport ? true : undefined}>
        <summary>
          <span>
            <SlidersHorizontal size={17} /> Scenario controls
          </span>
          <small>{scenarioSummary}</small>
          <ChevronDown size={17} />
        </summary>
        <div className={styles.controls}>
          <NumberField
            label="Pet level"
            value={petLevel}
            min={1}
            max={100}
            onChange={setPetLevel}
          />
          <NumberField
            label="Pet Mastery"
            value={masteryLevel}
            min={1}
            max={100}
            onChange={setMasteryLevel}
          />
          <NumberField
            label="Evolution"
            value={evolutionStage}
            min={0}
            max={5}
            onChange={setEvolutionStage}
          />
          <OptionMenu
            label="Evolution stat"
            value={evolutionStat}
            options={EVOLUTION_OPTIONS}
            open={openMenu === "evolution"}
            onOpen={(open) => setOpenMenu(open ? "evolution" : null)}
            onChange={setEvolutionStat}
          />
          <OptionMenu
            label="Battle sample"
            value={battleMode}
            options={BATTLE_OPTIONS}
            open={openMenu === "battle"}
            onOpen={(open) => setOpenMenu(open ? "battle" : null)}
            onChange={setBattleMode}
          />
          <OptionMenu
            label="Battle zone"
            value={battleZone}
            options={battleZoneOptions}
            open={openMenu === "battle-zone"}
            onOpen={(open) => setOpenMenu(open ? "battle-zone" : null)}
            onChange={setBattleZone}
          />
          <OptionMenu
            label="Food"
            value={foodPolicy}
            options={FOOD_OPTIONS}
            open={openMenu === "food"}
            onOpen={(open) => setOpenMenu(open ? "food" : null)}
            onChange={setFoodPolicy}
          />
          <button
            type="button"
            className={`${styles.toggle} ${patBonus ? styles.activeToggle : ""}`}
            aria-pressed={patBonus}
            onClick={() => setPatBonus((value) => !value)}
          >
            <HeartPulse size={16} /> Pat +5%
          </button>
        </div>
      </details>
      <p className={styles.snapshotHint}>
        Shared setup affects database pets only; owned snapshots use saved stats.
      </p>
      <p className={styles.scenarioNote}>
        Level, mastery, evolution, and pat affect database species previews. Owned snapshots keep
        imported/manual stat values. Battle EV uses recorded research data only; it does not import
        live pet state, route movement, active map position, or future combat scaling.
      </p>
      <div className={styles.auditGrid} aria-label="Pet comparison assumptions">
        <div className={styles.auditCard}>
          <Database size={17} />
          <span>Battle data</span>
          <strong>Research snapshot</strong>
          <small>Compared only where recorded zones exist.</small>
        </div>
        <div className={styles.auditCard}>
          <MapPinned size={17} />
          <span>Zone picker</span>
          <strong>
            {battleZone === BEST_BATTLE_ZONE
              ? "Best recorded zone"
              : battleZone.replace(/^Level\s+/, "L")}
          </strong>
          <small>No travel path or map-routing rank is applied.</small>
        </div>
        <div className={styles.auditCard}>
          <Clock3 size={17} />
          <span>Cycle model</span>
          <strong>{getBattleModeLabel(battleMode)}</strong>
          <small>Uses the selected recorded sleep/stamina scenario.</small>
        </div>
        <div className={styles.auditCard}>
          <Utensils size={17} />
          <span>Food model</span>
          <strong>{getFoodPolicyLabel(foodPolicy)}</strong>
          <small>Food is toggled from the recorded cheapest food cost.</small>
        </div>
      </div>
      <div className={styles.contextStrip} aria-label="Recorded battle coverage summary">
        <div>
          <span>Battle coverage</span>
          <strong>
            {battleCoverage.selectedZonePets}/{battleCoverage.petsWithBattle} pets
          </strong>
          <small>
            {battleZone === BEST_BATTLE_ZONE
              ? "Any recorded zone"
              : battleZone.replace(/^Level\s+/, "L")}
          </small>
        </div>
        <div>
          <span>Compared now</span>
          <strong>
            {battleCoverage.comparedWithZone}/{rowsCount || 0}
          </strong>
          <small>Only selected pets are shown below.</small>
        </div>
        <div>
          <span>Ranking scope</span>
          <strong>Recorded EV only</strong>
          <small>No route travel, current map position, or live battle state.</small>
        </div>
      </div>
    </section>
  );
}
