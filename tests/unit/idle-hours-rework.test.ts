import { describe, expect, it } from "vitest";
import {
  canUseHousingGuestAccess,
  getProfileBaseIdleActionHours,
  HOUSING_GUEST_BLOCKED_CLASSES,
} from "@/lib/housing";
import { getProfileIdleActionHoursForDungeon } from "@/app/dungeons/types";
import { CLASS_DATA, getClassInfo } from "@/lib/profile-calculations";
import type { CharacterProfile } from "@/lib/profiles";

describe("Alt Character Base Idle Hours & Market-Locked Class Rules (Patch v0.85.0)", () => {
  describe("Gate 1: Base Idle Hours Permutations", () => {
    it("assigns 8 hours to main characters regardless of class and membership", () => {
      expect(getProfileBaseIdleActionHours({ kind: "main", className: "Warrior" }, false)).toBe(8);
      expect(getProfileBaseIdleActionHours({ kind: "main", className: "Warrior" }, true)).toBe(8);
      expect(getProfileBaseIdleActionHours({ kind: "main", className: "Smelter" }, false)).toBe(8);
      expect(getProfileBaseIdleActionHours({ kind: "main", className: "Forsaken" }, false)).toBe(8);
      expect(getProfileBaseIdleActionHours({ kind: "main", className: "Banished" }, false)).toBe(8);
      expect(getProfileBaseIdleActionHours({ kind: "main", className: "Cursed" }, false)).toBe(8);
    });

    it("assigns 4 hours to free-to-play standard alt characters", () => {
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "Warrior" }, false)).toBe(4);
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "Smelter" }, false)).toBe(4);
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "Alchemist" }, false)).toBe(4);
    });

    it("assigns 6 hours to membership standard alt characters", () => {
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "Warrior" }, true)).toBe(6);
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "Smelter" }, true)).toBe(6);
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "Alchemist" }, true)).toBe(6);
    });

    it("assigns 8 hours to Banished alts regardless of membership", () => {
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "Banished" }, false)).toBe(8);
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "Banished" }, true)).toBe(8);
      // Case-insensitivity check
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "BANISHED" }, false)).toBe(8);
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "banished" }, false)).toBe(8);
    });

    it("assigns 8 hours to Cursed alts regardless of membership", () => {
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "Cursed" }, false)).toBe(8);
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "Cursed" }, true)).toBe(8);
      // Case-insensitivity check
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "CURSED" }, false)).toBe(8);
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "cursed" }, false)).toBe(8);
    });

    it("treats Forsaken alts as standard market-accessible alts (4h free / 6h member)", () => {
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "Forsaken" }, false)).toBe(4);
      expect(getProfileBaseIdleActionHours({ kind: "alt", className: "Forsaken" }, true)).toBe(6);
    });

    it("handles falsy and fallback profiles safely", () => {
      expect(getProfileBaseIdleActionHours(null)).toBe(0);
      expect(getProfileBaseIdleActionHours(undefined)).toBe(0);
      // Unspecified kind defaults to alt
      expect(getProfileBaseIdleActionHours({ className: "Smelter" }, false)).toBe(4);
      expect(getProfileBaseIdleActionHours({ className: "Smelter" }, true)).toBe(6);
      // Banished still gets 8h without explicit kind
      expect(getProfileBaseIdleActionHours({ className: "Banished" }, false)).toBe(8);
    });
  });

  describe("Gate 2: Dungeon Action Limit & Housing Compounding", () => {
    const mockDungeon = {
      name: "The Sunken Vault",
      location: { name: "Bluebell Hollow" },
      length: 1800,
    };

    it("adds housing dungeon hours on top of base idle hours for matching location", () => {
      const mockProfile = {
        name: "DungeonCrawler",
        kind: "main" as const,
        className: "Warrior",
        housing: {
          foundationBuilt: true,
          mode: "owner" as const,
          location: "Bluebell Hollow",
          remoteConduit: false,
          selectedComponents: ["adventurer-s-lodge-v"],
          extraSlots: 1,
        },
      } as unknown as CharacterProfile;

      // 8h main base + 4h lodge = 12h
      expect(getProfileIdleActionHoursForDungeon(mockProfile, mockDungeon, false)).toBe(12);
    });

    it("scales free vs member alt capacity with housing bonuses", () => {
      const mockAltProfile = {
        name: "AltMiner",
        kind: "alt" as const,
        className: "Miner",
        housing: {
          foundationBuilt: true,
          mode: "owner" as const,
          location: "Bluebell Hollow",
          remoteConduit: false,
          selectedComponents: ["adventurer-s-lodge-ii"],
          extraSlots: 1,
        },
      } as unknown as CharacterProfile;

      // Free: 4h alt base + 1h lodge = 5h
      expect(getProfileIdleActionHoursForDungeon(mockAltProfile, mockDungeon, false)).toBe(5);

      // Member: 6h alt base + 1h lodge = 7h
      expect(getProfileIdleActionHoursForDungeon(mockAltProfile, mockDungeon, true)).toBe(7);
    });

    it("does not apply housing bonus if character location does not match and no remote conduit", () => {
      const mockDungeonElsewhere = {
        name: "Obsidian Crypt",
        location: { name: "Blackwood Marsh" },
        length: 2400,
      };

      const mockAltProfile = {
        name: "AltMiner",
        kind: "alt" as const,
        className: "Miner",
        housing: {
          foundationBuilt: true,
          mode: "owner" as const,
          location: "Bluebell Hollow",
          remoteConduit: false,
          selectedComponents: ["adventurer-s-lodge-ii"],
          extraSlots: 1,
        },
      } as unknown as CharacterProfile;

      // Location mismatch, no remote conduit: returns just base 6h (member)
      expect(getProfileIdleActionHoursForDungeon(mockAltProfile, mockDungeonElsewhere, true)).toBe(6);
    });
  });

  describe("Gate 3: Class Metadata & Guest Housing Restrictions", () => {
    it("identifies Banished and Cursed as blocked from being housing guests", () => {
      expect(HOUSING_GUEST_BLOCKED_CLASSES).toContain("Banished");
      expect(HOUSING_GUEST_BLOCKED_CLASSES).toContain("Cursed");
      expect(canUseHousingGuestAccess("Banished")).toBe(false);
      expect(canUseHousingGuestAccess("Cursed")).toBe(false);
      expect(canUseHousingGuestAccess("Forsaken")).toBe(true);
      expect(canUseHousingGuestAccess("Warrior")).toBe(true);
      expect(canUseHousingGuestAccess("Smelter")).toBe(true);
    });

    it("documents 8h idle time and guest restrictions in CLASS_DATA notes", () => {
      const banished = getClassInfo("Banished");
      expect(banished.notes.some((note) => note.includes("8-hour idle time"))).toBe(true);
      expect(banished.notes.some((note) => note.includes("3-character active idle limit"))).toBe(true);
      expect(banished.notes.some((note) => note.includes("house guest"))).toBe(true);

      const cursed = getClassInfo("Cursed");
      expect(cursed.notes.some((note) => note.includes("8-hour idle time"))).toBe(true);
      expect(cursed.notes.some((note) => note.includes("3-character active idle limit"))).toBe(true);
      expect(cursed.notes.some((note) => note.includes("house guest"))).toBe(true);

      const forsaken = getClassInfo("Forsaken");
      expect(forsaken.notes.some((note) => note.includes("Standard alt idle hours"))).toBe(true);
      expect(forsaken.notes.some((note) => note.includes("house guest"))).toBe(true);
    });
  });
});
