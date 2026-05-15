const TYPE_LABEL_OVERRIDES: Record<string, string> = {
  CHEST: "Loot Chest",
  CHESTPLATE: "Chest Armor",
  PET_EGG: "Pet Egg",
  CAMPAIGN_ITEM: "Campaign Item",
  CONSTRUCTION_MATERIAL: "Construction Material",
  CRAFTING_MATERIAL: "Crafting Material",
  FELLING_AXE: "Felling Axe",
  FISHING_ROD: "Fishing Rod",
  METAL_BAR: "Metal Bar",
  UPGRADE_STONE: "Upgrade Stone",
};

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (match) => match.toUpperCase());
}

export function formatItemTypeLabel(value: string) {
  const normalized = String(value || "UNKNOWN").trim().toUpperCase();
  return TYPE_LABEL_OVERRIDES[normalized] || toTitleCase(normalized.replace(/_/g, " "));
}

export function isForcedUntradableItem(name: string) {
  const normalized = String(name || "").trim().toLowerCase();
  return normalized === "ascendent cache";
}

export function isLegacyItem({
  name,
  type,
  tradeable = true,
  usedInCount = 0,
}: {
  name: string;
  type?: string;
  tradeable?: boolean;
  usedInCount?: number;
}) {
  const normalizedName = String(name || "").trim();
  const normalizedType = String(type || "").trim().toUpperCase();
  if (!normalizedName) return false;

  if (normalizedType === "CRAFTING_MATERIAL" && /\bRemains$/i.test(normalizedName) && usedInCount <= 0) return true;
  if (normalizedType === "CHEST" && /\bAlchemy Chest$/i.test(normalizedName)) return true;
  if (
    normalizedType === "CHEST"
    && !tradeable
    && /\b(Cache|Strongbox|Lockbox|Relic Box|Chest)(?: \(Recipes?\))?$/i.test(normalizedName)
    && !/\bAscendent Cache$/i.test(normalizedName)
  ) {
    return true;
  }

  return false;
}
