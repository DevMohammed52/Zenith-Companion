import React, { type ReactNode, type RefObject } from "react";
import Link from "next/link";
import {
  Box,
  CalendarDays,
  Castle,
  ChevronDown,
  Crosshair,
  ExternalLink,
  Package,
  Skull,
  Swords,
} from "lucide-react";
import { GATHERED_RESOURCE_SOURCE_NOTE } from "@/lib/locations";
import type { EnrichedEnemy } from "@/lib/world-intelligence";
import {
  formatChance,
  formatCount,
  formatGold,
  formatWindow,
  getForecastEnemyCrosscheck,
  getSourceKind,
  weatherIcon,
  WEATHER_COLORS,
  type DropSummary,
  type ForecastWeather,
  type MapLocation,
} from "../types";

function ForecastEnemyGroup({
  label,
  enemies,
  tone,
}: {
  label: string;
  enemies: EnrichedEnemy[];
  tone: "favored" | "neutral" | "penalized";
}) {
  return (
    <div className={`forecast-enemy-group ${tone}`}>
      <strong>
        {label}
        <span>{enemies.length}</span>
      </strong>
      <div className="forecast-enemy-list">
        {enemies.length === 0 ? (
          <span className="forecast-none">None mapped</span>
        ) : (
          enemies.slice(0, 4).map((enemy) => (
            <Link
              className="forecast-enemy-chip"
              href={`/enemies?search=${encodeURIComponent(enemy.name)}`}
              key={`${tone}-${enemy.name}`}
            >
              {enemy.imageUrl ? <img src={enemy.imageUrl} alt="" loading="lazy" decoding="async" /> : <Swords size={13} />}
              <span>{enemy.name}</span>
            </Link>
          ))
        )}
        {enemies.length > 4 && <span className="forecast-more">+{enemies.length - 4} more</span>}
      </div>
    </div>
  );
}

function SourceColumn({
  title,
  icon,
  rows,
  hrefBase,
}: {
  title: string;
  icon: ReactNode;
  rows: any[];
  hrefBase: "/enemies" | "/dungeons" | "/bosses";
}) {
  const sourceKind = getSourceKind(title);
  return (
    <div className="source-column">
      <h3>{icon} {title}</h3>
      <div className="source-stack">
        {rows.slice(0, 8).map((row) => (
          <Link
            key={`${title}-${row.id || row.name}`}
            href={`${hrefBase}?search=${encodeURIComponent(row.name)}`}
            className="source-card"
            aria-label={`${row.name}, ${row.level ? `level ${row.level}` : row.difficulty ? `difficulty ${row.difficulty}` : row.status || "source"} ${sourceKind}`}
          >
            <span>
              <strong>{row.name}</strong>
              <small>{row.level ? `Level ${row.level}` : row.difficulty ? `Difficulty ${row.difficulty}` : row.status || "Source"}</small>
            </span>
            <ExternalLink size={13} />
          </Link>
        ))}
        {rows.length === 0 && <p className="muted-empty">No entries found.</p>}
      </div>
    </div>
  );
}

export function IntelGrid({
  intelRef,
  selectedLocation,
  selectedVisibleDrops,
  selectedWeatherTimeline,
  activeForecastKey,
  setActiveForecastKey,
  openItemByName,
}: {
  intelRef: RefObject<HTMLElement | null>;
  selectedLocation: MapLocation;
  selectedVisibleDrops: DropSummary[];
  selectedWeatherTimeline: ForecastWeather[];
  activeForecastKey: string | null;
  setActiveForecastKey: (key: string | null) => void;
  openItemByName: (name: string) => void;
}) {
  return (
    <section className="intel-grid" ref={intelRef} aria-label={`${selectedLocation.name} source intelligence`}>
      <div className="intel-section source-list">
        <header>
          <span><Crosshair size={15} /> Regional Sources</span>
          <strong>{selectedLocation.name}</strong>
        </header>
        <div className="source-columns">
          <SourceColumn title="Enemies" icon={<Swords size={15} />} rows={selectedLocation.enemies} hrefBase="/enemies" />
          <SourceColumn title="Dungeons" icon={<Castle size={15} />} rows={selectedLocation.dungeons} hrefBase="/dungeons" />
          <SourceColumn title="Bosses" icon={<Skull size={15} />} rows={selectedLocation.bosses} hrefBase="/bosses" />
        </div>
      </div>

      <div className="intel-section drop-board">
        <header>
          <span><Box size={15} /> Loot Drops</span>
          <strong>{formatCount(selectedLocation.drops.length, "drop")}</strong>
        </header>
        <div className="drop-grid">
          {selectedVisibleDrops.map((drop) => (
            <button
              type="button"
              key={drop.name}
              onClick={() => openItemByName(drop.name)}
              className="drop-chip"
              aria-label={`${drop.name}, ${formatGold(drop.marketValue)}, ${formatCount(drop.count, "source")}${formatChance(drop.bestChance) ? `, ${formatChance(drop.bestChance)}` : ""}`}
            >
              {drop.imageUrl ? <img src={drop.imageUrl} alt="" loading="lazy" decoding="async" /> : <Package size={18} />}
              <span className="drop-copy">
                <span className="drop-name">{drop.name}</span>
                <small>{formatCount(drop.count, "source")}{formatChance(drop.bestChance) ? ` - ${formatChance(drop.bestChance)}` : ""}</small>
              </span>
              <strong>{formatGold(drop.marketValue)}</strong>
            </button>
          ))}
          {selectedLocation.drops.length === 0 && (
            <p className="muted-empty">No confirmed combat, dungeon, or boss loot drops for this location yet.</p>
          )}
        </div>
        {selectedLocation.drops.length > selectedVisibleDrops.length && (
          <p className="board-note">
            Showing {selectedVisibleDrops.length.toLocaleString()} of {selectedLocation.drops.length.toLocaleString()} mapped drops. Use search to narrow the list.
          </p>
        )}
      </div>

      <div className="intel-section resource-board">
        <header>
          <span><Package size={15} /> Gathered Resources</span>
          <strong>{formatCount(selectedLocation.resources.length, "resource")}</strong>
        </header>
        {selectedLocation.resources.length > 0 && (
          <p className="source-note">{GATHERED_RESOURCE_SOURCE_NOTE}</p>
        )}
        <div className="resource-grid">
          {selectedLocation.resources.map((resource) => (
            <button
              type="button"
              key={`${selectedLocation.key}-${resource.name}`}
              onClick={() => openItemByName(resource.name)}
              className="resource-chip"
              aria-label={`${resource.name}, level ${resource.level}, ${resource.kind}${resource.marketValue > 0 ? `, ${formatGold(resource.marketValue)}` : ""}`}
            >
              {resource.imageUrl ? <img src={resource.imageUrl} alt="" loading="lazy" decoding="async" /> : <Package size={18} />}
              <span className="resource-copy">
                <span className="resource-name">{resource.name}</span>
                <small>{resource.kind}{resource.marketValue > 0 ? ` - ${formatGold(resource.marketValue)}` : ""}</small>
              </span>
              <strong>Lv.{resource.level}</strong>
            </button>
          ))}
          {selectedLocation.resources.length === 0 && (
            <p className="muted-empty">No gathered resources mapped for this location yet.</p>
          )}
        </div>
      </div>

      <div className="intel-section forecast-board">
        <header>
          <span><CalendarDays size={15} /> Forecast Windows</span>
          <strong>{formatCount(selectedWeatherTimeline.length, "window")}</strong>
        </header>
        <p className="forecast-hint">Open a window to compare favored, penalized, and neutral enemy reactions.</p>
        <div className="forecast-list">
          {selectedWeatherTimeline.length === 0 && (
            <p className="muted-empty">No forecast windows mapped for this location yet.</p>
          )}
          {selectedWeatherTimeline.slice(0, 10).map((weather, index) => {
            const key = String(weather.key || "").toUpperCase();
            const forecastKey = `${weather.starts_at || "window"}-${index}`;
            const crosscheck = getForecastEnemyCrosscheck(weather, selectedLocation.enemies);
            const expanded = activeForecastKey === forecastKey;
            return (
              <div
                className={`forecast-item ${expanded ? "active" : ""}`}
                key={forecastKey}
                style={{ "--weather-accent": WEATHER_COLORS[key] || "#f5b041" } as React.CSSProperties}
              >
                <button
                  type="button"
                  className="forecast-row"
                  aria-expanded={expanded}
                  aria-controls={`forecast-crosscheck-${index}`}
                  onClick={() => setActiveForecastKey(expanded ? null : forecastKey)}
                >
                  <span className="forecast-weather-name">{weatherIcon(key, 15)} {weather.name || "Weather"}</span>
                  <strong className="forecast-window-time">{formatWindow(weather)}</strong>
                  <span className="forecast-counts" aria-label={`${crosscheck.favored.length} favored enemies and ${crosscheck.penalized.length} penalized enemies`}>
                    <em className="favored">{crosscheck.favored.length} favored</em>
                    <em className="penalized">{crosscheck.penalized.length} penalized</em>
                  </span>
                  <ChevronDown className="forecast-chevron" aria-hidden="true" size={17} />
                </button>
                <div className="forecast-crosscheck" id={`forecast-crosscheck-${index}`} aria-hidden={!expanded}>
                  {expanded && (
                    <>
                      <ForecastEnemyGroup label="Favored" enemies={crosscheck.favored} tone="favored" />
                      <ForecastEnemyGroup label="Penalized" enemies={crosscheck.penalized} tone="penalized" />
                      <ForecastEnemyGroup label="Neutral" enemies={crosscheck.neutral} tone="neutral" />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
