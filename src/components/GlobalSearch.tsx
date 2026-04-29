"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { ALCHEMY_ITEMS } from "@/constants";
import { applyTheme, DEFAULT_PREFERENCES, PREFERENCE_STORAGE_KEY } from "@/lib/preferences";

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
  s: "/settings",
};

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [marketData, setMarketData] = useState<any>(null);
  const [staticData, setStaticData] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFERENCE_STORAGE_KEY);
      const theme = stored ? JSON.parse(stored).theme : DEFAULT_PREFERENCES.theme;
      applyTheme(theme || DEFAULT_PREFERENCES.theme);
    } catch (e) {
      applyTheme(DEFAULT_PREFERENCES.theme);
    }

    const refreshTheme = () => {
      try {
        const stored = localStorage.getItem(PREFERENCE_STORAGE_KEY);
        if (stored) applyTheme(JSON.parse(stored).theme || DEFAULT_PREFERENCES.theme);
      } catch (e) {}
    };

    window.addEventListener("zenith-preferences-updated", refreshTheme);
    return () => window.removeEventListener("zenith-preferences-updated", refreshTheme);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marketRes, staticRes] = await Promise.all([
          fetch("/market-data.json?t=" + Date.now()),
          fetch("/static-data.json?t=" + Date.now()),
        ]);
        if (marketRes.ok) setMarketData(await marketRes.json());
        if (staticRes.ok) setStaticData(await staticRes.json());
      } catch (e) {}
    };

    fetchData();
  }, []);

  useEffect(() => {
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
  }, [router]);

  const results = useMemo<SearchResult[]>(() => {
    const next: SearchResult[] = [
      { label: "Dashboard", type: "Page", href: "/", detail: "Overview" },
      { label: "Alchemy", type: "Page", href: "/alchemy", detail: "Profit calculator" },
      { label: "Market Items", type: "Page", href: "/items", detail: "Item database" },
      { label: "Combat", type: "Page", href: "/combat", detail: "Enemy EV" },
      { label: "Dungeons", type: "Page", href: "/dungeons", detail: "Dungeon EV" },
      { label: "World Bosses", type: "Page", href: "/bosses", detail: "Boss loot" },
      { label: "Settings", type: "Page", href: "/settings", detail: "Preferences and shortcuts" },
    ];

    Object.keys(ALCHEMY_ITEMS).forEach(name => {
      next.push({ label: name, type: "Recipe", href: `/alchemy?recipe=${encodeURIComponent(name)}`, detail: "Alchemy recipe" });
    });

    if (marketData) {
      Object.keys(marketData)
        .filter(name => !name.startsWith("_"))
        .forEach(name => next.push({ label: name, type: "Item", href: `/items?name=${encodeURIComponent(name)}`, detail: "Market item" }));
    }

    staticData?.enemies?.forEach((enemy: any) => {
      next.push({ label: enemy.name, type: "Enemy", href: `/combat?search=${encodeURIComponent(enemy.name)}`, detail: enemy.location?.name });
    });
    staticData?.dungeons?.forEach((dungeon: any) => {
      next.push({ label: dungeon.name, type: "Dungeon", href: "/dungeons", detail: dungeon.location?.name });
    });
    staticData?.world_bosses?.forEach((boss: any) => {
      next.push({ label: boss.name, type: "Boss", href: "/bosses", detail: boss.location?.name });
    });

    return next;
  }, [marketData, staticData]);

  const filteredResults = query.trim()
    ? results
        .filter(result => `${result.label} ${result.type} ${result.detail || ""}`.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 12)
    : results.slice(0, 7);

  const openResult = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <>
      <button className="global-search-trigger" type="button" onClick={() => setOpen(true)}>
        <Search size={14} />
        <span>Search</span>
        <kbd>Ctrl K</kbd>
      </button>

      {open && (
        <div className="command-overlay" onClick={() => setOpen(false)}>
          <div className="command-palette" onClick={event => event.stopPropagation()}>
            <div className="command-input-wrap">
              <Search size={16} />
              <input
                autoFocus
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search tools, items, recipes, enemies..."
              />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close search">
                <X size={16} />
              </button>
            </div>
            <div className="command-results">
              {filteredResults.map(result => (
                <button key={`${result.type}-${result.label}`} type="button" onClick={() => openResult(result.href)}>
                  <span>
                    <strong>{result.label}</strong>
                    <small>{result.detail || result.href}</small>
                  </span>
                  <em>{result.type}</em>
                </button>
              ))}
              {filteredResults.length === 0 && <div className="dashboard-empty">No matches found.</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
