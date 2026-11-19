"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ALCHEMY_ITEMS } from "@/constants";
import { useItemModal } from "@/context/ItemModalContext";
import { useCrafting } from "@/context/CraftingContext";
import { getMarketTaxMultiplier, usePreferences } from "@/lib/preferences";
import { useData } from "@/context/DataContext";
import { useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost } from "@/lib/profile-calculations";
import {
    calculateCraftingQueuePlan,
    isCraftingQueueRecipe,
} from "@/lib/crafting-queue";
import type {
    CraftingItemRecord,
    RecipeOption,
    UseCraftingPageStateReturn,
} from "../types";

export function useCraftingPageState(): UseCraftingPageStateReturn {
    const { openItemByName, prefetchItem } = useItemModal();
    const { queue, setQueueQty, addToQueue, clearQueue } = useCrafting();
    const { preferences } = usePreferences();
    const { activeProfile } = useProfiles();
    const { marketData, allItemsDb } = useData();

    const [adding, setAdding] = useState("");
    const [recipeSearch, setRecipeSearch] = useState("");
    const deferredRecipeSearch = useDeferredValue(recipeSearch);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
    const [qtyDrafts, setQtyDrafts] = useState<Record<string, string>>({});
    const [clearedQueue, setClearedQueue] = useState<Record<string, number> | null>(null);

    const pickerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const recipeOptions = useMemo(
        () => Object.entries(ALCHEMY_ITEMS)
            .filter(([name]) => isCraftingQueueRecipe(name))
            .map(([name, recipe]): RecipeOption => {
                const materialNames = Object.keys(recipe.materials);
                return {
                    name,
                    recipe,
                    materialNames,
                    searchText: `${name} ${recipe.vial} ${materialNames.join(" ")} lvl ${recipe.level}`.toLowerCase(),
                };
            })
            .sort((a, b) => a.recipe.level - b.recipe.level || a.name.localeCompare(b.name)),
        [],
    );

    const filteredRecipeOptions = useMemo(() => {
        const q = deferredRecipeSearch.trim().toLowerCase();
        const matches = q
            ? recipeOptions.filter((option) => option.searchText.includes(q))
            : recipeOptions;
        return matches;
    }, [deferredRecipeSearch, recipeOptions]);

    const selectedRecipe = useMemo(
        () => recipeOptions.find((option) => option.name === adding) || null,
        [adding, recipeOptions],
    );
    const profileBarteringBoost = activeProfile ? getProfileBarteringBoost(activeProfile) : 0;

    const plan = useMemo(
        () => calculateCraftingQueuePlan(queue, marketData, allItemsDb, {
            ...preferences,
            barteringBoost: profileBarteringBoost,
        }),
        [allItemsDb, marketData, preferences, profileBarteringBoost, queue],
    );

    const recipeTypeCount = plan.entries.length;
    const missingItemCount = plan.missingItems.length;
    const profitableEntryCount = plan.entries.filter((entry) => entry.totalProfit >= 0).length;
    const warningEntryCount = plan.entries.filter((entry) => entry.warnings.length > 0).length;
    const bestEntry = plan.entries.length > 0
        ? plan.entries.reduce((best, entry) => (entry.totalProfit > best.totalProfit ? entry : best), plan.entries[0])
        : null;
    const marketNetPercent = Math.round(getMarketTaxMultiplier(preferences.membership) * 100);
    const queueReadiness = missingItemCount > 0
        ? `${missingItemCount.toLocaleString()} price gap${missingItemCount === 1 ? "" : "s"}`
        : plan.entries.length > 0
            ? "Prices ready"
            : "Waiting for recipes";

    const itemImages = useMemo(() => (allItemsDb || {}) as Record<string, CraftingItemRecord>, [allItemsDb]);
    const getItemImage = (name: string) => itemImages[name]?.image_url || itemImages[name]?.image || "";

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!pickerRef.current?.contains(event.target as Node)) {
                setPickerOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    useEffect(() => {
        setActiveRecipeIndex(0);
    }, [deferredRecipeSearch]);

    useEffect(() => {
        return () => {
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        };
    }, []);

    const chooseRecipe = (name: string) => {
        if (!isCraftingQueueRecipe(name)) return;
        setAdding(name);
        setRecipeSearch(name);
        setPickerOpen(false);
    };

    const clearRecipePicker = () => {
        setAdding("");
        setRecipeSearch("");
        setPickerOpen(true);
        inputRef.current?.focus();
    };

    const updateRecipeSearch = (value: string) => {
        setRecipeSearch(value);
        setPickerOpen(true);
        const exact = recipeOptions.find((option) => option.name.toLowerCase() === value.trim().toLowerCase());
        setAdding(exact?.name || "");
    };

    const handleRecipeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setPickerOpen(true);
            setActiveRecipeIndex((index) => Math.min(index + 1, Math.max(filteredRecipeOptions.length - 1, 0)));
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setPickerOpen(true);
            setActiveRecipeIndex((index) => Math.max(index - 1, 0));
            return;
        }

        if (event.key === "Home") {
            event.preventDefault();
            setPickerOpen(true);
            setActiveRecipeIndex(0);
            return;
        }

        if (event.key === "End") {
            event.preventDefault();
            setPickerOpen(true);
            setActiveRecipeIndex(Math.max(filteredRecipeOptions.length - 1, 0));
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            const activeOption = filteredRecipeOptions[activeRecipeIndex];
            if (pickerOpen && activeOption && activeOption.name !== adding) {
                chooseRecipe(activeOption.name);
                return;
            }
            if (adding) {
                addRecipe(adding);
                return;
            }
            if (filteredRecipeOptions.length === 1) {
                addRecipe(filteredRecipeOptions[0].name);
            }
            return;
        }

        if (event.key === "Escape") {
            setPickerOpen(false);
        }
    };

    const addRecipe = (name: string) => {
        if (!name || !isCraftingQueueRecipe(name)) return;
        addToQueue(name);
        setAdding("");
        setRecipeSearch("");
        setPickerOpen(false);
        setClearedQueue(null);
    };

    const updateQuantityDraft = (name: string, value: string) => {
        if (!/^\d*$/.test(value)) return;
        setQtyDrafts((current) => ({ ...current, [name]: value }));
    };

    const commitQuantityDraft = (name: string, fallback: number) => {
        const draft = qtyDrafts[name];
        setQtyDrafts((current) => {
            const next = { ...current };
            delete next[name];
            return next;
        });
        if (draft === undefined || draft.trim() === "") return;
        const parsed = Number(draft);
        setQueueQty(name, Number.isFinite(parsed) ? parsed : fallback);
    };

    const handleClearQueue = () => {
        const previousQueue = { ...queue };
        if (Object.keys(previousQueue).length === 0) return;
        clearQueue();
        setQtyDrafts({});
        setClearedQueue(previousQueue);
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = setTimeout(() => setClearedQueue(null), 9000);
    };

    const undoClearQueue = () => {
        if (!clearedQueue) return;
        clearQueue();
        Object.entries(clearedQueue).forEach(([name, qty]) => addToQueue(name, qty));
        setClearedQueue(null);
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };

    return {
        activeProfile,
        marketNetPercent,
        profileBarteringBoost,
        queue,
        plan,
        recipeTypeCount,
        missingItemCount,
        profitableEntryCount,
        warningEntryCount,
        bestEntry,
        queueReadiness,
        adding,
        recipeSearch,
        pickerOpen,
        activeRecipeIndex,
        filteredRecipeOptions,
        recipeOptions,
        selectedRecipe,
        pickerRef,
        inputRef,
        setPickerOpen,
        setActiveRecipeIndex,
        chooseRecipe,
        clearRecipePicker,
        updateRecipeSearch,
        handleRecipeKeyDown,
        addRecipe,
        qtyDrafts,
        setQtyDrafts,
        updateQuantityDraft,
        commitQuantityDraft,
        setQueueQty,
        clearedQueue,
        handleClearQueue,
        undoClearQueue,
        openItemByName,
        prefetchItem,
        getItemImage,
    };
}
