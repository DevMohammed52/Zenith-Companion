"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { NoResultsState } from "@/components/StateBlock";
import { useItemModal } from "@/context/ItemModalContext";
import { useProfiles } from "@/lib/profiles";
import { notifyZenith } from "@/lib/notifications";

type SearchResult = {
  label: string;
  type: string;
  href: string;
  detail?: string;
};

function getSearchResultIdentity(result: SearchResult) {
  return `${result.type}::${result.href}::${result.label}::${result.detail || ""}`;
}

function getSearchResultRenderKey(result: SearchResult, index: number) {
  return `${getSearchResultIdentity(result)}::${index}`;
}

function hasBlockingModal() {
  return Array.from(document.querySelectorAll<HTMLElement>('[aria-modal="true"]'))
    .some((element) => !element.classList.contains("command-palette") && element.getClientRects().length > 0);
}

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
  m: "/map",
  s: "/settings",
};

type GlobalSearchProps = {
  hotkeyEnabled?: boolean;
};

type GuildSearchRow = {
  id: number | string;
  name: string;
  tag?: string | null;
  level?: number | null;
  leader_names?: string[];
};

export default function GlobalSearch({ hotkeyEnabled = true }: GlobalSearchProps) {
  const router = useRouter();
  const { openItemByName, prefetchItem } = useItemModal();
  const { activeProfile, state: profileState } = useProfiles();
  const idPrefix = useId().replace(/:/g, "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<SearchResult[]>([]);
  const [staticSearchRows, setStaticSearchRows] = useState<SearchResult[]>([]);
  const [generatedSearchRows, setGeneratedSearchRows] = useState<SearchResult[]>([]);
  const [guildSearchRows, setGuildSearchRows] = useState<GuildSearchRow[]>([]);
  const [generatedSearchLoading, setGeneratedSearchLoading] = useState(false);
  const [staticSearchLoading, setStaticSearchLoading] = useState(false);
  const [guildSearchLoading, setGuildSearchLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogId = `${idPrefix}-global-search-dialog`;
  const titleId = `${idPrefix}-global-search-title`;
  const resultsId = `${idPrefix}-global-search-results`;
  const statusId = `${idPrefix}-global-search-status`;

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
    if (!open || generatedSearchRows.length > 0) return;
    let cancelled = false;
    setGeneratedSearchLoading(true);
    fetch("/global-search-index.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((payload) => {
        if (cancelled || !Array.isArray(payload)) return;
        setGeneratedSearchRows(payload.filter((row): row is SearchResult => (
          typeof row?.label === "string"
          && typeof row?.type === "string"
          && typeof row?.href === "string"
        )));
      })
      .catch(() => {
        if (!cancelled) setGeneratedSearchRows([]);
      })
      .finally(() => {
        if (!cancelled) setGeneratedSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [generatedSearchRows.length, open]);

  useEffect(() => {
    if (!open || staticSearchRows.length > 0) return;
    let cancelled = false;
    setStaticSearchLoading(true);
    Promise.all([
      import("@/constants"),
      import("@/data/lore"),
    ]).then(([constantsModule, loreModule]) => {
      if (cancelled) return;
      const rows: SearchResult[] = [];

      loreModule.LORE_ENTRIES.forEach(entry => {
        rows.push({
          label: entry.title,
          type: "Lore",
          href: `/lore?thread=${encodeURIComponent(entry.id)}`,
          detail: `${entry.category} - ${entry.tags.slice(0, 2).join(", ") || "Valaron archive"}`,
        });
      });

      loreModule.LORE_THEORIES.forEach(theory => {
        rows.push({
          label: theory.title,
          type: "Theory",
          href: `/lore?view=theories&q=${encodeURIComponent(theory.title)}`,
          detail: `${theory.speculationLevel} speculation`,
        });
      });

      Object.keys(constantsModule.ALCHEMY_ITEMS).forEach(name => {
        rows.push({ label: name, type: "Recipe", href: `/alchemy?recipe=${encodeURIComponent(name)}`, detail: "Alchemy" });
      });

      setStaticSearchRows(rows);
    }).catch(() => {
      if (!cancelled) setStaticSearchRows([]);
    }).finally(() => {
      if (!cancelled) setStaticSearchLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, staticSearchRows.length]);

  useEffect(() => {
    if (!open || guildSearchRows.length > 0) return;
    let cancelled = false;
    setGuildSearchLoading(true);
    fetch("/guild-search-index.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled || !Array.isArray(payload)) return;
        setGuildSearchRows(payload);
      })
      .catch(() => {
        if (!cancelled) setGuildSearchRows([]);
      })
      .finally(() => {
        if (!cancelled) setGuildSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [guildSearchRows.length, open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
      ? document.activeElement
      : null;
    const triggerElement = triggerRef.current;
    document.body.classList.add("command-open");
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.classList.remove("command-open");
      document.body.style.overflow = previousOverflow;
      const restoreFocusTarget = previouslyFocused && document.contains(previouslyFocused) ? previouslyFocused : triggerElement;
      window.setTimeout(() => {
        if (restoreFocusTarget && document.contains(restoreFocusTarget)) {
          restoreFocusTarget.focus({ preventScroll: true });
        }
      }, 0);
    };
  }, [open]);

  useEffect(() => {
    if (!hotkeyEnabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        const triggerElement = triggerRef.current;
        if (!triggerElement || triggerElement.getClientRects().length === 0) return;
        if (hasBlockingModal()) return;
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
      { label: "Dashboard", type: "Page", href: "/", detail: "Daily checks and stale-data status" },
      { label: "Profiles", type: "Page", href: "/profiles", detail: "Local characters, imports, and backups" },
      { label: "Settings", type: "Page", href: "/settings", detail: "Preferences, buffs, and theme" },
      { label: "Items Database", type: "Page", href: "/items", detail: "Prices, sources, recipes, and locations" },
      { label: "Enemy Database", type: "Page", href: "/enemies", detail: "Mobs, drops, levels, and weather behavior" },
      { label: "Pet Database", type: "Page", href: "/pets", detail: "Pet stats and listings" },
      { label: "Owned Pets", type: "Page", href: "/pets/owned", detail: "Imported and manual pet snapshots" },
      { label: "Pet Comparison", type: "Page", href: "/pets/compare", detail: "Side-by-side pet planner" },
      { label: "Guild Database", type: "Page", href: "/guilds", detail: "Guild list, tags, leaders, and members" },
      { label: "Museum", type: "Page", href: "/museum", detail: "Profile collection snapshots" },
      { label: "Lore Wiki", type: "Page", href: "/lore", detail: "Chronicles of Valaron" },
      { label: "Alchemy Profit", type: "Page", href: "/alchemy", detail: "Potion margins, taxes, and recipes" },
      { label: "Skill Profit Finder", type: "Page", href: "/skill-profit", detail: "Skill routes, tools, buffs, and prices" },
      { label: "Mythic Lab", type: "Page", href: "/alchemy/mythic", detail: "Level 90 recipes and material batches" },
      { label: "Crafting Queue", type: "Page", href: "/crafting", detail: "Shopping list, materials, and batches" },
      { label: "Forge Planner", type: "Page", href: "/forge", detail: "Saved recipe material planning" },
      { label: "Housing", type: "Page", href: "/housing", detail: "Profile housing buffs and costs" },
      { label: "BiS Recommender", type: "Page", href: "/bis", detail: "Gear tiers and stat comparison" },
      { label: "Market Watch", type: "Page", href: "/market-alerts", detail: "Historical threshold rules" },
      { label: "World Map", type: "Page", href: "/map", detail: "Locations, resources, mobs, and weather" },
      { label: "Weather Guide", type: "Page", href: "/weather", detail: "Forecasts and enemy reactions" },
      { label: "Combat", type: "Page", href: "/combat", detail: "Enemy drops, KPH, food, and EV" },
      { label: "Dungeons", type: "Page", href: "/dungeons", detail: "Entry costs, shards, drops, and EV" },
      { label: "World Bosses", type: "Page", href: "/bosses", detail: "Boss timers, travel routes, and drops" },
      { label: "Conquest", type: "Page", href: "/conquest", detail: "Assault windows and guild control" },
    ];

    profileState.profiles.forEach((profile) => {
      next.push({
        label: profile.name,
        type: "Profile",
        href: "/profiles",
        detail: `${profile.className || "Character"} - TL ${profile.levels.totalLevel || 0}`,
      });
    });

    activeProfile?.ownedPets?.forEach((pet) => {
      if (!pet.species) return;
      next.push({
        label: pet.nickname ? `${pet.nickname} (${pet.species})` : pet.species,
        type: "Owned Pet",
        href: "/pets/owned",
        detail: `${pet.quality || "Pet"} - ${activeProfile.name}`,
      });
    });

    activeProfile?.museum?.items?.forEach((item) => {
      if (!item.name) return;
      next.push({
        label: item.name,
        type: "Museum",
        href: "/museum",
        detail: `${item.category || "Collection"} - qty ${item.quantity ?? 1}`,
      });
    });

    next.push(...staticSearchRows);
    next.push(...generatedSearchRows);

    guildSearchRows.forEach((guild) => {
      if (!guild.name) return;
      const leaders = guild.leader_names?.slice(0, 2).join(", ");
      next.push({
        label: guild.tag ? `${guild.name} [${guild.tag}]` : guild.name,
        type: "Guild",
        href: `/guilds?guild=${encodeURIComponent(String(guild.id))}`,
        detail: `Level ${guild.level ?? "-"}${leaders ? ` - ${leaders}` : ""}`,
      });
    });

    return next;
  }, [activeProfile, generatedSearchRows, guildSearchRows, profileState.profiles, staticSearchRows]);

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

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery, filteredResults.length]);

  const closeSearch = () => {
    setOpen(false);
  };

  const openResult = (result: SearchResult) => {
    closeSearch();
    setQuery("");
    
    // Save to recent
    const resultIdentity = getSearchResultIdentity(result);
    const updatedRecent = [result, ...recent.filter(r => getSearchResultIdentity(r) !== resultIdentity)].slice(0, 5);
    setRecent(updatedRecent);
    localStorage.setItem('zenith-recent-items', JSON.stringify(updatedRecent));

    if (result.type === "Recipe") {
      // Always navigate for Alchemy recipes to see the profit calculator
      router.push(result.href);
    } else if (result.type === "Item") {
      openItemByName(result.label);
      notifyZenith({
        title: "Item opened",
        body: `${result.label} details opened. Use sources and safe values before planning a bulk trade.`,
      });
    } else {
      router.push(result.href);
      notifyZenith({
        title: `${result.label} opened`,
        body: result.detail ? `${result.detail}.` : "Page opened from global search.",
        tone: "success",
      });
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

  const activeResultId = filteredResults[activeIndex] ? `${resultsId}-option-${activeIndex}` : undefined;
  const searchLoading = generatedSearchLoading || staticSearchLoading || guildSearchLoading;
  const resultStatusCopy = searchLoading
    ? `Search indexes are loading. ${filteredResults.length} ${filteredResults.length === 1 ? "result is" : "results are"} available so far.`
    : `${filteredResults.length} search ${filteredResults.length === 1 ? "result" : "results"} available.`;

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      return;
    }

    if (event.key === "Tab") {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((element) => (
        (element.tabIndex >= 0 || element === document.activeElement)
        && (element.offsetParent !== null || element.getClientRects().length > 0 || element === document.activeElement)
      ));

      if (focusable.length === 0) return;

      const activeElement = document.activeElement;
      const activeFocusIndex = activeElement instanceof HTMLElement ? focusable.indexOf(activeElement) : -1;
      const nextFocusIndex = event.shiftKey
        ? activeFocusIndex <= 0 ? focusable.length - 1 : activeFocusIndex - 1
        : activeFocusIndex === -1 || activeFocusIndex >= focusable.length - 1 ? 0 : activeFocusIndex + 1;

      event.preventDefault();
      focusable[nextFocusIndex]?.focus({ preventScroll: true });
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredResults.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filteredResults.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(filteredResults.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      openResult(filteredResults[activeIndex]);
    }
  };

  const palette = open ? (
    <div className="command-overlay" onClick={closeSearch}>
      <div
        id={dialogId}
        className="command-palette"
        onClick={event => event.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="sr-only">Global search</h2>
        <div className="command-input-wrap">
          <Search size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            autoFocus
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls={resultsId}
            aria-activedescendant={activeResultId}
            aria-describedby={statusId}
            aria-label="Search tools, items, recipes, enemies, and lore"
            spellCheck={false}
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search tools, items, recipes, enemies, lore..."
          />
          <button type="button" onClick={closeSearch} aria-label="Close search">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div
          className="command-results"
          id={resultsId}
          role="listbox"
          aria-label="Search results"
          aria-busy={searchLoading}
        >
          {!query && recent.length > 0 && <div className="section-title" style={{ padding: '0.5rem 1rem', fontSize: '0.7rem' }}>Recently Viewed</div>}
          {filteredResults.map((result, index) => (
            <button
              id={`${resultsId}-option-${index}`}
              key={getSearchResultRenderKey(result, index)}
              type="button"
              role="option"
              aria-label={`${result.label}. ${result.detail || result.href}. ${result.type}.`}
              aria-posinset={index + 1}
              aria-selected={index === activeIndex}
              aria-setsize={filteredResults.length}
              tabIndex={-1}
              className={index === activeIndex ? "active" : undefined}
              onClick={() => openResult(result)}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => result.type === "Item" && prefetchItem(result.label)}
            >
              <span>
                <strong>{highlightText(result.label, query)}</strong>
                {" "}
                <small>{result.detail || result.href}</small>
              </span>
              {" "}
              <em>{result.type}</em>
            </button>
          ))}
          {filteredResults.length === 0 ? (
            <NoResultsState
              compact
              title="No matches found"
              description={query ? `No tools, items, profiles, or references match "${query}".` : "Start typing to search Zenith."}
            />
          ) : null}
        </div>
        <div id={statusId} className="sr-only" aria-live="polite" aria-atomic="true">
          {resultStatusCopy}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        className="global-search-trigger"
        type="button"
        onClick={() => setOpen(true)}
        disabled={!mounted}
        aria-busy={!mounted}
        aria-label="Open global search"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        data-open={open ? "true" : "false"}
      >
        <Search size={14} aria-hidden="true" />
        <span>Search</span>
        <kbd>Ctrl K</kbd>
      </button>

      {mounted && palette ? createPortal(palette, document.body) : null}
    </>
  );
}
