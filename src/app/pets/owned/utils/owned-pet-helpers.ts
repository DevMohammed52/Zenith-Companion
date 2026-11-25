import type { CharacterProfile, ProfileOwnedPet, ProfilePetStats } from "@/lib/profiles";
import { QUALITY_COLORS, getTotalPower, type Quality, type StatKey } from "@/lib/pets";
import { FRIENDLY_SECTION_LABELS, PET_STAT_LABELS } from "../types";

export function makeOwnedPetId() {
  return `owned_pet_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function activePetToOwnedPet(profile: CharacterProfile): ProfileOwnedPet | null {
  if (!profile.pet.species.trim()) return null;
  return {
    id: makeOwnedPetId(),
    species: profile.pet.species.trim(),
    nickname: "",
    quality: profile.pet.quality || "",
    level: profile.pet.level || 1,
    experience: "",
    totalExperience: "",
    evolution: profile.pet.evolution || 0,
    evolutionTargets: [],
    active: true,
    equipped: true,
    source: "manual",
    stats: { ...profile.pet.stats },
    notes: profile.pet.notes || "",
  };
}

export function petKey(pet: Pick<ProfileOwnedPet, "species" | "level" | "evolution">) {
  return `${pet.species.toLowerCase()}::${pet.level || ""}::${pet.evolution || ""}`;
}

export function ownedPetToComparisonStats(stats: ProfilePetStats): Partial<Record<StatKey, number>> {
  const num = (val: number | "") => (val === "" ? 0 : Number(val) || 0);
  return {
    agility: num(stats.agility),
    accuracy: num(stats.accuracy),
    protection: num(stats.protection),
    attack_power: num(stats.attackPower),
    movement_speed: num(stats.movementSpeed),
    max_health: num(stats.maxHealth),
    max_stamina: num(stats.maxStamina),
    critical_damage: num(stats.criticalDamage),
    critical_chance: num(stats.criticalChance),
  };
}

export function getOwnedPetPower(stats: ProfilePetStats) {
  return getTotalPower(ownedPetToComparisonStats(stats));
}

export function formatValue(value: number | "") {
  if (value === "") return "-";
  return Number(value).toLocaleString();
}

export function formatOptionalNumber(value: number | "" | undefined) {
  if (value === "" || typeof value === "undefined") return "None";
  return Number(value).toLocaleString();
}

export function formatDateTime(value?: string) {
  if (!value) return "Not imported";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatOptionalDateTime(value?: string) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatSourceMode(value?: string) {
  if (value === "imported") return "Imported";
  if (value === "mixed") return "Mixed";
  return "Manual";
}

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function formatSectionLabel(value: string) {
  const normalized = normalizeText(value).replace(/[\s-]+/g, "_");
  if (FRIENDLY_SECTION_LABELS[normalized]) return FRIENDLY_SECTION_LABELS[normalized];
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatSectionList(values?: string[]) {
  if (!values?.length) return "None";
  const labels = values.map(formatSectionLabel);
  if (labels.length <= 3) return labels.join(", ");
  return `${labels.slice(0, 3).join(", ")} +${labels.length - 3}`;
}

export function missingStatCount(stats: ProfilePetStats) {
  return PET_STAT_LABELS.filter(([key]) => stats[key] === "").length;
}

export function getQualityColor(quality?: string) {
  const normalized = String(quality || "UNKNOWN").trim().toUpperCase() as Quality;
  return QUALITY_COLORS[normalized] || QUALITY_COLORS.UNKNOWN;
}
