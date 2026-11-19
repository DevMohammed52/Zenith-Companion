import type React from "react";
import type { Recipe } from "@/constants";
import type {
    CraftingQueuePlan,
    QueueNeedRow,
    QueueRecipeNeedRow,
    QueueSaleSource,
} from "@/lib/crafting-queue";

export type CraftingItemRecord = {
    image?: string;
    image_url?: string;
};

export type RecipeOption = {
    name: string;
    recipe: Recipe;
    materialNames: string[];
    searchText: string;
};

export function formatSaleSource(source: QueueSaleSource): string {
    if (source === "custom") return "CUSTOM";
    if (source === "market") return "MARKET";
    if (source === "vendor") return "VENDOR";
    return "NO SALE";
}

export function formatPriceSource(source: string): string {
    if (source === "custom") return "custom";
    if (source === "vendor") return "vendor";
    if (source === "market") return "market";
    return "missing";
}

export type UseCraftingPageStateReturn = {
    // Context & Profile
    activeProfile: any;
    marketNetPercent: number;
    profileBarteringBoost: number;

    // Queue & Plans
    queue: Record<string, number>;
    plan: CraftingQueuePlan;
    recipeTypeCount: number;
    missingItemCount: number;
    profitableEntryCount: number;
    warningEntryCount: number;
    bestEntry: CraftingQueuePlan["entries"][number] | null;
    queueReadiness: string;

    // Recipe Picker State
    adding: string;
    recipeSearch: string;
    pickerOpen: boolean;
    activeRecipeIndex: number;
    filteredRecipeOptions: RecipeOption[];
    recipeOptions: RecipeOption[];
    selectedRecipe: RecipeOption | null;
    pickerRef: React.RefObject<HTMLDivElement | null>;
    inputRef: React.RefObject<HTMLInputElement | null>;

    // Actions & Handlers
    setPickerOpen: (open: boolean) => void;
    setActiveRecipeIndex: React.Dispatch<React.SetStateAction<number>>;
    chooseRecipe: (name: string) => void;
    clearRecipePicker: () => void;
    updateRecipeSearch: (value: string) => void;
    handleRecipeKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    addRecipe: (name: string) => void;

    // Quantity & Queue editing
    qtyDrafts: Record<string, string>;
    setQtyDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    updateQuantityDraft: (name: string, value: string) => void;
    commitQuantityDraft: (name: string, fallback: number) => void;
    setQueueQty: (name: string, qty: number) => void;
    clearedQueue: Record<string, number> | null;
    handleClearQueue: () => void;
    undoClearQueue: () => void;

    // Item modal & images
    openItemByName: (name: string) => void;
    prefetchItem: (name: string) => void;
    getItemImage: (name: string) => string;
};
