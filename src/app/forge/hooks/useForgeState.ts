"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import { getMarketTaxMultiplier, usePreferences } from "@/lib/preferences";
import { useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import {
  buildForgeRecipeOptions,
  calculateForgePlanner,
  FORGE_PLANNER_STORAGE_KEY,
  sanitizeForgeOwnedMaterials,
  sanitizeForgePlannerLines,
  sanitizeForgeQuantity,
  type ForgeRecipeOption,
} from "@/lib/forge-planner";
import {
  FORGE_OWNED_STORAGE_KEY,
  FORGE_OWNED_SYNC_EVENT,
  FORGE_TABS,
  getRecipeDisplayValue,
  type ForgeQualityFilter,
  type ForgeSortBy,
  type ForgeState,
  type ForgeTab,
  type PlannerDraft,
  type QtyField,
} from "../types";

export function useForgeState(): ForgeState {
  const { allItemsDb, marketData, loading } = useData();
  const { openItemByName, prefetchItem } = useItemModal();
  const { preferences } = usePreferences();
  const { activeProfile } = useProfiles();

  const [activeTab, setActiveTabState] = useState<ForgeTab>("lessons");
  const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paramTab = params.get("tab");
    if (paramTab === "craft" || paramTab === "lessons") {
      setActiveTabState(paramTab);
    }
  }, []);

  const setActiveTab = (tab: ForgeTab) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/forge" || path === "/forge/") {
        const url = new URL(window.location.href);
        if (tab === "lessons") {
          url.searchParams.delete("tab");
        } else {
          url.searchParams.set("tab", tab);
          url.searchParams.delete("view");
        }
        window.history.replaceState(null, "", url.toString());
      }
    }
  };

  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hasLoaded, setHasLoaded] = useState(false);
  const [draft, setDraft] = useState<PlannerDraft>({ lines: [], ownedMaterials: {} });
  const [recipeSearch, setRecipeSearch] = useState("");
  const [qualityFilter, setQualityFilter] = useState<ForgeQualityFilter>("ALL");
  const [sortBy, setSortBy] = useState<ForgeSortBy>("value");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openFilterPicker, setOpenFilterPicker] = useState<"quality" | "sort" | "">("");
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);
  const [selectedRecipeName, setSelectedRecipeName] = useState("");
  const [focusedEntryKey, setFocusedEntryKey] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [clearedDraft, setClearedDraft] = useState<PlannerDraft | null>(null);

  const recipes = useMemo(() => buildForgeRecipeOptions(allItemsDb), [allItemsDb]);
  const recipesByName = useMemo(() => new Map(recipes.map((recipe) => [recipe.recipeName, recipe])), [recipes]);

  const visibleRecipeOptions = useMemo(() => {
    const q = recipeSearch.trim().toLowerCase();
    const rows = recipes.filter((recipe) => {
      if (qualityFilter !== "ALL" && recipe.quality !== qualityFilter) return false;
      return q ? recipe.searchText.includes(q) : true;
    });
    return [...rows].sort((a, b) => {
      if (sortBy === "level") return b.levelRequired - a.levelRequired || a.resultName.localeCompare(b.resultName);
      if (sortBy === "name") return a.resultName.localeCompare(b.resultName);
      if (sortBy === "materials") return b.materials.length - a.materials.length || a.resultName.localeCompare(b.resultName);
      return getRecipeDisplayValue(b) - getRecipeDisplayValue(a) || b.levelRequired - a.levelRequired || a.resultName.localeCompare(b.resultName);
    });
  }, [qualityFilter, recipeSearch, recipes, sortBy]);

  const selectedRecipe = selectedRecipeName ? recipesByName.get(selectedRecipeName) || null : null;
  const profileBarteringBoost = activeProfile ? getProfileBarteringBoost(activeProfile) : Number(preferences.barteringBoost || 0);

  const plan = useMemo(
    () => calculateForgePlanner(
      draft.lines,
      draft.ownedMaterials,
      recipes,
      marketData,
      allItemsDb,
      {
        customPrices: preferences.customPrices,
        membership: preferences.membership,
        barteringBoost: profileBarteringBoost,
      },
    ),
    [allItemsDb, draft.lines, draft.ownedMaterials, marketData, preferences.customPrices, preferences.membership, profileBarteringBoost, recipes],
  );

  // Load profile-specific planner draft when activeProfile switches
  useEffect(() => {
    const profileId = activeProfile?.id;
    try {
      const profilePlannerKey = getProfileStorageKey(FORGE_PLANNER_STORAGE_KEY, profileId);
      const profileOwnedKey = getProfileStorageKey(FORGE_OWNED_STORAGE_KEY, profileId);
      let stored = localStorage.getItem(profilePlannerKey);
      let storedOwned = localStorage.getItem(profileOwnedKey);
      if (!stored) {
        // Fallback to legacy global key on first load
        stored = localStorage.getItem(FORGE_PLANNER_STORAGE_KEY);
      }
      if (!storedOwned) {
        storedOwned = localStorage.getItem(FORGE_OWNED_STORAGE_KEY);
      }
      const parsed = stored ? (JSON.parse(stored) as Partial<PlannerDraft>) : null;
      const owned = storedOwned ? JSON.parse(storedOwned) : parsed?.ownedMaterials;
      setDraft({
        lines: sanitizeForgePlannerLines(parsed?.lines),
        ownedMaterials: sanitizeForgeOwnedMaterials(owned),
      });
    } catch {
      setDraft({ lines: [], ownedMaterials: {} });
    } finally {
      setHasLoaded(true);
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const profileId = activeProfile?.id;
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<
        | { profileId?: string | null; materials: Record<string, number> }
        | Record<string, number>
      >;
      if (!customEvent.detail) return;
      const detail = customEvent.detail;
      const incomingProfileId =
        typeof detail === "object" && detail !== null && "profileId" in detail
          ? (detail as any).profileId
          : undefined;

      let materials: Record<string, number> = {};
      if (typeof detail === "object" && detail !== null) {
        if ("materials" in detail && typeof (detail as any).materials === "object" && (detail as any).materials !== null) {
          materials = (detail as any).materials;
        } else {
          materials = detail as Record<string, number>;
        }
      }

      // Ignore sync events belonging to a different profile
      if (incomingProfileId !== undefined && incomingProfileId !== (profileId || null)) {
        return;
      }

      const sanitized = sanitizeForgeOwnedMaterials(materials);
      setDraft((current) => {
        const prevKeys = Object.keys(current.ownedMaterials);
        const nextKeys = Object.keys(sanitized);
        if (
          prevKeys.length === nextKeys.length &&
          prevKeys.every((k) => current.ownedMaterials[k] === sanitized[k])
        ) {
          return current;
        }
        return {
          ...current,
          ownedMaterials: sanitized,
        };
      });
    };
    window.addEventListener(FORGE_OWNED_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(FORGE_OWNED_SYNC_EVENT, handleSync);
  }, [activeProfile?.id]);

  useEffect(() => {
    if (!hasLoaded) return;
    try {
      const profilePlannerKey = getProfileStorageKey(FORGE_PLANNER_STORAGE_KEY, activeProfile?.id);
      localStorage.setItem(profilePlannerKey, JSON.stringify({
        lines: sanitizeForgePlannerLines(draft.lines),
        ownedMaterials: sanitizeForgeOwnedMaterials(draft.ownedMaterials),
      }));
    } catch {
      // Storage quota exceeded or disabled in private browsing
    }
  }, [draft, hasLoaded, activeProfile?.id]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPickerOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    setActiveOptionIndex(0);
  }, [qualityFilter, recipeSearch, sortBy]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!openFilterPicker) return undefined;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenFilterPicker("");
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!(event.target as Element | null)?.closest(".filter-picker")) {
        setOpenFilterPicker("");
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("pointerdown", closeOnOutsidePointer, true);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("pointerdown", closeOnOutsidePointer, true);
    };
  }, [openFilterPicker]);

  const chooseRecipe = (recipe: ForgeRecipeOption) => {
    setSelectedRecipeName(recipe.recipeName);
    setRecipeSearch(recipe.resultName);
    setPickerOpen(false);
  };

  const addRecipe = (recipeName = selectedRecipeName) => {
    const recipe = recipesByName.get(recipeName);
    if (!recipe) return;
    const wasEmpty = draft.lines.length === 0;
    setDraft((current) => {
      const index = current.lines.findIndex((line) => line.recipeName === recipe.recipeName);
      if (index >= 0) {
        const next = [...current.lines];
        next[index] = { ...next[index], quantity: Math.min(999_999, Number(next[index].quantity || 0) + 1) };
        return { ...current, lines: next };
      }
      return {
        ...current,
        lines: [...current.lines, { recipeName: recipe.recipeName, quantity: 1, ownedRecipes: 1 }],
      };
    });
    setFocusedEntryKey(recipe.recipeName);
    setSelectedRecipeName("");
    setRecipeSearch("");
    setClearedDraft(null);
    setStatusMessage(`Added ${recipe.resultName} to the forge plan.`);
    if (wasEmpty && typeof window !== "undefined") {
      window.setTimeout(() => {
        document.getElementById("forge-plan")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      }, 80);
    }
  };

  const updateLine = (recipeName: string, field: QtyField, value: string) => {
    const clean = sanitizeForgeQuantity(value);
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => line.recipeName === recipeName
        ? { ...line, [field]: clean === "" ? "" : Number(clean || 0) }
        : line),
    }));
  };

  const removeLine = (recipeName: string) => {
    const recipe = recipesByName.get(recipeName);
    setDraft((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.recipeName !== recipeName),
    }));
    if (focusedEntryKey === recipeName) setFocusedEntryKey("");
    setStatusMessage(`Removed ${recipe?.resultName || recipeName} from the forge plan.`);
  };

  const setOwnedMaterial = (name: string, value: string) => {
    const clean = sanitizeForgeQuantity(value);
    const profileId = activeProfile?.id;
    let nextOwned: Record<string, number> | null = null;
    setDraft((current) => {
      const next = { ...current.ownedMaterials };
      if (clean === "" || Number(clean || 0) <= 0) delete next[name];
      else next[name] = Number(clean);
      nextOwned = next;
      try {
        const profileOwnedKey = getProfileStorageKey(FORGE_OWNED_STORAGE_KEY, profileId);
        localStorage.setItem(profileOwnedKey, JSON.stringify(next));
      } catch {
        // storage guard
      }
      return { ...current, ownedMaterials: next };
    });

    if (typeof window !== "undefined" && nextOwned) {
      const payload = { profileId: profileId || null, materials: nextOwned };
      queueMicrotask(() => {
        window.dispatchEvent(new CustomEvent(FORGE_OWNED_SYNC_EVENT, { detail: payload }));
      });
    }
  };

  const clearPlan = () => {
    const previousDraft = {
      lines: sanitizeForgePlannerLines(draft.lines),
      ownedMaterials: sanitizeForgeOwnedMaterials(draft.ownedMaterials),
    };
    if (previousDraft.lines.length === 0) return;
    setDraft((prev) => ({ ...prev, lines: [] }));
    setFocusedEntryKey("");
    setClearedDraft(previousDraft);
    setStatusMessage("Forge plan cleared.");
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setClearedDraft(null), 9000);
  };

  const undoClearPlan = () => {
    if (!clearedDraft) return;
    setDraft((prev) => ({ ...prev, lines: clearedDraft.lines }));
    setFocusedEntryKey(clearedDraft.lines[0]?.recipeName || "");
    setStatusMessage("Forge plan restored.");
    setClearedDraft(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  const handlePickerKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const maxVisibleIndex = Math.max(0, Math.min(visibleRecipeOptions.length, 80) - 1);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setPickerOpen(true);
      setActiveOptionIndex((index) => Math.min(index + 1, maxVisibleIndex));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setPickerOpen(true);
      setActiveOptionIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const active = pickerOpen ? visibleRecipeOptions[activeOptionIndex] : selectedRecipe;
      if (active) {
        chooseRecipe(active);
        addRecipe(active.recipeName);
      }
      return;
    }
    if (event.key === "Escape") setPickerOpen(false);
  };

  const updateRecipeSearch = (value: string) => {
    setRecipeSearch(value);
    setPickerOpen(true);
    setOpenFilterPicker("");
    const exact = recipes.find((recipe) => (
      recipe.recipeName.toLowerCase() === value.trim().toLowerCase()
      || recipe.resultName.toLowerCase() === value.trim().toLowerCase()
    ));
    setSelectedRecipeName(exact?.recipeName || "");
  };

  const handleTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextIndex = (index + 1) % FORGE_TABS.length;
      const nextTab = FORGE_TABS[nextIndex].id;
      setActiveTab(nextTab);
      tabButtonRefs.current?.[nextTab]?.focus();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const prevIndex = (index - 1 + FORGE_TABS.length) % FORGE_TABS.length;
      const prevTab = FORGE_TABS[prevIndex].id;
      setActiveTab(prevTab);
      tabButtonRefs.current?.[prevTab]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      const firstTab = FORGE_TABS[0].id;
      setActiveTab(firstTab);
      tabButtonRefs.current?.[firstTab]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      const lastTab = FORGE_TABS[FORGE_TABS.length - 1].id;
      setActiveTab(lastTab);
      tabButtonRefs.current?.[lastTab]?.focus();
    }
  };

  const selectedEntry = focusedEntryKey
    ? plan.entries.find((entry) => entry.recipe.recipeName === focusedEntryKey) || plan.entries[0] || null
    : plan.entries[0] || null;
  const activeProfileName = activeProfile?.name?.trim() || "Global settings";
  const marketNetPercent = Math.round(getMarketTaxMultiplier(preferences.membership) * 100);
  const warningCount = plan.warnings.length;
  const planHealthLabel = plan.entries.length === 0
    ? `${visibleRecipeOptions.length.toLocaleString()} recipes visible`
    : warningCount > 0
      ? `${warningCount.toLocaleString()} review ${warningCount === 1 ? "flag" : "flags"}`
      : plan.missingMaterialTypes > 0
        ? `${plan.missingMaterialTypes.toLocaleString()} material ${plan.missingMaterialTypes === 1 ? "gap" : "gaps"}`
        : "Ready to forge";

  return {
    activeTab,
    setActiveTab,
    tabButtonRefs,
    handleTabKeyDown,

    pickerRef,
    inputRef,

    draft,
    setDraft,
    recipeSearch,
    setRecipeSearch,
    updateRecipeSearch,
    qualityFilter,
    setQualityFilter,
    sortBy,
    setSortBy,
    pickerOpen,
    setPickerOpen,
    openFilterPicker,
    setOpenFilterPicker,
    activeOptionIndex,
    setActiveOptionIndex,
    selectedRecipeName,
    setSelectedRecipeName,
    focusedEntryKey,
    setFocusedEntryKey,
    statusMessage,
    setStatusMessage,
    clearedDraft,

    recipes,
    recipesByName,
    visibleRecipeOptions,
    selectedRecipe,
    selectedEntry,
    profileBarteringBoost,
    plan,

    activeProfile,
    activeProfileName,
    marketNetPercent,
    warningCount,
    planHealthLabel,
    loading,

    chooseRecipe,
    addRecipe,
    updateLine,
    removeLine,
    setOwnedMaterial,
    clearPlan,
    undoClearPlan,
    handlePickerKeyDown,
    openItemByName,
    prefetchItem,
  };
}
