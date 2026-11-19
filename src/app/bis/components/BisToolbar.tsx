"use client";

import React from "react";
import { Search } from "lucide-react";
import { ControlGroup } from "./BisPrimitives";
import {
  PRIORITIES,
  STYLE_OPTIONS,
  type CombatStyle,
  type Priority,
} from "../types";

export interface BisToolbarProps {
  search: string;
  setSearch: (value: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  activeCombatStyle: CombatStyle;
  setCombatStyle: (style: CombatStyle) => void;
  priority: Priority;
  setPriority: (priority: Priority) => void;
  profileCombatLevel: number | "" | undefined;
  profileStrength: number | "" | undefined;
  profileDexterity: number | "" | undefined;
  profileDefence: number | "" | undefined;
  handleLevelChange: (key: "combatLevel" | "strStat" | "dexStat" | "defStat", value: string) => void;
}

export function BisToolbar({
  search,
  setSearch,
  searchInputRef,
  activeCombatStyle,
  setCombatStyle,
  priority,
  setPriority,
  profileCombatLevel,
  profileStrength,
  profileDexterity,
  profileDefence,
  handleLevelChange,
}: BisToolbarProps) {
  const levelFields = [
    { key: "combatLevel" as const, label: "Combat", value: profileCombatLevel },
    { key: "strStat" as const, label: "Strength", value: profileStrength },
    { key: "dexStat" as const, label: "Dexterity", value: profileDexterity },
    { key: "defStat" as const, label: "Defence", value: profileDefence },
  ];

  return (
    <>
      <section className="bis-toolbar" aria-label="Gear controls">
        <label className="search-field">
          <span>Search</span>
          <div className="search-wrap">
            <Search size={17} aria-hidden="true" />
            <input
              ref={searchInputRef}
              aria-label="Search gear"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Gear, stat, rarity..."
            />
          </div>
        </label>

        <ControlGroup label="Style">
          {STYLE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={activeCombatStyle === option.id ? "is-active" : ""}
              aria-pressed={activeCombatStyle === option.id}
              onClick={() => setCombatStyle(option.id)}
            >
              {option.label}
            </button>
          ))}
        </ControlGroup>

        <ControlGroup label="Ranking">
          {PRIORITIES.map((option) => (
            <button
              key={option.id}
              type="button"
              className={priority === option.id ? "is-active" : ""}
              aria-pressed={priority === option.id}
              onClick={() => setPriority(option.id)}
            >
              {option.label}
            </button>
          ))}
        </ControlGroup>
      </section>

      <section className="level-strip" aria-label="Profile levels">
        {levelFields.map(({ key, label, value }) => (
          <label key={key}>
            <span>{label}</span>
            <input
              value={value}
              inputMode="numeric"
              aria-label={label}
              onChange={(event) => handleLevelChange(key, event.target.value)}
            />
          </label>
        ))}
      </section>
    </>
  );
}
