"use client";

import { Suspense, useDeferredValue, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowDownUp,
  Check,
  ChevronDown,
  Cloud,
  ExternalLink,
  Heart,
  MapPin,
  Package,
  RotateCcw,
  Search,
  Shield,
  Skull,
  SlidersHorizontal,
  Sparkles,
  Swords,
  X,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import { LoadingState, NoResultsState } from "@/components/StateBlock";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { useModalA11y } from "@/lib/use-modal-a11y";
import {
  ENEMY_WEATHER_META,
  buildEnrichedEnemies,
  compareEnemiesByProgression,
  getWeatherPreferenceLabel,
  isFavorableWeather,
  isPenalizedWeather,
  type EnrichedEnemy,
  type WeatherPreferenceKind,
} from "@/lib/world-intelligence";

type SortKey = "level" | "name" | "location" | "lootCount" | "lootEv";
type MatchFilter = "all" | "favorable" | "penalized" | "loves" | "likes" | "neutral" | "dislikes" | "hates" | "unknown";

type Option<T extends string> = {
  value: T;
  label: string;
};

const SORT_OPTIONS: Option<SortKey>[] = [
  { value: "level", label: "Level" },
  { value: "name", label: "Name" },
  { value: "location", label: "Location" },
  { value: "lootCount", label: "Loot count" },
  { value: "lootEv", label: "Loot EV" },
];

const MATCH_OPTIONS: Option<MatchFilter>[] = [
  { value: "all", label: "All weather" },
  { value: "favorable", label: "Favored now" },
  { value: "penalized", label: "Penalized now" },
  { value: "loves", label: "Loves current" },
  { value: "likes", label: "Likes current" },
  { value: "neutral", label: "Neutral current" },
  { value: "dislikes", label: "Dislikes current" },
  { value: "hates", label: "Hates current" },
  { value: "unknown", label: "Unknown current" },
];

const LEVEL_OPTIONS: Option<string>[] = [
  { value: "all", label: "All levels" },
  { value: "1-10", label: "Lv. 1-10" },
  { value: "11-25", label: "Lv. 11-25" },
  { value: "26-50", label: "Lv. 26-50" },
  { value: "51-75", label: "Lv. 51-75" },
  { value: "76-100", label: "Lv. 76-100" },
];

function formatGold(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "-";
  return `${Math.round(value).toLocaleString()}g`;
}

function formatWindow(enemy: EnrichedEnemy) {
  if (isFavorableWeather(enemy.currentWeatherMatch)) {
    return `${enemy.currentWeather?.name || "Favorable"} active now`;
  }
  const weather = enemy.nextFavorableWeather;
  if (!weather) return "No forecast match";
  const start = weather.starts_at ? new Date(weather.starts_at) : null;
  if (!start || !Number.isFinite(start.getTime())) return weather.name || "Favorable";
  return `${weather.name || "Favorable"} ${start.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
}

function getEnemyCardLabel(enemy: EnrichedEnemy) {
  const weatherName = enemy.currentWeather?.name || "unknown weather";
  const weatherMatch = getWeatherPreferenceLabel(enemy.currentWeatherMatch).toLowerCase();
  return [
    `Open ${enemy.name}`,
    `level ${enemy.level}`,
    enemy.locationName,
    `${weatherName}: ${weatherMatch}`,
    `${enemy.lootCount} drops`,
    `loot EV ${formatGold(enemy.lootEv)}`,
  ].join(", ");
}

function matchTone(kind: WeatherPreferenceKind) {
  if (kind === "loves" || kind === "likes") return "good";
  if (kind === "dislikes" || kind === "hates") return "bad";
  if (kind === "neutral") return "neutral";
  return "muted";
}

function enemyMatchesFilter(enemy: EnrichedEnemy, filter: MatchFilter) {
  if (filter === "all") return true;
  if (filter === "favorable") return isFavorableWeather(enemy.currentWeatherMatch);
  if (filter === "penalized") return isPenalizedWeather(enemy.currentWeatherMatch);
  return enemy.currentWeatherMatch === filter;
}

function levelMatches(enemy: EnrichedEnemy, levelFilter: string) {
  if (levelFilter === "all") return true;
  const [min, max] = levelFilter.split("-").map(Number);
  return enemy.level >= min && enemy.level <= max;
}

function PreferencePills({ enemy }: { enemy: EnrichedEnemy }) {
  const preference = enemy.weatherPreference;
  if (!preference) return <span className="empty-inline">No weather data</span>;

  const groups: { kind: WeatherPreferenceKind; values: string[] }[] = [
    { kind: "loves", values: preference.loves },
    { kind: "likes", values: preference.likes },
    { kind: "neutral", values: preference.neutral },
    { kind: "dislikes", values: preference.dislikes },
    { kind: "hates", values: preference.hates },
  ];

  return (
    <div className="preference-pills">
      {groups.filter((group) => group.values.length > 0).map((group) => (
        <span key={group.kind} className={`preference-pill ${matchTone(group.kind)}`}>
          <strong>{getWeatherPreferenceLabel(group.kind)}</strong>
          {group.values.join(", ")}
        </span>
      ))}
    </div>
  );
}

function CustomSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState<"down" | "up">("down");
  const [menuMaxHeight, setMenuMaxHeight] = useState(260);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectId = useId();
  const labelId = `${selectId}-label`;
  const selected = options.find((option) => option.value === value) || options[0];
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selected.value));

  const focusOption = (index: number) => {
    const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']");
    const button = buttons?.[Math.max(0, Math.min(index, (buttons.length || 1) - 1))];
    button?.focus({ preventScroll: true });
  };

  const openMenu = (focusIndex = selectedIndex) => {
    if (window.matchMedia("(max-width: 820px)").matches) {
      triggerRef.current?.scrollIntoView({ block: "center", inline: "nearest" });
    }
    updatePlacement();
    setActiveIndex(focusIndex);
    setOpen(true);
    window.setTimeout(() => focusOption(focusIndex), 0);
  };

  const updatePlacement = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const viewportPadding = 12;
    const preferredHeight = 300;
    const isCompactViewport = window.matchMedia("(max-width: 820px)").matches;
    const spaceBelow = Math.max(72, window.innerHeight - rect.bottom - viewportPadding);
    const spaceAbove = Math.max(72, rect.top - viewportPadding);
    const nextPlacement = !isCompactViewport && spaceBelow < preferredHeight && spaceAbove > spaceBelow ? "up" : "down";
    setPlacement(nextPlacement);
    setMenuMaxHeight(Math.min(preferredHeight, nextPlacement === "up" ? spaceAbove : spaceBelow));
  };

  useEffect(() => {
    const handleClick = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("pointerdown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open]);

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (open && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      const option = options[activeIndex] || selected;
      onChange(option.value);
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = open ? (activeIndex + 1) % options.length : Math.min(selectedIndex + 1, options.length - 1);
      setActiveIndex(nextIndex);
      if (!open) openMenu(nextIndex);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = open ? (activeIndex <= 0 ? options.length - 1 : activeIndex - 1) : Math.max(selectedIndex - 1, 0);
      setActiveIndex(nextIndex);
      if (!open) openMenu(nextIndex);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu(selectedIndex);
    }
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']") || []);
    const currentIndex = buttons.findIndex((button) => button === document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = currentIndex + 1 >= buttons.length ? 0 : currentIndex + 1;
      setActiveIndex(nextIndex);
      focusOption(nextIndex);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1;
      setActiveIndex(nextIndex);
      focusOption(nextIndex);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      focusOption(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(buttons.length - 1);
      focusOption(buttons.length - 1);
    }
  };

  return (
    <div className={`custom-select ${open ? "open" : ""} ${open && placement === "up" ? "open-up" : ""}`} ref={rootRef}>
      <label id={labelId}>{label}</label>
      <button
        ref={triggerRef}
        type="button"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${selectId}-value`}
        aria-controls={open ? `${selectId}-menu` : undefined}
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            openMenu(selectedIndex);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span id={`${selectId}-value`}>{selected.label}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div
          id={`${selectId}-menu`}
          className="select-menu"
          role="listbox"
          aria-label={label}
          ref={menuRef}
          onKeyDown={handleMenuKeyDown}
          style={{ "--enemy-select-max-height": `${menuMaxHeight}px` } as CSSProperties}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              tabIndex={index === activeIndex ? 0 : -1}
              className={`${option.value === value ? "selected" : ""} ${index === activeIndex ? "active" : ""}`.trim()}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                triggerRef.current?.focus({ preventScroll: true });
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EnemyDetailModal({
  enemy,
  onClose,
  onOpenItem,
}: {
  enemy: EnrichedEnemy;
  onClose: () => void;
  onOpenItem: (name: string) => void;
}) {
  const dialogRef = useModalA11y<HTMLDivElement>(true, onClose);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="enemy-modal-overlay" onPointerDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div
        className="enemy-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enemy-detail-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="enemy-modal-header">
          <div className="modal-title-row">
            {enemy.imageUrl ? <img src={enemy.imageUrl} alt="" loading="lazy" decoding="async" /> : <Skull size={38} />}
            <div>
              <span>Enemy</span>
              <h2 id="enemy-detail-title">{enemy.name}</h2>
              <p>{enemy.locationName} - Level {enemy.level}</p>
            </div>
          </div>
          <button type="button" className="modal-close" aria-label="Close enemy details" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="enemy-modal-body">
          <section className="modal-stat-grid" aria-label={`${enemy.name} combat stats`}>
            <div><Shield size={16} /><span>Level</span><strong>{enemy.level}</strong></div>
            <div><Heart size={16} /><span>HP</span><strong>{enemy.health}</strong></div>
            <div><Sparkles size={16} /><span>EXP</span><strong>{enemy.experience}</strong></div>
            <div><Package size={16} /><span>Loot EV</span><strong>{formatGold(enemy.lootEv)}</strong></div>
          </section>

          <section className="detail-card weather-detail">
            <header>
              <span><Cloud size={15} /> Weather behavior</span>
              <strong className={`match-chip ${matchTone(enemy.currentWeatherMatch)}`}>
                {getWeatherPreferenceLabel(enemy.currentWeatherMatch)}
              </strong>
            </header>
            <p>
              Current weather at {enemy.locationName}: <strong>{enemy.currentWeather?.name || "Unknown"}</strong>.
              {" "}Next favorable window: <strong>{formatWindow(enemy)}</strong>.
            </p>
            <PreferencePills enemy={enemy} />
          </section>

          <section className="detail-card">
            <header>
              <span><Package size={15} /> Loot table</span>
              <strong>{enemy.lootCount} drops</strong>
            </header>
            <div className="loot-list">
              {enemy.loot.map((drop) => (
                <button
                  type="button"
                  key={`${enemy.name}-${drop.name}`}
                  onClick={() => onOpenItem(drop.name)}
                  className="loot-button"
                  aria-label={`Open item details for ${drop.name}, ${drop.chance}% drop rate${Number(drop.quantity || 1) > 1 ? `, quantity ${drop.quantity}` : ""}`}
                >
                  {drop.image_url ? <img src={drop.image_url} alt="" loading="lazy" decoding="async" /> : <Package size={20} />}
                  <span>
                    <strong>{drop.name}</strong>
                    <small>{drop.chance}% drop rate{Number(drop.quantity || 1) > 1 ? ` - x${drop.quantity}` : ""}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="detail-links">
            <Link href={`/map?location=${encodeURIComponent(enemy.locationKey)}`}><MapPin size={14} /> Map location <ExternalLink size={12} /></Link>
            <Link href={`/combat?search=${encodeURIComponent(enemy.name)}`}><Swords size={14} /> Combat details <ExternalLink size={12} /></Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function EnemiesContent() {
  const searchParams = useSearchParams();
  const { staticData, worldLocations, marketData, loading } = useData();
  const { openItemByName } = useItemModal();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("level");
  const [sortDesc, setSortDesc] = useState(false);
  const [selectedEnemy, setSelectedEnemy] = useState<EnrichedEnemy | null>(null);
  const [weatherNow, setWeatherNow] = useState(() => Date.now());
  const [isCompactViewport, setIsCompactViewport] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => setWeatherNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const syncViewport = () => setIsCompactViewport(media.matches);
    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  const enemies = useMemo(() => buildEnrichedEnemies({ staticData, worldLocations, marketData, now: weatherNow }), [marketData, staticData, weatherNow, worldLocations]);

  useEffect(() => {
    setQuery(searchParams.get("search") ?? "");
    setSelectedLocation(searchParams.get("location") ?? "all");
  }, [searchParams]);

  const locationOptions = useMemo<Option<string>[]>(() => {
    const locations = Array.from(new Map(enemies.map((enemy) => [enemy.locationKey, enemy.locationName])).entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
    return [{ value: "all", label: "All locations" }, ...locations];
  }, [enemies]);

  const filteredEnemies = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const rows = enemies.filter((enemy) => {
      if (selectedLocation !== "all" && enemy.locationKey !== selectedLocation) return false;
      if (!enemyMatchesFilter(enemy, matchFilter)) return false;
      if (!levelMatches(enemy, levelFilter)) return false;
      if (!normalizedQuery) return true;
      return enemy.searchText.includes(normalizedQuery);
    });

    rows.sort((a, b) => {
      let result = 0;
      if (sortKey === "name") result = a.name.localeCompare(b.name);
      else if (sortKey === "location") result = a.locationName.localeCompare(b.locationName) || compareEnemiesByProgression(a, b);
      else if (sortKey === "lootCount") result = a.lootCount - b.lootCount;
      else if (sortKey === "lootEv") result = a.lootEv - b.lootEv;
      else result = compareEnemiesByProgression(a, b);
      return sortDesc ? -result : result;
    });

    return rows;
  }, [deferredQuery, enemies, levelFilter, matchFilter, selectedLocation, sortDesc, sortKey]);

  const stats = useMemo(() => ({
    enemies: enemies.length,
    locations: new Set(enemies.map((enemy) => enemy.locationKey)).size,
    favored: enemies.filter((enemy) => isFavorableWeather(enemy.currentWeatherMatch)).length,
    penalized: enemies.filter((enemy) => isPenalizedWeather(enemy.currentWeatherMatch)).length,
  }), [enemies]);
  const activeFilterCount = [
    query.trim().length > 0,
    selectedLocation !== "all",
    matchFilter !== "all",
    levelFilter !== "all",
  ].filter(Boolean).length;
  const hasCustomSort = sortKey !== "level" || sortDesc;
  const hasActiveControls = activeFilterCount > 0 || hasCustomSort;
  const resetControls = () => {
    setQuery("");
    setSelectedLocation("all");
    setMatchFilter("all");
    setLevelFilter("all");
    setSortKey("level");
    setSortDesc(false);
  };

  return (
    <main className="enemy-db-page">
      <div className="enemy-page-shell" inert={selectedEnemy ? true : undefined} aria-hidden={selectedEnemy ? true : undefined}>
        <header className="enemy-hero">
          <div>
            <h1><ZenithIcon name="enemy" size={24} /> Enemy Database</h1>
            <p>Search enemies by location, drops, levels, and current weather matchups.</p>
          </div>
          <div className="hero-meta">
            <span>{stats.enemies.toLocaleString()} enemies</span>
            <small>{ENEMY_WEATHER_META.confirmed_count.toLocaleString()} weather profiles</small>
          </div>
        </header>

        <section className="enemy-summary" aria-label="Enemy database summary">
          <div><MapPin size={16} /><span>Locations</span><strong>{stats.locations}</strong></div>
          <div><Cloud size={16} /><span>Favored now</span><strong>{stats.favored}</strong></div>
          <div><Shield size={16} /><span>Penalized now</span><strong>{stats.penalized}</strong></div>
          <div><Package size={16} /><span>Shown</span><strong>{filteredEnemies.length}</strong></div>
        </section>

        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {filteredEnemies.length === 0
            ? "No enemies match the current filters."
            : `${filteredEnemies.length} enemy${filteredEnemies.length === 1 ? "" : "ies"} shown.`}
        </div>

        <section className="enemy-controls" aria-label="Enemy filters">
          <div className="controls-heading">
            <span><SlidersHorizontal size={15} aria-hidden="true" /> Filters</span>
            <small>
              {activeFilterCount > 0
                ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`
                : `${filteredEnemies.length.toLocaleString()} visible`}
            </small>
            <button type="button" onClick={resetControls} disabled={!hasActiveControls} aria-label="Reset enemy filters and sorting">
              <RotateCcw size={14} aria-hidden="true" />
              Reset
            </button>
          </div>
          <label className="search-control">
            <span>Search</span>
            <div>
              <span className="search-icon" aria-hidden="true">
                <Search size={16} />
              </span>
              <input
                aria-label="Search enemies, locations, drops, or weather"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Enemy, location, drop, weather..."
              />
            </div>
          </label>
          <details className="enemy-filter-panel" open={!isCompactViewport ? true : undefined}>
            <summary tabIndex={0}>
              <span><SlidersHorizontal size={15} aria-hidden="true" /> Tactical filters</span>
              <small>{activeFilterCount > 0 || hasCustomSort ? "Customized" : "Default"}</small>
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <div className="enemy-filter-grid">
              <CustomSelect label="Location" value={selectedLocation} options={locationOptions} onChange={setSelectedLocation} />
              <CustomSelect label="Weather" value={matchFilter} options={MATCH_OPTIONS} onChange={setMatchFilter} />
              <CustomSelect label="Level" value={levelFilter} options={LEVEL_OPTIONS} onChange={setLevelFilter} />
              <CustomSelect label="Sort" value={sortKey} options={SORT_OPTIONS} onChange={setSortKey} />
              <button
                type="button"
                className="sort-direction"
                aria-pressed={sortDesc}
                aria-label={`Change sort direction, currently ${sortDesc ? "descending" : "ascending"}`}
                onClick={() => setSortDesc((prev) => !prev)}
              >
                <ArrowDownUp size={16} />
                {sortDesc ? "Desc" : "Asc"}
              </button>
            </div>
          </details>
        </section>

        {loading && enemies.length === 0 ? (
          <LoadingState
            title="Loading enemy intelligence"
            description="Preparing enemies, drops, locations, and current weather windows."
          />
        ) : (
          <section className="enemy-grid" aria-label="Enemy results">
            {filteredEnemies.map((enemy) => (
              <button
                key={`${enemy.locationKey}-${enemy.name}`}
                type="button"
                className={`enemy-card ${matchTone(enemy.currentWeatherMatch)}`}
                onClick={() => setSelectedEnemy(enemy)}
                aria-label={getEnemyCardLabel(enemy)}
              >
                <span className="enemy-card-art">
                  {enemy.imageUrl ? <img src={enemy.imageUrl} alt="" loading="lazy" decoding="async" /> : <Skull size={28} />}
                </span>
                <span className="enemy-card-main">
                  <span className="enemy-title-row">
                    <strong>{enemy.name}</strong>
                    <em>Lv.{enemy.level}</em>
                  </span>
                  <small>{enemy.locationName}</small>
                  <span className={`match-chip ${matchTone(enemy.currentWeatherMatch)}`}>
                    {enemy.currentWeather?.name || "Unknown"}: {getWeatherPreferenceLabel(enemy.currentWeatherMatch)}
                  </span>
                  <span className="enemy-card-window">
                    <Cloud size={13} aria-hidden="true" />
                    {formatWindow(enemy)}
                  </span>
                </span>
                <span className="enemy-card-stats">
                  <span>{enemy.lootCount} drops</span>
                  <strong>{formatGold(enemy.lootEv)}</strong>
                </span>
              </button>
            ))}
            {filteredEnemies.length === 0 && (
              <NoResultsState
                title="No enemies match the current filters"
                description="Clear search, weather, level, or sort controls to widen the enemy list."
                action={hasActiveControls ? (
                  <button type="button" onClick={resetControls}>
                    <RotateCcw size={14} aria-hidden="true" />
                    Clear filters
                  </button>
                ) : null}
              />
            )}
          </section>
        )}
      </div>

      {selectedEnemy && (
        <EnemyDetailModal
          enemy={selectedEnemy}
          onClose={() => setSelectedEnemy(null)}
          onOpenItem={(name) => {
            setSelectedEnemy(null);
            openItemByName(name);
          }}
        />
      )}

      <style jsx>{`
        .enemy-db-page {
          min-height: calc(100vh - 40px);
          padding: clamp(0.85rem, 1.6vw, 1.5rem);
          overflow-x: hidden;
          isolation: isolate;
          background:
            radial-gradient(circle at 80% 0%, rgba(45, 212, 191, 0.12), transparent 28rem),
            radial-gradient(circle at 10% 12%, rgba(168, 85, 247, 0.1), transparent 24rem),
            var(--bg-base);
        }
        .enemy-db-page,
        .enemy-db-page * {
          box-sizing: border-box;
        }
        .enemy-db-page :where(button, a, input, summary):focus-visible {
          outline: 2px solid var(--border-focus);
          outline-offset: 2px;
        }
        .enemy-hero {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: center;
          max-width: 1480px;
          margin: 0 auto 0.8rem;
          padding-bottom: 0.8rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          animation: enemySurfaceIn 0.34s cubic-bezier(0.2, 0.72, 0.22, 1) both;
        }
        .enemy-hero h1 {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          color: #fff;
          font-size: clamp(1.9rem, 3vw, 2.8rem);
          line-height: 1;
        }
        .enemy-hero h1 :global(svg) {
          color: var(--text-accent);
          flex: 0 0 auto;
        }
        .enemy-hero p {
          margin-top: 0.45rem;
          color: var(--text-muted);
          font-size: 0.95rem;
        }
        .hero-meta {
          display: grid;
          justify-items: end;
          gap: 0.1rem;
          flex: 0 0 auto;
          border: 1px solid rgba(45, 212, 191, 0.22);
          border-radius: 999px;
          background: rgba(45, 212, 191, 0.08);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 14px 34px rgba(0,0,0,0.24);
          padding: 0.55rem 0.85rem;
          transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease;
        }
        .hero-meta:hover {
          border-color: rgba(45, 212, 191, 0.38);
          background: rgba(45, 212, 191, 0.12);
          transform: translateY(-1px);
        }
        .hero-meta span {
          color: var(--text-accent);
          display: block;
          font-family: var(--font-mono);
          font-weight: 900;
        }
        .hero-meta small {
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 850;
        }
        .enemy-controls {
          display: grid;
          grid-template-columns: minmax(240px, 1.35fr) repeat(4, minmax(126px, 0.8fr)) minmax(92px, 0.45fr);
          gap: 0.65rem;
          align-items: end;
          max-width: 1480px;
          margin: 0 auto 0.85rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(10, 10, 13, 0.76);
          box-shadow: 0 18px 48px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04);
          backdrop-filter: blur(18px) saturate(1.08);
          -webkit-backdrop-filter: blur(18px) saturate(1.08);
          padding: 0.75rem;
          position: relative;
          z-index: 20;
          animation: enemySurfaceIn 0.34s cubic-bezier(0.2, 0.72, 0.22, 1) both;
          animation-delay: 0.04s;
        }
        .controls-heading {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
          padding-bottom: 0.25rem;
        }
        .controls-heading > span {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: #fff;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0;
          text-transform: uppercase;
        }
        .controls-heading > span :global(svg) {
          color: var(--text-accent);
        }
        .controls-heading small {
          min-width: 0;
          color: var(--text-muted);
          font-size: 0.76rem;
          font-weight: 850;
        }
        .controls-heading button {
          display: inline-flex;
          align-items: center;
          gap: 0.38rem;
          min-height: 32px;
          margin-left: auto;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 7px;
          background: rgba(255,255,255,0.035);
          color: #fff;
          cursor: pointer;
          font: inherit;
          font-size: 0.78rem;
          font-weight: 900;
          padding: 0 0.6rem;
          transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease, opacity 0.16s ease;
        }
        .controls-heading button:disabled {
          cursor: default;
          opacity: 0.45;
        }
        .controls-heading button:not(:disabled):hover {
          border-color: rgba(56,189,248,0.35);
          background: rgba(56,189,248,0.1);
        }
        .controls-heading button:not(:disabled):active {
          transform: translateY(1px);
        }
        .enemy-filter-panel {
          grid-column: span 5;
          min-width: 0;
        }
        .enemy-filter-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(126px, 1fr)) minmax(92px, 0.45fr);
          gap: 0.65rem;
          align-items: end;
          min-width: 0;
        }
        .enemy-filter-panel summary {
          display: none;
        }
        .search-control,
        :global(.custom-select) {
          position: relative;
          display: grid;
          gap: 0.35rem;
          min-width: 0;
        }
        :global(.custom-select.open) {
          z-index: 120;
        }
        .search-control > span,
        :global(.custom-select label) {
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .search-control div {
          display: flex;
          align-items: center;
          min-height: 40px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(0,0,0,0.42);
          overflow: hidden;
          transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
        }
        .search-icon {
          display: grid;
          place-items: center;
          align-self: stretch;
          flex: 0 0 auto;
          width: 2.25rem;
          color: var(--text-muted);
          pointer-events: none;
        }
        .search-icon :global(svg) {
          display: block;
        }
        :global(.select-trigger),
        .sort-direction {
          width: 100%;
          min-height: 40px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(0,0,0,0.42);
          color: #fff;
          font: inherit;
          font-weight: 850;
          transition: border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
        }
        .search-control input {
          min-width: 0;
          width: 100%;
          min-height: 38px;
          border: 0;
          background: transparent;
          color: #fff;
          font: inherit;
          font-weight: 850;
          padding: 0 0.75rem 0 0;
          outline: none;
        }
        .search-control div:focus-within {
          border-color: rgba(176, 130, 255, 0.56);
          box-shadow: 0 0 0 3px rgba(176, 130, 255, 0.12);
        }
        :global(.select-trigger),
        .sort-direction {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0 0.65rem;
        }
        :global(.select-trigger:hover),
        .sort-direction:hover {
          border-color: rgba(255,255,255,0.14);
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.018)), rgba(0,0,0,0.42);
        }
        :global(.select-trigger:active),
        .sort-direction:active {
          transform: translateY(1px);
        }
        :global(.custom-select.open .select-trigger),
        :global(.select-trigger:focus-visible),
        .sort-direction:focus-visible {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(56,189,248,0.12);
          outline: none;
        }
        :global(.select-trigger span) {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.select-trigger svg) {
          color: var(--text-muted);
          flex: 0 0 auto;
          transition: transform 0.16s ease, color 0.16s ease;
        }
        :global(.custom-select.open .select-trigger svg) {
          color: var(--text-accent);
          transform: rotate(180deg);
        }
        :global(.select-menu) {
          position: absolute;
          top: calc(100% + 0.35rem);
          left: 0;
          right: 0;
          z-index: 130;
          display: grid;
          max-height: min(var(--enemy-select-max-height, 300px), 58vh);
          overflow: auto;
          overscroll-behavior: contain;
          border: 1px solid var(--border-focus);
          border-radius: 8px;
          background: color-mix(in srgb, var(--bg-base), black 18%);
          box-shadow: 0 18px 46px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.08);
          padding: 0.3rem;
          transform-origin: top center;
          animation: enemyMenuReveal 0.16s ease-out both;
        }
        :global(.custom-select.open-up .select-menu) {
          bottom: calc(100% + 0.35rem);
          top: auto;
          transform-origin: bottom center;
        }
        :global(.select-menu button) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.65rem;
          min-height: 40px;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          font: inherit;
          font-weight: 850;
          text-align: left;
          padding: 0 0.6rem;
          transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
        }
        :global(.select-menu button span) {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.select-menu button svg) {
          color: var(--text-accent);
          flex: 0 0 auto;
        }
        :global(.select-menu button:hover),
        :global(.select-menu button.selected),
        :global(.select-menu button.active) {
          background: color-mix(in srgb, var(--text-accent), transparent 84%);
          border-color: rgba(56,189,248,0.24);
          color: #fff;
        }
        :global(.select-menu button:active) {
          transform: scale(0.99);
        }
        .enemy-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.55rem;
          max-width: 1480px;
          margin: 0 auto 0.75rem;
          position: relative;
          z-index: 1;
          animation: enemySurfaceIn 0.34s cubic-bezier(0.2, 0.72, 0.22, 1) both;
          animation-delay: 0.02s;
        }
        .enemy-summary div {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 0.55rem;
          align-items: center;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 7px;
          background: rgba(255,255,255,0.035);
          padding: 0.62rem 0.7rem;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.035);
          transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease;
        }
        .enemy-summary div:hover {
          border-color: rgba(56,189,248,0.18);
          background: rgba(255,255,255,0.048);
          transform: translateY(-1px);
        }
        .enemy-summary span {
          color: var(--text-muted);
          font-weight: 850;
        }
        .enemy-summary strong {
          color: #fff;
          font-family: var(--font-mono);
        }
        .enemy-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: 0.75rem;
          max-width: 1480px;
          margin: 0 auto;
          position: relative;
          z-index: 0;
          animation: enemySurfaceIn 0.34s cubic-bezier(0.2, 0.72, 0.22, 1) both;
          animation-delay: 0.08s;
        }
        .enemy-card {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          display: grid;
          grid-template-columns: 52px minmax(0, 1fr) auto;
          gap: 0.65rem;
          align-items: center;
          min-width: 0;
          min-height: 82px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015));
          color: inherit;
          cursor: pointer;
          padding: 0.66rem;
          text-align: left;
          box-shadow: 0 16px 38px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.04);
          transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
        }
        .enemy-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 3px;
          background: var(--text-muted);
          opacity: 0.48;
          z-index: -1;
        }
        .enemy-card.good::before {
          background: #5eead4;
          box-shadow: 0 0 26px rgba(45, 212, 191, 0.38);
        }
        .enemy-card.bad::before {
          background: #f87171;
          box-shadow: 0 0 26px rgba(248, 113, 113, 0.28);
        }
        .enemy-card.neutral::before {
          background: #d1d5db;
        }
        .enemy-card.muted::before {
          opacity: 0.28;
        }
        .enemy-card::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -2;
          background: radial-gradient(circle at 18% 0%, rgba(56,189,248,0.08), transparent 16rem);
          opacity: 0;
          transition: opacity 0.18s ease;
        }
        .enemy-card:hover,
        .enemy-card:focus-visible {
          border-color: var(--border-focus);
          background: color-mix(in srgb, var(--text-accent), transparent 92%);
          box-shadow: 0 20px 48px rgba(0,0,0,0.24), 0 0 0 1px rgba(56,189,248,0.1), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .enemy-card:hover::after,
        .enemy-card:focus-visible::after {
          opacity: 1;
        }
        .enemy-card:active {
          transform: translateY(1px) scale(0.995);
        }
        @media (hover: hover) and (pointer: fine) {
          .enemy-card:hover,
          .enemy-card:focus-visible {
            transform: translateY(-2px);
          }
        }
        .enemy-card-art {
          display: grid;
          place-items: center;
          width: 52px;
          height: 52px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 9px;
          background: rgba(0,0,0,0.25);
        }
        .enemy-card-art img {
          width: 42px;
          height: 42px;
          object-fit: contain;
        }
        .enemy-card-main {
          display: grid;
          gap: 0.28rem;
          min-width: 0;
        }
        .enemy-title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 0;
        }
        .enemy-title-row strong {
          min-width: 0;
          color: #fff;
          display: -webkit-box;
          font-size: 1rem;
          line-height: 1.18;
          overflow: hidden;
          text-overflow: ellipsis;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
        .enemy-title-row em {
          flex: 0 0 auto;
          color: var(--text-accent);
          font-family: var(--font-mono);
          font-style: normal;
          font-weight: 900;
        }
        .enemy-card-main small {
          color: var(--text-muted);
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .match-chip {
          justify-self: start;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          background: rgba(255,255,255,0.045);
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 900;
          padding: 0.26rem 0.52rem;
        }
        .match-chip.good {
          border-color: rgba(45, 212, 191, 0.3);
          background: rgba(45, 212, 191, 0.09);
          color: #5eead4;
        }
        .match-chip.bad {
          border-color: rgba(248, 113, 113, 0.28);
          background: rgba(248, 113, 113, 0.09);
          color: #fca5a5;
        }
        .match-chip.neutral {
          color: #d1d5db;
        }
        .enemy-card-stats {
          display: grid;
          justify-items: end;
          gap: 0.35rem;
          white-space: nowrap;
        }
        .enemy-card-stats span {
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 850;
        }
        .enemy-card-stats strong {
          color: var(--text-success);
          font-family: var(--font-mono);
        }
        .enemy-card-window {
          display: inline-flex;
          align-items: center;
          gap: 0.34rem;
          min-width: 0;
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 850;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .enemy-card-window :global(svg) {
          color: var(--text-accent);
          flex: 0 0 auto;
        }
        .enemy-empty {
          display: grid;
          justify-items: center;
          gap: 0.85rem;
          grid-column: 1 / -1;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          background: rgba(255,255,255,0.035);
          color: var(--text-muted);
          font-weight: 850;
          padding: 1.5rem;
          text-align: center;
        }
        .enemy-empty button {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          min-height: 38px;
          border: 1px solid rgba(56,189,248,0.26);
          border-radius: 7px;
          background: rgba(56,189,248,0.1);
          color: #fff;
          cursor: pointer;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 900;
          padding: 0 0.75rem;
          transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
        }
        .enemy-empty button:hover {
          border-color: rgba(56,189,248,0.42);
          background: rgba(56,189,248,0.16);
        }
        .enemy-empty button:active {
          transform: translateY(1px);
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        :global(.enemy-modal-overlay) {
          position: fixed;
          inset: 0;
          z-index: 7000;
          display: grid;
          place-items: center;
          background: rgba(0,0,0,0.84);
          backdrop-filter: blur(16px) saturate(0.72);
          -webkit-backdrop-filter: blur(16px) saturate(0.72);
          padding: 1rem;
          animation: enemyBackdropIn 0.18s ease-out both;
        }
        :global(.enemy-modal) {
          width: min(100%, 940px);
          max-height: min(90vh, 820px);
          overflow: auto;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          background:
            radial-gradient(circle at 18% 0%, rgba(56,189,248,0.08), transparent 24rem),
            #10131a;
          box-shadow: 0 28px 90px rgba(0,0,0,0.64), inset 0 1px 0 rgba(255,255,255,0.05);
          animation: enemyModalIn 0.2s cubic-bezier(0.2, 0.72, 0.22, 1) both;
        }
        :global(.enemy-modal-header) {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 1rem;
        }
        :global(.modal-title-row) {
          display: flex;
          gap: 0.85rem;
          align-items: center;
          min-width: 0;
        }
        :global(.modal-title-row img) {
          width: 56px;
          height: 56px;
          object-fit: contain;
        }
        :global(.modal-title-row span) {
          color: var(--text-accent);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        :global(.modal-title-row h2) {
          color: #fff;
          font-size: 1.55rem;
          line-height: 1.1;
        }
        :global(.modal-title-row p) {
          margin-top: 0.15rem;
          color: var(--text-muted);
        }
        :global(.modal-close) {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          color: #fff;
          cursor: pointer;
          transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
        }
        :global(.modal-close:hover) {
          border-color: rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.08);
        }
        :global(.modal-close:active) {
          transform: translateY(1px);
        }
        :global(.enemy-modal-body) {
          display: grid;
          gap: 0.8rem;
          padding: 1rem;
        }
        :global(.modal-stat-grid) {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.6rem;
        }
        :global(.modal-stat-grid div) {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 0.4rem 0.55rem;
          align-items: center;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(255,255,255,0.035);
          padding: 0.75rem;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.035);
        }
        :global(.modal-stat-grid strong) {
          grid-column: 1 / -1;
          color: #fff;
          font-family: var(--font-mono);
        }
        :global(.modal-stat-grid span) {
          color: var(--text-muted);
          font-weight: 850;
        }
        :global(.detail-card) {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          background: rgba(255,255,255,0.025);
          padding: 0.85rem;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.035);
        }
        :global(.detail-card header) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.65rem;
        }
        :global(.detail-card header span) {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--text-accent);
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        :global(.detail-card p) {
          color: var(--text-muted);
          line-height: 1.5;
        }
        :global(.detail-card p strong) {
          color: #fff;
        }
        :global(.preference-pills) {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 0.75rem;
        }
        :global(.preference-pill) {
          display: inline-flex;
          gap: 0.4rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          color: var(--text-muted);
          font-size: 0.76rem;
          font-weight: 850;
          padding: 0.34rem 0.58rem;
        }
        :global(.preference-pill strong) {
          color: #fff;
        }
        :global(.preference-pill.good) {
          border-color: rgba(45, 212, 191, 0.24);
          background: rgba(45, 212, 191, 0.08);
        }
        :global(.preference-pill.bad) {
          border-color: rgba(248, 113, 113, 0.24);
          background: rgba(248, 113, 113, 0.08);
        }
        :global(.loot-list) {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0.5rem;
        }
        :global(.loot-button) {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 0.55rem;
          align-items: center;
          min-height: 56px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(0,0,0,0.18);
          color: inherit;
          cursor: pointer;
          padding: 0.5rem;
          text-align: left;
          transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease;
        }
        :global(.loot-button:hover),
        :global(.loot-button:focus-visible) {
          border-color: var(--border-focus);
          background: rgba(56,189,248,0.08);
        }
        :global(.loot-button:active) {
          transform: translateY(1px);
        }
        :global(.loot-button img) {
          width: 34px;
          height: 34px;
          object-fit: contain;
        }
        :global(.loot-button span) {
          display: grid;
          gap: 0.12rem;
          min-width: 0;
        }
        :global(.loot-button strong) {
          min-width: 0;
          overflow: hidden;
          color: #fff;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.loot-button small) {
          color: var(--text-muted);
          font-weight: 800;
        }
        :global(.detail-links) {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.5rem;
        }
        :global(.detail-links a) {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          min-height: 44px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(255,255,255,0.035);
          color: #fff;
          font-weight: 850;
          text-decoration: none;
          transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease;
        }
        :global(.detail-links a:hover),
        :global(.detail-links a:focus-visible) {
          border-color: var(--border-focus);
          background: rgba(56,189,248,0.08);
        }
        :global(.detail-links a:active) {
          transform: translateY(1px);
        }
        .empty-inline {
          color: var(--text-muted);
          font-weight: 850;
        }
        @keyframes enemySurfaceIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes enemyMenuReveal {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes enemyBackdropIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes enemyModalIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .enemy-hero,
          .enemy-summary,
          .enemy-controls,
          .enemy-grid,
          :global(.select-menu),
          :global(.enemy-modal-overlay),
          :global(.enemy-modal) {
            animation: none !important;
          }
          .hero-meta,
          .controls-heading button,
          .search-control div,
          :global(.select-trigger),
          .sort-direction,
          :global(.select-trigger svg),
          :global(.select-menu button),
          .enemy-summary div,
          .enemy-card,
          .enemy-card::after,
          .enemy-empty button,
          :global(.modal-close),
          :global(.loot-button),
          :global(.detail-links a) {
            transition: none !important;
          }
          .hero-meta:hover,
          .controls-heading button:active,
          :global(.select-trigger:active),
          .sort-direction:active,
          :global(.select-menu button:active),
          .enemy-summary div:hover,
          .enemy-card:hover,
          .enemy-card:focus-visible,
          .enemy-card:active,
          .enemy-empty button:active,
          :global(.modal-close:active),
          :global(.loot-button:active),
          :global(.detail-links a:active) {
            transform: none !important;
          }
        }
        @media (max-width: 1360px) {
          .enemy-controls {
            grid-template-columns: minmax(240px, 1.35fr) repeat(4, minmax(120px, 0.8fr)) minmax(88px, 0.45fr);
          }
          .enemy-filter-grid {
            grid-template-columns: repeat(4, minmax(120px, 1fr)) minmax(88px, 0.45fr);
          }
        }
        @media (max-width: 900px) {
          .enemy-controls {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .enemy-filter-panel {
            grid-column: 1 / -1;
          }
          .enemy-filter-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .search-control,
          .sort-direction {
            grid-column: span 3;
          }
          .controls-heading {
            grid-column: 1 / -1;
          }
          .enemy-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 720px) {
          .enemy-db-page {
            padding: 0.8rem;
          }
          .enemy-hero,
          :global(.modal-stat-grid),
          :global(.detail-links) {
            grid-template-columns: 1fr;
          }
          .enemy-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .enemy-summary div {
            grid-template-columns: auto minmax(0, 1fr);
            gap: 0.3rem 0.45rem;
            padding: 0.55rem 0.6rem;
          }
          .enemy-summary strong {
            grid-column: 1 / -1;
          }
          .enemy-hero {
            align-items: flex-start;
            flex-direction: column;
          }
          .enemy-hero h1 {
            font-size: clamp(1.55rem, 8vw, 2rem);
          }
          .hero-meta {
            justify-items: start;
          }
          .controls-heading {
            align-items: flex-start;
            flex-wrap: wrap;
          }
          .controls-heading small {
            flex: 1 1 auto;
          }
          .enemy-controls {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .search-control {
            grid-column: 1 / -1;
          }
          .enemy-filter-panel {
            display: block;
            grid-column: 1 / -1;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            background: rgba(255,255,255,0.025);
            overflow: visible;
          }
          .enemy-filter-panel summary {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto auto;
            align-items: center;
            gap: 0.55rem;
            min-height: 42px;
            color: #fff;
            cursor: pointer;
            font-size: 0.82rem;
            font-weight: 900;
            list-style: none;
            padding: 0.55rem 0.65rem;
          }
          .enemy-filter-panel summary::-webkit-details-marker {
            display: none;
          }
          .enemy-filter-panel summary span {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            min-width: 0;
          }
          .enemy-filter-panel summary span :global(svg) {
            color: var(--text-accent);
            flex: 0 0 auto;
          }
          .enemy-filter-panel summary small {
            color: var(--text-muted);
            font-size: 0.72rem;
            font-weight: 850;
          }
          .enemy-filter-panel summary > :global(svg) {
            color: var(--text-muted);
            transition: transform 0.16s ease, color 0.16s ease;
          }
          .enemy-filter-panel[open] summary > :global(svg) {
            color: var(--text-accent);
            transform: rotate(180deg);
          }
          .enemy-filter-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.6rem;
            border-top: 1px solid rgba(255,255,255,0.07);
            padding: 0.65rem;
          }
          .sort-direction {
            grid-column: auto;
          }
          .enemy-controls {
            padding: 0.7rem;
          }
          .enemy-grid {
            grid-template-columns: 1fr;
          }
          .enemy-card {
            grid-template-columns: 48px minmax(0, 1fr);
            min-height: 76px;
          }
          .enemy-card-art {
            width: 48px;
            height: 48px;
          }
          .enemy-card-art img {
            width: 38px;
            height: 38px;
          }
          .enemy-card-stats {
            grid-column: 1 / -1;
            display: flex;
            justify-content: space-between;
          }
          :global(.enemy-modal-overlay) {
            align-items: stretch;
            padding: 0.6rem;
          }
          :global(.enemy-modal) {
            max-height: calc(100vh - 1.2rem);
          }
          :global(.enemy-modal-header) {
            position: sticky;
            top: 0;
            z-index: 2;
            background: #10131a;
          }
          :global(.loot-list) {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 520px) {
          .enemy-controls {
            grid-template-columns: 1fr;
          }
          .sort-direction {
            grid-column: 1 / -1;
          }
          .enemy-filter-grid {
            grid-template-columns: 1fr;
          }
          .controls-heading {
            align-items: center;
            flex-wrap: nowrap;
          }
          .controls-heading small {
            display: none;
          }
          .controls-heading button {
            width: auto;
            justify-content: center;
            margin-left: auto;
          }
          .enemy-summary {
            gap: 0.45rem;
          }
          .enemy-card {
            gap: 0.55rem;
            padding: 0.62rem;
          }
          .enemy-title-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 0.18rem;
          }
          :global(.select-menu) {
            max-height: min(var(--enemy-select-max-height, 300px), 44vh);
          }
        }
      `}</style>
    </main>
  );
}

export default function EnemiesPage() {
  return (
    <Suspense fallback={<main className="enemy-db-page"><div className="enemy-empty">Loading enemy database...</div></main>}>
      <EnemiesContent />
    </Suspense>
  );
}
