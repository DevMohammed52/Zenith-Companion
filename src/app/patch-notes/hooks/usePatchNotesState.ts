"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { SelectOption } from "@/components/ui";
import {
  ALL_FILTER,
  CATEGORY_LABELS,
  filterPatchNotes,
  getPatchYear,
  NOTES_PER_PAGE,
  type PatchNotesPayload,
} from "../types";

export function usePatchNotesState() {
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<PatchNotesPayload | null>(null);
  const [loadError, setLoadError] = useState("");
  const [reloadNonce, setReloadNonce] = useState(0);

  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState(() => searchParams.get("category") || ALL_FILTER);
  const [year, setYear] = useState(() => searchParams.get("year") || ALL_FILTER);
  const [currentPage, setCurrentPage] = useState(() => {
    const raw = Number(searchParams.get("page") || "1");
    return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
  });
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let active = true;
    fetch("/idlemmo-patch-notes.json", { cache: "no-cache" })
      .then((res) => {
        if (!res.ok) throw new Error("Patch notes archive is currently unavailable.");
        return res.json() as Promise<PatchNotesPayload>;
      })
      .then((data) => {
        if (!active) return;
        setPayload(data);
        setLoadError("");
        const versionParam = searchParams.get("version");
        const target = versionParam
          ? data.patchNotes.find((n) => n.version.toLowerCase() === versionParam.toLowerCase())
          : data.patchNotes[0];
        if (target) {
          setExpandedIds((prev) => (prev.size > 0 ? prev : new Set([target.id])));
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Could not load patch notes.");
      });
    return () => {
      active = false;
    };
  }, [reloadNonce, searchParams]);

  // Sync filter state cleanly into URL via replaceState
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    if (category !== ALL_FILTER) params.set("category", category);
    else params.delete("category");
    if (year !== ALL_FILTER) params.set("year", year);
    else params.delete("year");
    if (currentPage > 1) params.set("page", String(currentPage));
    else params.delete("page");
    const qs = params.toString();
    const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, [query, category, year, currentPage]);

  const patchNotes = useMemo(() => payload?.patchNotes ?? [], [payload]);
  const categoryCounts = useMemo(() => payload?.meta.categoryCounts ?? {}, [payload]);

  const categoryOptions: SelectOption[] = useMemo(() => {
    const keys = Object.keys(categoryCounts).sort((a, b) => (categoryCounts[b] || 0) - (categoryCounts[a] || 0));
    return [
      { value: ALL_FILTER, label: "All categories", badge: String(patchNotes.length || 0) },
      ...keys.map((key) => ({
        value: key,
        label: CATEGORY_LABELS[key] || key,
        badge: String(categoryCounts[key] || 0),
      })),
    ];
  }, [categoryCounts, patchNotes.length]);

  const yearOptions: SelectOption[] = useMemo(() => {
    const uniqueYears = Array.from(new Set(patchNotes.map((note) => getPatchYear(note.releasedAt))))
      .filter((y) => y !== "Unknown")
      .sort((a, b) => b.localeCompare(a));
    return [
      { value: ALL_FILTER, label: "All years" },
      ...uniqueYears.map((y) => ({ value: y, label: y })),
    ];
  }, [patchNotes]);

  const filteredNotes = useMemo(
    () => filterPatchNotes(patchNotes, { query: deferredQuery, category, year }),
    [patchNotes, deferredQuery, category, year],
  );

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / NOTES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedNotes = useMemo(() => {
    const start = (safePage - 1) * NOTES_PER_PAGE;
    return filteredNotes.slice(start, start + NOTES_PER_PAGE);
  }, [filteredNotes, safePage]);

  const handleToggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCategoryChange = useCallback((nextCategory: string) => {
    setCategory(nextCategory);
    setCurrentPage(1);
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setCurrentPage(1);
  }, []);

  const handleYearChange = useCallback((value: string) => {
    setYear(value);
    setCurrentPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setQuery("");
    setCategory(ALL_FILTER);
    setYear(ALL_FILTER);
    setCurrentPage(1);
  }, []);

  const handleRetry = useCallback(() => {
    setLoadError("");
    setReloadNonce((n) => n + 1);
  }, []);

  const startIdx = filteredNotes.length === 0 ? 0 : (safePage - 1) * NOTES_PER_PAGE + 1;
  const endIdx = Math.min(safePage * NOTES_PER_PAGE, filteredNotes.length);

  return {
    meta: payload?.meta ?? null,
    totalCount: patchNotes.length,
    isLoading: !payload && !loadError,
    loadError,
    query,
    deferredQuery,
    category,
    year,
    categoryOptions,
    yearOptions,
    categoryCounts,
    filteredNotes,
    paginatedNotes,
    expandedIds,
    currentPage: safePage,
    totalPages,
    visibleRangeLabel: filteredNotes.length > 0 ? `Showing ${startIdx}-${endIdx}` : "",
    hasFilters: Boolean(query.trim() || category !== ALL_FILTER || year !== ALL_FILTER),
    setCurrentPage,
    setExpandedIds,
    handleQueryChange,
    handleCategoryChange,
    handleYearChange,
    handleToggleExpand,
    handleReset,
    handleRetry,
  };
}
