import { describe, expect, it } from "vitest";
import {
  createDefaultProfile,
  getProfileSkillLevel,
  type CharacterProfile,
} from "@/lib/profiles";

describe("getProfileSkillLevel Contracts", () => {
  const mockProfile: CharacterProfile = {
    ...createDefaultProfile("Test Character"),
    skills: {
      alchemy: { level: 50, experience: 100_000 },
      cooking: { level: 85, experience: 2_500_000 },
      woodcutting: { level: 105, experience: 20_000_000 }, // ascended
      fishing: { level: 1, experience: 0 },
      mining: { level: 75, experience: 1_200_000 },
      smelting: { level: "", experience: "" },
      "hunting-mastery": { level: 60, experience: 800_000 },
      guild_mastery: { level: 89, experience: 5_000_000 },
    },
  };

  it("extracts numeric level regardless of case", () => {
    expect(getProfileSkillLevel(mockProfile, "Alchemy")).toBe(50);
    expect(getProfileSkillLevel(mockProfile, "alchemy")).toBe(50);
    expect(getProfileSkillLevel(mockProfile, "ALCHEMY")).toBe(50);
    expect(getProfileSkillLevel(mockProfile, "Cooking")).toBe(85);
    expect(getProfileSkillLevel(mockProfile, "Mining")).toBe(75);
  });

  it("handles ascended levels above 100 correctly", () => {
    expect(getProfileSkillLevel(mockProfile, "Woodcutting")).toBe(105);
  });

  it("handles level 1 correctly", () => {
    expect(getProfileSkillLevel(mockProfile, "Fishing")).toBe(1);
  });

  it("handles hyphenated and underscored keys seamlessly", () => {
    expect(getProfileSkillLevel(mockProfile, "Hunting Mastery")).toBe(60);
    expect(getProfileSkillLevel(mockProfile, "hunting-mastery")).toBe(60);
    expect(getProfileSkillLevel(mockProfile, "hunting_mastery")).toBe(60);
    expect(getProfileSkillLevel(mockProfile, "Guild Mastery")).toBe(89);
    expect(getProfileSkillLevel(mockProfile, "guild-mastery")).toBe(89);
  });

  it("returns null for empty string or invalid level entries", () => {
    expect(getProfileSkillLevel(mockProfile, "Smelting")).toBeNull();
  });

  it("returns null for skills not present in the profile", () => {
    expect(getProfileSkillLevel(mockProfile, "Forge")).toBeNull();
    expect(getProfileSkillLevel(mockProfile, "Construction")).toBeNull();
    expect(getProfileSkillLevel(mockProfile, "NonexistentSkill")).toBeNull();
  });

  it("returns null when profile is null or undefined", () => {
    expect(getProfileSkillLevel(null, "Alchemy")).toBeNull();
    expect(getProfileSkillLevel(undefined, "Alchemy")).toBeNull();
  });

  it("returns null when skillName is empty or whitespace", () => {
    expect(getProfileSkillLevel(mockProfile, "")).toBeNull();
    expect(getProfileSkillLevel(mockProfile, "   ")).toBeNull();
  });

  it("returns null on a fresh default profile with empty skills", () => {
    const freshProfile = createDefaultProfile("Starter");
    expect(getProfileSkillLevel(freshProfile, "Alchemy")).toBeNull();
  });
});
