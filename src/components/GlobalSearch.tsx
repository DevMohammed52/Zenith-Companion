"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { ALCHEMY_ITEMS } from "@/constants";
import { useItemModal } from "@/context/ItemModalContext";
import { LORE_ENTRIES, LORE_THEORIES } from "@/data/lore";

type SearchResult = {
  label: string;
  type: string;
  href: string;
  detail?: string;
};

const navShortcuts: Record<string, string> = {
  "1": "/",
  "2": "/alchemy",
  "3": "/items",
  "4": "/combat",
  "5": "/dungeons",
  "6": "/bosses",
  "7": "/bis",
  "8": "/crafting",
  "9": "/lore",
  s: "/settings",
};

import { useData } from "@/context/DataContext";

type GlobalSearchProps = {
  hotkeyEnabled?: boolean;
};

export default function GlobalSearch({ hotkeyEnabled = true }: GlobalSearchProps) {
  const router = useRouter();
  const { openItemByName, prefetchItem } = useItemModal();
  const { marketData, staticData, allItemsDb } = useData();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<SearchResult[]>([]);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load recent from storage
  useEffect(() => {
    const stored = localStorage.getItem('zenith-recent-items');
    if (stored) {
      try { setRecent(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.classList.add("command-open");
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.classList.remove("command-open");
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!hotkeyEnabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.altKey && !typing) {
        const href = navShortcuts[event.key.toLowerCase()];
        if (href) {
          event.preventDefault();
          router.push(href);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkeyEnabled, router]);

  const results = useMemo<SearchResult[]>(() => {
    const next: SearchResult[] = [
      { label: "Dashboard", type: "Page", href: "/", detail: "Overview" },
      { label: "Alchemy Profit", type: "Page", href: "/alchemy", detail: "Profit calculator" },
      { label: "Crafting Queue", type: "Page", href: "/crafting", detail: "Shopping list and batching" },
      { label: "Items Database", type: "Page", href: "/items", detail: "Market data repository" },
      { label: "Combat", type: "Page", href: "/combat", detail: "Enemy drops and profit" },
      { label: "Dungeons", type: "Page", href: "/dungeons", detail: "Loot tables and efficiency" },
      { label: "World Bosses", type: "Page", href: "/bosses", detail: "Rare drops and locations" },
      { label: "BiS Recommender", type: "Page", href: "/bis", detail: "Best-in-slot gear logic" },
      { label: "Lore Wiki", type: "Page", href: "/lore", detail: "Chronicles of Valaron" },
      { label: "Settings", type: "Page", href: "/settings", detail: "Preferences and theme" },
    ];

    LORE_ENTRIES.forEach(entry => {
      next.push({
        label: entry.title,
        type: "Lore",
        href: `/lore?thread=${encodeURIComponent(entry.id)}`,
        detail: `${entry.category} · ${entry.tags.slice(0, 2).join(", ") || "Valaron archive"}`,
      });
    });

    LORE_THEORIES.forEach(theory => {
      next.push({
        label: theory.title,
        type: "Theory",
        href: `/lore?view=theories&q=${encodeURIComponent(theory.title)}`,
        detail: `${theory.speculationLevel} speculation`,
      });
    });

    Object.keys(ALCHEMY_ITEMS).forEach(name => {
      next.push({ label: name, type: "Recipe", href: `/alchemy?recipe=${encodeURIComponent(name)}`, detail: "Alchemy" });
    });

    // Use allItemsDb instead of just marketData to find everything
    if (allItemsDb) {
      Object.keys(allItemsDb).forEach(name => {
          const item = allItemsDb[name];
          next.push({ 
            label: name, 
            type: "Item", 
            href: `/items?name=${encodeURIComponent(name)}`, 
            detail: item.type ? item.type.replace(/_/g, ' ') : "Game Item" 
          });
      });
    } else if (marketData) {
      Object.keys(marketData)
        .filter(name => !name.startsWith("_"))
        .forEach(name => next.push({ label: name, type: "Item", href: `/items?name=${encodeURIComponent(name)}`, detail: "Market price" }));
    }

    staticData?.enemies?.forEach((enemy: any) => {
      next.push({ label: enemy.name, type: "Enemy", href: `/combat?search=${encodeURIComponent(enemy.name)}`, detail: enemy.location?.name });
    });
    staticData?.dungeons?.forEach((dungeon: any) => {
      next.push({ label: dungeon.name, type: "Dungeon", href: `/dungeons?search=${encodeURIComponent(dungeon.name)}`, detail: dungeon.location?.name });
    });
    staticData?.world_bosses?.forEach((boss: any) => {
      next.push({ label: boss.name, type: "Boss", href: `/bosses?search=${encodeURIComponent(boss.name)}`, detail: boss.location?.name });
    });

    return next;
  }, [marketData, staticData, allItemsDb]);

  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredResults = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return recent.length > 0 ? recent : results.slice(0, 9);
    
    return results
      .filter(result => 
        result.label.toLowerCase().includes(q) || 
        result.type.toLowerCase().includes(q) || 
        (result.detail && result.detail.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [results, debouncedQuery, recent]);

  const openResult = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    
    // Save to recent
    const updatedRecent = [result, ...recent.filter(r => r.label !== result.label)].slice(0, 5);
    setRecent(updatedRecent);
    localStorage.setItem('zenith-recent-items', JSON.stringify(updatedRecent));

    if (result.type === "Recipe") {
      // Always navigate for Alchemy recipes to see the profit calculator
      router.push(result.href);
    } else if (result.type === "Item") {
      // Check if item exists in our item database for modal opening
      const inDb = allItemsDb && allItemsDb[result.label];
      if (inDb) {
        openItemByName(result.label);
      } else {
        router.push(result.href);
      }
    } else {
      router.push(result.href);
    }
  };

  const highlightText = (text: string, q: string) => {
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === q.toLowerCase() 
            ? <span key={i} style={{ color: 'var(--text-accent)', textDecoration: 'underline' }}>{part}</span> 
            : part
        )}
      </span>
    );
  };

  const palette = open ? (
    <div className="command-overlay" onClick={() => setOpen(false)}>
      <div className="command-palette" onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Global search">
        <div className="command-input-wrap">
          <Search size={16} />
          <input
            ref={inputRef}
            autoFocus
            type="search"
            spellCheck={false}
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search tools, items, recipes, enemies, lore..."
          />
          <button type="button" onClick={() => setOpen(false)} aria-label="Close search">
            <X size={16} />
          </button>
        </div>
        <div className="command-results">
          {!query && recent.length > 0 && <div className="section-title" style={{ padding: '0.5rem 1rem', fontSize: '0.7rem' }}>Recently Viewed</div>}
          {filteredResults.map(result => (
            <button
              key={`${result.type}-${result.label}`}
              type="button"
              onClick={() => openResult(result)}
              onMouseEnter={() => result.type === "Item" && prefetchItem(result.label)}
            >
              <span>
                <strong>{highlightText(result.label, query)}</strong>
                <small>{result.detail || result.href}</small>
              </span>
              <em>{result.type}</em>
            </button>
          ))}
          {filteredResults.length === 0 && <div className="dashboard-empty" style={{ padding: '2rem' }}>No matches found for &quot;{query}&quot;</div>}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button className="global-search-trigger" type="button" onClick={() => setOpen(true)} style={{ flex: 1 }} aria-haspopup="dialog" aria-expanded={open}>
        <Search size={14} />
        <span>Search</span>
        <kbd>Ctrl K</kbd>
      </button>

      {mounted && palette ? createPortal(palette, document.body) : null}
    </>
  );
}
