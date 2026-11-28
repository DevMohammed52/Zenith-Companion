"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePreferences } from "@/lib/preferences";
import { isStarterProfile, useProfiles } from "@/lib/profiles";
import { useData } from "@/context/DataContext";
import { getSafeMarketPrice } from "@/lib/market-pricing";
import {
  barteringBuffPercent,
  dailyStreakMagicFind,
  getProfileConquestRank,
} from "@/lib/profile-calculations";
import type { UseSettingsStateReturn } from "../types";

export function useSettingsState(): UseSettingsStateReturn {
  const { preferences, setPreferences } = usePreferences();
  const { activeProfile } = useProfiles();
  const needsProfileSetup = !activeProfile || isStarterProfile(activeProfile);
  const { allItemsDb, marketData, staticData } = useData();

  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState<number | "">("");
  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const confirmCancelRef = useRef<HTMLButtonElement | null>(null);
  const confirmModalRef = useRef<HTMLDivElement | null>(null);
  const itemSuggestionsId = "settings-custom-price-suggestions";

  const itemNames = useMemo(
    () => Object.keys(allItemsDb || {}).sort((a, b) => a.localeCompare(b)),
    [allItemsDb],
  );

  const itemSuggestions = useMemo(() => {
    const query = customItemName.trim().toLowerCase();
    if (!query) return itemNames.slice(0, 8);
    return itemNames.filter((name) => name.toLowerCase().includes(query)).slice(0, 8);
  }, [customItemName, itemNames]);

  const customPriceRows = useMemo(
    () =>
      Object.entries(preferences.customPrices || {}).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    [preferences.customPrices],
  );

  const marketMeta = marketData?._meta;

  const suspiciousCustomRows = customPriceRows.filter(([name, price]) => {
    const safe = getSafeMarketPrice(marketData?.[name]);
    return safe.value > 0 && Number(price) > safe.value * 5;
  });

  const profileBarteringPercent = barteringBuffPercent(
    activeProfile?.boosts.barteringLevel ?? 0,
  );
  const profileDailyBonus = dailyStreakMagicFind(
    activeProfile?.magicFind.dailyStreak ?? 0,
  );
  const profileConquest = getProfileConquestRank(activeProfile);
  const worldBossCount =
    staticData?.world_bosses?.length || staticData?.worldBosses?.length || 0;
  const entityCount =
    (staticData?.enemies?.length || 0) +
    (staticData?.dungeons?.length || 0) +
    worldBossCount;
  const marketItemCount = Object.keys(marketData || {}).filter(
    (key) => key !== "_meta",
  ).length;
  const itemCount = Object.keys(allItemsDb || {}).length;
  const profileLabel = activeProfile
    ? `${activeProfile.kind === "main" ? "Main" : "Alt"} - ${activeProfile.className || "Other"}`
    : "No active profile";

  const saveCustomPrice = () => {
    const name = customItemName.trim();
    const price = Number(customItemPrice);
    if (!name || !Number.isFinite(price) || price <= 0) return;
    setPreferences({
      customPrices: {
        ...preferences.customPrices,
        [name]: Math.round(price),
      },
    });
    setCustomItemName("");
    setCustomItemPrice("");
    setItemSearchOpen(false);
  };

  const removeCustomPrice = (name: string) => {
    const next = { ...preferences.customPrices };
    delete next[name];
    setPreferences({ customPrices: next });
  };

  const closeItemSearch = () => {
    setItemSearchOpen(false);
    setActiveSuggestionIndex(-1);
  };

  const selectCustomItem = (name: string) => {
    setCustomItemName(name);
    closeItemSearch();
  };

  const handleCustomItemKeyDown = (
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Escape" && itemSearchOpen) {
      event.preventDefault();
      closeItemSearch();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setItemSearchOpen(true);
      if (itemSuggestions.length === 0) {
        setActiveSuggestionIndex(-1);
        return;
      }
      setActiveSuggestionIndex((current) => {
        if (current < 0)
          return event.key === "ArrowDown" ? 0 : itemSuggestions.length - 1;
        const direction = event.key === "ArrowDown" ? 1 : -1;
        return (
          (current + direction + itemSuggestions.length) %
          itemSuggestions.length
        );
      });
      return;
    }

    if (event.key === "Enter" && itemSearchOpen && activeSuggestionIndex >= 0) {
      const selectedName = itemSuggestions[activeSuggestionIndex];
      if (!selectedName) return;
      event.preventDefault();
      selectCustomItem(selectedName);
    }
  };

  useEffect(() => {
    if (!itemSearchOpen || itemSuggestions.length === 0) {
      setActiveSuggestionIndex(-1);
      return;
    }
    setActiveSuggestionIndex((current) =>
      current >= 0 && current < itemSuggestions.length ? current : 0,
    );
  }, [itemSearchOpen, itemSuggestions.length]);

  useEffect(() => {
    if (!confirmClearOpen) return;
    window.requestAnimationFrame(() => confirmCancelRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setConfirmClearOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        confirmModalRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!confirmModalRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmClearOpen]);

  const clearCustomPrices = () => {
    if (customPriceRows.length === 0) return;
    setConfirmClearOpen(true);
  };

  const confirmClearCustomPrices = () => {
    setPreferences({ customPrices: {} });
    setConfirmClearOpen(false);
  };

  return {
    preferences,
    setPreferences,
    activeProfile,
    needsProfileSetup,
    allItemsDb,
    marketData,
    staticData,
    customItemName,
    setCustomItemName,
    customItemPrice,
    setCustomItemPrice,
    itemSearchOpen,
    setItemSearchOpen,
    activeSuggestionIndex,
    setActiveSuggestionIndex,
    itemSuggestionsId,
    itemNames,
    itemSuggestions,
    customPriceRows,
    suspiciousCustomRows,
    confirmClearOpen,
    setConfirmClearOpen,
    confirmCancelRef,
    confirmModalRef,
    marketMeta,
    profileBarteringPercent,
    profileDailyBonus,
    profileConquest,
    worldBossCount,
    entityCount,
    marketItemCount,
    itemCount,
    profileLabel,
    saveCustomPrice,
    removeCustomPrice,
    closeItemSearch,
    selectCustomItem,
    handleCustomItemKeyDown,
    clearCustomPrices,
    confirmClearCustomPrices,
  };
}
