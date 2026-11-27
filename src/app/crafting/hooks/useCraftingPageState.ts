"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui";
import { ALCHEMY_ITEMS, type Recipe } from "@/constants";
import { useCrafting } from "@/context/CraftingContext";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import {
  MAX_BASIC_ALCHEMY_LEVEL,
  calculateCraftingQueuePlan,
  isCraftingQueueRecipe,
  type QueueItemLookup,
  type QueueMarketData,
} from "@/lib/crafting-queue";
import { usePreferences } from "@/lib/preferences";
import { getProfileBarteringBoost } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import { isStarterProfile, useProfiles } from "@/lib/profiles";
import {
  type CartRecipeOption,
  type UseCraftingPageStateReturn,
} from "../types";
import { calculateCartTotals, formatShoppingListText } from "../utils/cart-math";

const CHECKED_NEEDS_STORAGE_KEY = "zenith_crafting_checked_needs_v1";

function readCheckedNeeds(key: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const clean: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v === true) clean[k] = true;
    }
    return clean;
  } catch {
    return {};
  }
}

export function useCraftingPageState(): UseCraftingPageStateReturn {
  const { queue, addToQueue, setQueueQty, replaceQueue, clearQueue } = useCrafting();
  const { marketData, allItemsDb, loading, refresh } = useData();
  const { preferences } = usePreferences();
  const { activeProfile } = useProfiles();
  const { openItemByName, prefetchItem } = useItemModal();
  const { toast } = useToast();

  const configuredProfile = activeProfile && !isStarterProfile(activeProfile) ? activeProfile : null;
  const activeProfileId = configuredProfile?.id || null;
  const checkedStorageKey = useMemo(
    () => getProfileStorageKey(CHECKED_NEEDS_STORAGE_KEY, activeProfileId ?? undefined),
    [activeProfileId],
  );

  const [checkedNeedNames, setCheckedNeedNames] = useState<Record<string, boolean>>({});
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);

  const [recipeQuery, setRecipeQuery] = useState("");
  const [selectedRecipeName, setSelectedRecipeName] = useState("");
  const [addAmount, setAddAmount] = useState(50);
  const [undoSnapshot, setUndoSnapshot] = useState<Record<string, number> | null>(null);
  const [copiedList, setCopiedList] = useState(false);

  const undoTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setCheckedNeedNames(readCheckedNeeds(checkedStorageKey));
    setHydratedKey(checkedStorageKey);
  }, [checkedStorageKey]);

  useEffect(() => {
    if (hydratedKey !== checkedStorageKey) return;
    try {
      window.localStorage.setItem(checkedStorageKey, JSON.stringify(checkedNeedNames));
    } catch {
      // Ignore storage quota errors
    }
  }, [checkedNeedNames, checkedStorageKey, hydratedKey]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current !== null) window.clearTimeout(undoTimerRef.current);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const membershipActive = Boolean(preferences.membership);
  const taxRatePercent = membershipActive ? 12 : 15;
  const barteringBoost =
    Number(
      configuredProfile ? getProfileBarteringBoost(configuredProfile) : preferences.barteringBoost || 0,
    ) || 0;

  const marketLookup = useMemo(() => (marketData || null) as QueueMarketData | null, [marketData]);
  const itemLookup = useMemo(() => (allItemsDb || null) as QueueItemLookup | null, [allItemsDb]);

  const planPrefs = useMemo(
    () => ({
      membership: membershipActive,
      barteringBoost,
      customPrices: preferences.customPrices,
    }),
    [barteringBoost, membershipActive, preferences.customPrices],
  );

  const plan = useMemo(
    () => calculateCraftingQueuePlan(queue, marketLookup, itemLookup, planPrefs),
    [itemLookup, marketLookup, planPrefs, queue],
  );

  const totals = useMemo(
    () => calculateCartTotals(plan, checkedNeedNames),
    [checkedNeedNames, plan],
  );

  const getItemImageUrl = useCallback(
    (name: string) => allItemsDb?.[name]?.image_url,
    [allItemsDb],
  );

  const getItemQuality = useCallback(
    (name: string) => String(allItemsDb?.[name]?.quality || marketData?.[name]?.quality || "STANDARD"),
    [allItemsDb, marketData],
  );

  const recipeOptions = useMemo<CartRecipeOption[]>(() => {
    const entries = Object.entries(ALCHEMY_ITEMS) as Array<[string, Recipe]>;
    return entries
      .filter(
        ([name, recipe]) =>
          Number(recipe?.level || 0) <= MAX_BASIC_ALCHEMY_LEVEL && isCraftingQueueRecipe(name),
      )
      .map(([name, recipe]) => {
        const singlePlan = calculateCraftingQueuePlan({ [name]: 1 }, marketLookup, itemLookup, planPrefs);
        return {
          name,
          recipe,
          quality: getItemQuality(name),
          profitEach: singlePlan.entries[0]?.profitEach || 0,
        };
      })
      .sort((a, b) => a.recipe.level - b.recipe.level || a.name.localeCompare(b.name));
  }, [getItemQuality, itemLookup, marketLookup, planPrefs]);

  const starterRecipes = useMemo<CartRecipeOption[]>(() => {
    return [...recipeOptions]
      .sort((a, b) => b.profitEach - a.profitEach)
      .slice(0, 3);
  }, [recipeOptions]);

  const selectRecipe = useCallback((name: string, label?: string) => {
    setSelectedRecipeName(name);
    if (label !== undefined) {
      setRecipeQuery(label);
    }
  }, []);

  const handleAddSelected = useCallback(() => {
    const exactMatch =
      recipeOptions.find((opt) => opt.name === selectedRecipeName) ||
      recipeOptions.find((opt) => opt.name.toLowerCase() === recipeQuery.trim().toLowerCase());
    if (!exactMatch) return;
    const qty = Math.max(1, Math.floor(Number(addAmount) || 1));
    addToQueue(exactMatch.name, qty);
    setSelectedRecipeName("");
    setRecipeQuery("");
  }, [addAmount, addToQueue, recipeOptions, recipeQuery, selectedRecipeName]);

  const handleQuickAdd = useCallback(
    (name: string, quantity: number) => {
      const safeQty = Math.max(1, Math.floor(Number(quantity) || 1));
      addToQueue(name, safeQty);
    },
    [addToQueue],
  );

  const setCartQuantity = useCallback(
    (name: string, nextQty: number) => {
      const clamped = Math.max(1, Math.min(999999, Math.floor(Number(nextQty) || 1)));
      setQueueQty(name, clamped);
    },
    [setQueueQty],
  );

  const removeCartItem = useCallback(
    (name: string) => {
      setQueueQty(name, 0);
    },
    [setQueueQty],
  );

  const handleClearCart = useCallback(() => {
    if (Object.keys(queue).length === 0) return;
    setUndoSnapshot({ ...queue });
    clearQueue();
    if (undoTimerRef.current !== null) window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = window.setTimeout(() => {
      setUndoSnapshot(null);
    }, 10000);
  }, [clearQueue, queue]);

  const handleUndoClear = useCallback(() => {
    if (!undoSnapshot) return;
    replaceQueue(undoSnapshot);
    setUndoSnapshot(null);
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, [replaceQueue, undoSnapshot]);

  const toggleNeedChecked = useCallback((name: string) => {
    setCheckedNeedNames((prev) => {
      const next = { ...prev };
      if (next[name]) {
        delete next[name];
      } else {
        next[name] = true;
      }
      return next;
    });
  }, []);

  const clearCheckedNeeds = useCallback(() => {
    setCheckedNeedNames({});
  }, []);

  const copyMarketList = useCallback(async () => {
    const text = formatShoppingListText(plan, checkedNeedNames);
    if (!text) {
      toast.info("Every item in your shopping list is already checked off.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedList(true);
      toast.success("Copied shopping list to clipboard.");
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopiedList(false), 2500);
    } catch {
      toast.error("Clipboard access failed in this browser context.");
    }
  }, [checkedNeedNames, plan, toast]);

  const needsByGroup = useMemo(
    () => ({
      vials: plan.vialList,
      ingredients: plan.shoppingList,
    }),
    [plan.shoppingList, plan.vialList],
  );

  return {
    loading: Boolean(loading && !marketData),
    hasMarketError: Boolean(!loading && !marketData),
    retryMarketLoad: () => {
      void refresh();
    },
    plan,
    totals,
    taxRatePercent,
    membershipActive,
    recipeOptions,
    starterRecipes,
    selectedRecipeName,
    recipeQuery,
    setRecipeQuery,
    selectRecipe,
    addAmount,
    setAddAmount,
    handleAddSelected,
    handleQuickAdd,
    setCartQuantity,
    removeCartItem,
    undoSnapshot,
    handleClearCart,
    handleUndoClear,
    checkedNeedNames,
    toggleNeedChecked,
    clearCheckedNeeds,
    copiedList,
    copyMarketList,
    getItemImageUrl,
    getItemQuality,
    inspectItem: (name: string) => openItemByName(name),
    prefetchItem,
    needsByGroup,
  };
}
