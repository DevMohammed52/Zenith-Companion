"use client";

import React from "react";
import { Button, Drawer, NumberInput, Tag } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import QualityText from "@/components/QualityText";
import { PRIORITIES, STYLE_OPTIONS } from "../types";
import type { UseBisStateResult } from "../hooks/useBisState";
import styles from "../page.module.css";

interface BisLoadoutDrawerProps {
  state: UseBisStateResult;
}

export function BisLoadoutDrawer({ state }: BisLoadoutDrawerProps) {
  return (
    <Drawer
      isOpen={state.isLoadoutOpen}
      onClose={() => state.setIsLoadoutOpen(false)}
      side="right"
      title="Loadout & What-If Setup"
      description={`Synced from ${state.activeProfileName}. Adjust levels or style to test loadouts without changing your saved profile.`}
      footer={
        <div className={styles.drawerFooterActions}>
          {state.hasWhatIfChanges && (
            <Button variant="secondary" size="sm" onClick={state.resetToProfile}>
              <Icon name="undo" size="sm" aria-hidden="true" />
              Reset to Profile
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={() => state.setIsLoadoutOpen(false)}>
            Done
          </Button>
        </div>
      }
    >
      <div className={styles.drawerSection}>
        <span className={styles.drawerLabel}>Combat Style</span>
        <div className={styles.drawerChipRow} role="group" aria-label="Combat style">
          {STYLE_OPTIONS.map((opt) => (
            <Tag
              key={opt.id}
              label={opt.label}
              selected={state.activeCombatStyle === opt.id}
              onSelect={() => state.setCombatStyle(opt.id)}
            />
          ))}
        </div>
      </div>

      <div className={styles.drawerSection}>
        <span className={styles.drawerLabel}>Stat Priority</span>
        <div className={styles.drawerChipRow} role="group" aria-label="Stat scoring priority">
          {PRIORITIES.map((opt) => (
            <Tag
              key={opt.id}
              label={opt.label}
              selected={state.priority === opt.id}
              onSelect={() => state.setPriority(opt.id)}
            />
          ))}
        </div>
      </div>

      <div className={styles.drawerSection}>
        <span className={styles.drawerLabel}>Character Levels (What-If)</span>
        <div className={styles.drawerLevelsGrid}>
          <NumberInput
            label="Combat"
            value={state.levels.combat}
            min={1}
            max={120}
            onChange={(val) => state.updateWhatIfLevel("combat", val)}
          />
          <NumberInput
            label="Strength"
            value={state.levels.strength}
            min={1}
            max={120}
            onChange={(val) => state.updateWhatIfLevel("strength", val)}
          />
          <NumberInput
            label="Dexterity"
            value={state.levels.dexterity}
            min={1}
            max={120}
            onChange={(val) => state.updateWhatIfLevel("dexterity", val)}
          />
          <NumberInput
            label="Defence"
            value={state.levels.defence}
            min={1}
            max={120}
            onChange={(val) => state.updateWhatIfLevel("defence", val)}
          />
        </div>
      </div>

      <div className={styles.drawerSection}>
        <span className={styles.drawerLabel}>Currently Equipped ({state.activeStyleLabel})</span>
        <div className={styles.drawerEquippedList}>
          {state.equippedBaselines.map((slot) => (
            <div key={slot.slotKey} className={styles.drawerEquippedRow}>
              <span>{slot.label}</span>
              {slot.item ? (
                <span>
                  <QualityText value={slot.item.quality}>{slot.item.name}</QualityText>{" "}
                  <small>T{slot.tier}</small>
                </span>
              ) : (
                <span>Empty</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
}
