"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useItemModal } from "@/context/ItemModalContext";
import { useProfiles } from "@/lib/profiles";

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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<SearchResult[]>([]);
  const [staticSearchRows, setStaticSearchRows] = useState<SearchResult[]>([]);
  const [generatedSearchRows, setGeneratedSearchRows] = useState<SearchResult[]>([]);
  const [guildSearchRows, setGuildSearchRows] = useState<GuildSearchRow[]>([]);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
      });
    return () => {
      cancelled = true;
    };
  }, [generatedSearchRows.length, open]);

  useEffect(() => {
    if (!open || staticSearchRows.length > 0) return;
    let cancelled = false;
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
    });
    return () => {
      cancelled = true;
    };
  }, [open, staticSearchRows.length]);

  useEffect(() => {
    if (!open || guildSearchRows.length > 0) return;
    let cancelled = false;
    fetch("/guild-search-index.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled || !Array.isArray(payload)) return;
        setGuildSearchRows(payload);
      })
      .catch(() => {
        if (!cancelled) setGuildSearchRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [guildSearchRows.length, open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.classList.add("command-open");
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.classList.remove("command-open");
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      } else {
        triggerRef.current?.focus({ preventScroll: true });
      }
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
      { label: "Profiles", type: "Page", href: "/profiles", detail: "Character setups and imports" },
      { label: "Settings", type: "Page", href: "/settings", detail: "Preferences, buffs, and theme" },
      { label: "Items Database", type: "Page", href: "/items", detail: "Market data repository" },
      { label: "Enemy Database", type: "Page", href: "/enemies", detail: "Mobs, drops, weather behavior" },
      { label: "Pet Database", type: "Page", href: "/pets", detail: "Pet stats and listings" },
      { label: "Owned Pets", type: "Page", href: "/pets/owned", detail: "Imported and manual pet snapshots" },
      { label: "Pet Comparison", type: "Page", href: "/pets/compare", detail: "Side-by-side pet planner" },
      { label: "Guild Database", type: "Page", href: "/guilds", detail: "Guild registry and discovery" },
      { label: "Museum", type: "Page", href: "/museum", detail: "Profile collection snapshots" },
      { label: "Lore Wiki", type: "Page", href: "/lore", detail: "Chronicles of Valaron" },
      { label: "Alchemy Profit", type: "Page", href: "/alchemy", detail: "Profit calculator" },
      { label: "Skill Profit Finder", type: "Page", href: "/skill-profit", detail: "Live skill route planner" },
      { label: "Mythic Lab", type: "Page", href: "/alchemy/mythic", detail: "High-tier alchemy batching" },
      { label: "Crafting Queue", type: "Page", href: "/crafting", detail: "Shopping list and batching" },
      { label: "Forge Planner", type: "Page", href: "/forge", detail: "Saved recipe material planning" },
      { label: "Housing", type: "Page", href: "/housing", detail: "Profile housing buffs and costs" },
      { label: "BiS Recommender", type: "Page", href: "/bis", detail: "Gear tiers and stat comparison" },
      { label: "Market Watch", type: "Page", href: "/market-alerts", detail: "Historical threshold rules" },
      { label: "World Map", type: "Page", href: "/map", detail: "Locations, weather, and sources" },
      { label: "Weather Guide", type: "Page", href: "/weather", detail: "Forecasts and enemy reactions" },
      { label: "Combat", type: "Page", href: "/combat", detail: "Enemy drops and profit" },
      { label: "Dungeons", type: "Page", href: "/dungeons", detail: "Loot tables and efficiency" },
      { label: "World Bosses", type: "Page", href: "/bosses", detail: "Rare drops and locations" },
      { label: "Conquest", type: "Page", href: "/conquest", detail: "Assaults and guild standings" },
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

  const activeResultId = filteredResults[activeIndex] ? `global-search-result-${activeIndex}` : undefined;

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
      )).filter((element) => element.offsetParent !== null || element === document.activeElement);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
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
        className="command-palette"
        onClick={event => event.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-search-title"
      >
        <h2 id="global-search-title" className="sr-only">Global search</h2>
        <div className="command-input-wrap">
          <Search size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            autoFocus
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="global-search-results"
            aria-activedescendant={activeResultId}
            aria-label="Search tools, items, recipes, enemies, and lore"
            spellCheck={false}
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search tools, items, recipes, enemies, lore..."
          />
          <button type="button" onClick={closeSearch} aria-label="Close search">
            <X size={16} />
          </button>
        </div>
        <div
          className="command-results"
          id="global-search-results"
          role="listbox"
          aria-label="Search results"
        >
          {!query && recent.length > 0 && <div className="section-title" style={{ padding: '0.5rem 1rem', fontSize: '0.7rem' }}>Recently Viewed</div>}
          {filteredResults.map((result, index) => (
            <button
              id={`global-search-result-${index}`}
              key={getSearchResultRenderKey(result, index)}
              type="button"
              role="option"
              aria-label={`${result.label}. ${result.detail || result.href}. ${result.type}.`}
              aria-selected={index === activeIndex}
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
          {filteredResults.length === 0 && <div className="dashboard-empty" role="status" style={{ padding: '2rem' }}>No matches found for &quot;{query}&quot;</div>}
        </div>
        <div className="sr-only" aria-live="polite">
          {filteredResults.length} search {filteredResults.length === 1 ? "result" : "results"} available.
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button ref={triggerRef} className="global-search-trigger" type="button" onClick={() => setOpen(true)} style={{ flex: 1 }} aria-haspopup="dialog" aria-expanded={open}>
        <Search size={14} aria-hidden="true" />
        <span>Search</span>
        <kbd>Ctrl K</kbd>
      </button>

      {mounted && palette ? createPortal(palette, document.body) : null}
    </>
  );
}
