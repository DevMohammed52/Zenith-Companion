"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  getCachedLoreDataset,
  loadLoreData,
  type LoreDataset,
  type LoreEntry,
  type LoreItemLink,
  type LoreRelation,
  type LoreTheory,
  type LoreTimelineEvent,
} from "@/data/lore";
import {
  isLoreView,
  normalizeLoreText,
  cleanLoreCopy,
  type LoreView,
  type LoreFilter,
  type RelationFilter,
  VIEW_OPTIONS,
  CATEGORY_META,
  FEATURED_ATLAS_IDS,
  NPC_NETWORK_HUB_IDS,
} from "../types";

export interface NpcNetworkGroup {
  id: string;
  title: string;
  category: string;
  tone: string;
  detail: string;
  characters: LoreEntry[];
}

export function useLoreState() {
  const searchParams = useSearchParams();
  const searchParamKey = searchParams.toString();
  const initialViewParam = searchParams.get("view");
  const initialThreadParam = searchParams.get("thread");

  const [dataset, setDataset] = useState<LoreDataset | null>(() => getCachedLoreDataset());
  const [loading, setLoading] = useState(() => !getCachedLoreDataset());

  useEffect(() => {
    let cancelled = false;
    loadLoreData()
      .then((data) => {
        if (!cancelled) {
          setDataset(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const entries = useMemo(() => dataset?.entries || [], [dataset]);
  const entryById = useMemo(() => {
    if (!dataset) return {} as Record<string, LoreEntry>;
    return Object.fromEntries(dataset.entries.map((entry) => [entry.id, entry]));
  }, [dataset]);
  const relations = useMemo(() => dataset?.relations || [], [dataset]);
  const theories = useMemo(() => dataset?.theories || [], [dataset]);
  const timeline = useMemo(() => dataset?.timeline || [], [dataset]);
  const itemLinks = useMemo(() => dataset?.itemLinks || [], [dataset]);

  const [activeView, setActiveView] = useState<LoreView>(() => {
    if (initialThreadParam) return "board";
    return isLoreView(initialViewParam) ? initialViewParam : "atlas";
  });
  const [activeCategory, setActiveCategory] = useState<LoreFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<LoreEntry | null>(() => {
    const cached = getCachedLoreDataset();
    if (cached && initialThreadParam) {
      return cached.entries.find((e) => e.id === initialThreadParam) || null;
    }
    return null;
  });
  const [boardEntryId, setBoardEntryId] = useState(() => initialThreadParam || "artifacts-the-runemark-of-eternity");
  const [relationFilter, setRelationFilter] = useState<RelationFilter>("all");
  const [boardPickerOpen, setBoardPickerOpen] = useState(false);
  const [boardPickerSearch, setBoardPickerSearch] = useState("");
  const [boardPickerCategory, setBoardPickerCategory] = useState<LoreFilter>("all");
  const [activeBoardOptionIndex, setActiveBoardOptionIndex] = useState(0);
  const boardPickerRef = useRef<HTMLDivElement | null>(null);
  const boardPickerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const boardPickerListId = useId();

  useEffect(() => {
    const thread = searchParams.get("thread");
    const query = searchParams.get("q");
    const view = searchParams.get("view");
    if (query) setSearch(query);
    if (isLoreView(view)) setActiveView(view);
    if (thread && entryById[thread]) {
      setBoardEntryId(thread);
      setActiveView("board");
      setSelectedEntry(entryById[thread]);
    }
  }, [entryById, searchParamKey, searchParams]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!boardPickerRef.current?.contains(event.target as Node)) {
        setBoardPickerOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setBoardPickerOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const categoryCounts = useMemo(() => {
    return entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + 1;
      return acc;
    }, {});
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const categoryMatch = activeCategory === "all" || entry.category === activeCategory;
      if (!categoryMatch) return false;
      if (!q) return true;
      const haystack = [
        entry.title,
        entry.category,
        entry.summary,
        ...entry.tags,
        ...entry.keyFacts,
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [activeCategory, entries, search]);

  const featuredAtlas = useMemo(() => {
    const featured = FEATURED_ATLAS_IDS.map((id) => entryById[id]).filter(Boolean);
    if (search.trim() || activeCategory !== "all") return filteredEntries;
    return featured;
  }, [activeCategory, entryById, filteredEntries, search]);

  const characterEntries = useMemo(
    () => filteredEntries.filter((entry) => entry.category === "NPC"),
    [filteredEntries],
  );

  const npcNetworkGroups = useMemo(() => {
    const hubs = NPC_NETWORK_HUB_IDS
      .map((id) => entryById[id])
      .filter((entry): entry is LoreEntry => Boolean(entry));

    const assigned = new Set<string>();
    const groups: NpcNetworkGroup[] = hubs.map((hub) => {
      const hubTitle = normalizeLoreText(hub.title);
      const characters = characterEntries.filter((entry) => {
        if (assigned.has(entry.id)) return false;
        if (entry.relatedIds.includes(hub.id)) return true;
        return entry.tags.some((tag) => normalizeLoreText(tag) === hubTitle);
      });
      characters.forEach((entry) => assigned.add(entry.id));

      return {
        id: hub.id,
        title: hub.title,
        category: CATEGORY_META[hub.category].label,
        tone: CATEGORY_META[hub.category].tone,
        detail: cleanLoreCopy(hub.summary),
        characters,
      };
    }).filter((group) => group.characters.length > 0);

    const unplaced = characterEntries.filter((entry) => !assigned.has(entry.id));

    if (unplaced.length > 0) {
      groups.push({
        id: "unplaced",
        title: "Unplaced Threads",
        category: "Archive",
        tone: "#f5b041",
        detail: "Characters without a strong place or faction link in the current official relationship data.",
        characters: unplaced,
      });
    }

    return groups;
  }, [characterEntries, entryById]);

  const artifactsAndBeasts = useMemo(
    () => filteredEntries.filter((entry) => entry.category === "Artifact" || entry.category === "Bestiary" || entry.category === "Concept"),
    [filteredEntries],
  );

  const boardEntry = (boardEntryId && entryById[boardEntryId]) || entryById["artifacts-the-runemark-of-eternity"] || entries[0];
  const boardRelations = useMemo(() => {
    if (!boardEntry) return [];
    return relations.filter((relation) => {
      const touchesBoard = relation.source === boardEntry.id || relation.target === boardEntry.id;
      const passesFilter = relationFilter === "all" || relation.confidence === relationFilter;
      return touchesBoard && passesFilter;
    }).slice(0, 18);
  }, [boardEntry, relationFilter, relations]);

  const boardStats = useMemo(() => {
    if (!boardEntry) return { total: 0, canon: 0, inferred: 0, theory: 0 };
    const related = relations.filter((relation) => relation.source === boardEntry.id || relation.target === boardEntry.id);
    return {
      total: related.length,
      canon: related.filter((relation) => relation.confidence === "canon").length,
      inferred: related.filter((relation) => relation.confidence === "inferred").length,
      theory: related.filter((relation) => relation.confidence === "theory").length,
    };
  }, [boardEntry, relations]);

  const boardGraphRelations = boardRelations.slice(0, 8);
  const boardOptions = useMemo(() => entries.filter((entry) => entry.category !== "Index"), [entries]);
  const filteredBoardOptions = useMemo(() => {
    const q = boardPickerSearch.trim().toLowerCase();
    const categoryMatches = (entry: LoreEntry) => boardPickerCategory === "all" || entry.category === boardPickerCategory;
    if (!q) return boardOptions.filter(categoryMatches);

    return boardOptions.filter((entry) => {
      if (!categoryMatches(entry)) return false;
      const haystack = [
        entry.title,
        entry.category,
        CATEGORY_META[entry.category].label,
        entry.summary,
        ...entry.tags,
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [boardOptions, boardPickerCategory, boardPickerSearch]);

  useEffect(() => {
    if (!boardPickerOpen) {
      setActiveBoardOptionIndex(0);
      return;
    }
    setActiveBoardOptionIndex((current) => Math.min(Math.max(current, 0), Math.max(filteredBoardOptions.length - 1, 0)));
  }, [boardPickerOpen, filteredBoardOptions.length]);

  useEffect(() => {
    if (boardPickerOpen) setActiveBoardOptionIndex(0);
  }, [boardPickerCategory, boardPickerOpen, boardPickerSearch]);

  const activeViewLabel = VIEW_OPTIONS.find((view) => view.id === activeView)?.label || "Atlas";
  const categoryFilterApplies = activeView === "atlas" || activeView === "characters" || activeView === "artifacts";
  const activeCategoryLabel = categoryFilterApplies
    ? activeCategory === "all" ? "All categories" : CATEGORY_META[activeCategory].label
    : "Not used in this view";
  const visibleEntryCount = (() => {
    if (activeView === "timeline") return timeline.length;
    if (activeView === "characters") return characterEntries.length;
    if (activeView === "artifacts") return artifactsAndBeasts.length;
    if (activeView === "board") return boardRelations.length;
    if (activeView === "theories") return theories.length;
    return featuredAtlas.length;
  })();
  const hasSearch = search.trim().length > 0;
  const hasActiveControls = hasSearch || activeCategory !== "all" || activeView !== "atlas";

  const openEntry = (entry: LoreEntry) => {
    setSelectedEntry(entry);
    setBoardEntryId(entry.id);
  };

  const selectBoardEntry = (entryId: string) => {
    setBoardEntryId(entryId);
    setBoardPickerOpen(false);
    setBoardPickerSearch("");
  };

  const getBoardOptionId = (entryId: string) => `${boardPickerListId}-option-${entryId}`;
  const activeBoardOption = filteredBoardOptions[activeBoardOptionIndex] || null;
  const activeBoardOptionId = activeBoardOption ? getBoardOptionId(activeBoardOption.id) : undefined;

  const toggleBoardPicker = () => {
    setBoardPickerOpen((open) => {
      const nextOpen = !open;
      if (nextOpen) {
        const currentIndex = filteredBoardOptions.findIndex((entry) => entry.id === boardEntry?.id);
        setActiveBoardOptionIndex(Math.max(currentIndex, 0));
      }
      return nextOpen;
    });
  };

  const handleBoardPickerSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!boardPickerOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setBoardPickerOpen(false);
      boardPickerTriggerRef.current?.focus();
      return;
    }
    if (filteredBoardOptions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveBoardOptionIndex((current) => (current + 1) % filteredBoardOptions.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveBoardOptionIndex((current) => (current - 1 + filteredBoardOptions.length) % filteredBoardOptions.length);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveBoardOptionIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveBoardOptionIndex(filteredBoardOptions.length - 1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredBoardOptions[activeBoardOptionIndex];
      if (option) {
        selectBoardEntry(option.id);
        boardPickerTriggerRef.current?.focus();
      }
    }
  };

  const resetLoreControls = () => {
    setActiveView("atlas");
    setActiveCategory("all");
    setSearch("");
    setRelationFilter("all");
    setBoardPickerOpen(false);
    setBoardPickerSearch("");
    setBoardPickerCategory("all");
  };

  return {
    dataset,
    loading,
    entries,
    entryById,
    relations,
    theories,
    timeline,
    itemLinks,
    activeView,
    setActiveView,
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    selectedEntry,
    setSelectedEntry,
    boardEntryId,
    setBoardEntryId,
    relationFilter,
    setRelationFilter,
    boardPickerOpen,
    setBoardPickerOpen,
    boardPickerSearch,
    setBoardPickerSearch,
    boardPickerCategory,
    setBoardPickerCategory,
    activeBoardOptionIndex,
    setActiveBoardOptionIndex,
    boardPickerRef,
    boardPickerTriggerRef,
    boardPickerListId,
    categoryCounts,
    filteredEntries,
    featuredAtlas,
    characterEntries,
    npcNetworkGroups,
    artifactsAndBeasts,
    boardEntry,
    boardRelations,
    boardStats,
    boardGraphRelations,
    boardOptions,
    filteredBoardOptions,
    activeViewLabel,
    categoryFilterApplies,
    activeCategoryLabel,
    visibleEntryCount,
    hasSearch,
    hasActiveControls,
    openEntry,
    selectBoardEntry,
    getBoardOptionId,
    activeBoardOptionId,
    toggleBoardPicker,
    handleBoardPickerSearchKeyDown,
    resetLoreControls,
  };
}
