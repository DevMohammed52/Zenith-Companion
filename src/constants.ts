import { DEFAULT_ALCHEMY_RECIPES } from "./lib/default-alchemy-recipes.mjs";

export const VIAL_COSTS: Record<string, number> = {
    "Cheap Vial": 5,
    "Cheap Crystal": 5,
    "Tarnished Vial": 10,
    "Tarnished Crystal": 10,
    "Gleaming Vial": 50,
    "Gleaming Crystal": 50,
    "Elemental Vial": 200,
    "Elemental Crystal": 200,
    "Eldritch Vial": 500,
    "Eldritch Crystal": 500,
    "Arcane Vial": 2500,
    "Arcane Crystal": 2500
};

export const VENDOR_ITEMS: Record<string, { price: string; currency: string }> = {
    "Cheap Vial": { price: "5", currency: "Gold" },
    "Cheap Crystal": { price: "5", currency: "Gold" },
    "Tarnished Vial": { price: "10", currency: "Gold" },
    "Tarnished Crystal": { price: "10", currency: "Gold" },
    "Gleaming Vial": { price: "50", currency: "Gold" },
    "Gleaming Crystal": { price: "50", currency: "Gold" },
    "Elemental Vial": { price: "200", currency: "Gold" },
    "Elemental Crystal": { price: "200", currency: "Gold" },
    "Eldritch Vial": { price: "500", currency: "Gold" },
    "Eldritch Crystal": { price: "500", currency: "Gold" },
    "Arcane Vial": { price: "2500", currency: "Gold" },
    "Arcane Crystal": { price: "2500", currency: "Gold" },
    "Cheap Bait": { price: "2", currency: "Gold" },
    "Tarnished Bait": { price: "4", currency: "Gold" },
    "Gleaming Bait": { price: "7", currency: "Gold" },
    "Elemental Bait": { price: "12", currency: "Gold" },
    "Eldritch Bait": { price: "16", currency: "Gold" },
    "Arcane Bait": { price: "25", currency: "Gold" },
    "Namestone": { price: "500", currency: "Tokens" },
    "Metamorphite": { price: "500", currency: "Tokens" },
    "Simple Fishing Rod": { price: "10", currency: "Gold" },
    "Simple Pickaxe": { price: "10", currency: "Gold" },
    "Simple Felling Axe": { price: "10", currency: "Gold" },
    "Blank Scroll": { price: "60,000", currency: "Gold" }
};

export function parseVendorGoldPrice(name: string): number {
    const vendorItem = VENDOR_ITEMS[name];
    if (vendorItem?.currency !== "Gold") return 0;
    return Number(vendorItem.price.replace(/,/g, "")) || 0;
}

export function getMerchantBuyPrice(name: string): number {
    return VIAL_COSTS[name] || parseVendorGoldPrice(name);
}

export interface Recipe {
    level: number;
    time: number;
    vial: string;
    materials: Record<string, number>;
}

export const ALCHEMY_ITEMS = DEFAULT_ALCHEMY_RECIPES as Record<string, Recipe>;
