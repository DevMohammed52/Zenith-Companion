import React, { useMemo, useState, type RefObject } from "react";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import {
  Badge,
  Card,
  Icon,
  Pagination,
  SegmentedControl,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Timeline,
  type TimelineItem,
} from "@/components/ui";
import { GATHERED_RESOURCE_SOURCE_NOTE } from "@/lib/locations";
import {
  getWeatherPreferenceKind,
  getWeatherPreferenceLabel,
  type EnrichedEnemy,
} from "@/lib/world-intelligence";
import {
  formatChance,
  formatCount,
  formatGold,
  formatWindow,
  getForecastEnemyCrosscheck,
  getSourceKind,
  MAP_TABS,
  parseWeatherEffects,
  safeDate,
  weatherIcon,
  type DropSummary,
  type ForecastWeather,
  type MapLocation,
  type MapTab,
} from "../types";
import { DROPS_PAGE_SIZE } from "../hooks/useMapState";
import { WeatherEffectsBreakdown } from "./WeatherEffectsBreakdown";
import styles from "../page.module.css";

type ForecastFilter = "all" | "favored" | "skilling";

function WeatherEnemyGroup({
  title,
  enemies,
  empty,
  tone,
  windowWeatherName,
  onSelectEnemy,
}: {
  title: string;
  enemies: EnrichedEnemy[];
  empty: string;
  tone: "good" | "bad" | "neutral";
  windowWeatherName?: string;
  onSelectEnemy: (enemy: EnrichedEnemy) => void;
}) {
  return (
    <div className={styles.reactionGroup}>
      <div className={styles.reactionGroupHead}>
        <h4>{title}</h4>
        <Badge variant={tone === "good" ? "success" : tone === "bad" ? "danger" : "neutral"} size="sm">
          {enemies.length}
        </Badge>
      </div>
      {enemies.length === 0 ? (
        <p className={styles.mutedNote}>{empty}</p>
      ) : (
        <div className={styles.reactionChipGrid}>
          {enemies.map((enemy) => {
            const matchKind = windowWeatherName
              ? getWeatherPreferenceKind(enemy.weatherPreference, windowWeatherName)
              : enemy.currentWeatherMatch;
            return (
              <button
                type="button"
                key={`${title}-${enemy.locationKey}-${enemy.name}`}
                onClick={() => onSelectEnemy(enemy)}
                className={`${styles.reactionChip} ${tone === "good" ? styles.reactionGood : tone === "bad" ? styles.reactionBad : ""}`}
              >
                {enemy.imageUrl ? (
                  <GameImage
                    src={enemy.imageUrl}
                    alt=""
                    width={24}
                    height={24}
                    className={styles.smallThumb}
                  />
                ) : (
                  <Icon name="combat" size="sm" aria-hidden="true" />
                )}
                <span className={styles.reactionChipText}>
                  <strong>{enemy.name}</strong>
                  <small>{getWeatherPreferenceLabel(matchKind)}</small>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SourceColumn({
  title,
  iconName,
  rows,
  hrefBase,
  queryParam,
  onSelectRow,
}: {
  title: string;
  iconName: "combat" | "dungeon" | "boss";
  rows: any[];
  hrefBase?: "/enemies" | "/dungeons" | "/bosses";
  queryParam?: "search" | "dungeon" | "boss";
  onSelectRow?: (row: any) => void;
}) {
  const sourceKind = getSourceKind(title);
  return (
    <div className={styles.sourceColumn}>
      <h3 className={styles.sourceColumnTitle}>
        <Icon name={iconName} size="sm" aria-hidden="true" />
        <span>{title}</span>
        <span className={styles.sourceCountPill}>{rows.length}</span>
      </h3>
      {rows.length === 0 ? (
        <p className={styles.mutedNote}>None in this region.</p>
      ) : (
        <div className={styles.sourceStack}>
          {rows.map((row) => {
            const subLabel = row.level
              ? `Level ${row.level}`
              : row.difficulty
              ? `Difficulty ${row.difficulty}`
              : row.status || "Source";

            if (onSelectRow) {
              return (
                <button
                  type="button"
                  key={`${title}-${row.id || row.name}`}
                  onClick={() => onSelectRow(row)}
                  className={styles.sourceRow}
                  aria-label={`${row.name}, ${subLabel} ${sourceKind} — view details`}
                >
                  <span className={styles.sourceRowInfo}>
                    <strong>{row.name}</strong>
                    <small>{subLabel}</small>
                  </span>
                  <Icon name="chevronRight" size="xs" aria-hidden="true" />
                </button>
              );
            }

            return (
              <Link
                key={`${title}-${row.id || row.name}`}
                href={`${hrefBase || "/enemies"}?${queryParam || "search"}=${encodeURIComponent(row.name)}`}
                className={styles.sourceRow}
                aria-label={`${row.name}, ${subLabel} ${sourceKind}`}
              >
                <span className={styles.sourceRowInfo}>
                  <strong>{row.name}</strong>
                  <small>{subLabel}</small>
                </span>
                <Icon name="externalLink" size="xs" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface IntelGridProps {
  intelRef: RefObject<HTMLElement | null>;
  selectedLocation: MapLocation;
  activeTab: MapTab;
  setActiveTab: (tab: MapTab) => void;
  filteredDrops: DropSummary[];
  selectedVisibleDrops: DropSummary[];
  dropsPage: number;
  dropsTotalPages: number;
  setDropsPage: (page: number) => void;
  selectedWeatherTimeline: ForecastWeather[];
  activeForecastKey: string | null;
  setActiveForecastKey: (key: string | null) => void;
  openItemByName: (name: string) => void;
  onSelectEnemy: (enemy: EnrichedEnemy) => void;
}

export function IntelGrid({
  intelRef,
  selectedLocation,
  activeTab,
  setActiveTab,
  filteredDrops,
  selectedVisibleDrops,
  dropsPage,
  dropsTotalPages,
  setDropsPage,
  selectedWeatherTimeline,
  activeForecastKey,
  setActiveForecastKey,
  openItemByName,
  onSelectEnemy,
}: IntelGridProps) {
  const [forecastFilter, setForecastFilter] = useState<ForecastFilter>("all");

  const sourceTotal =
    selectedLocation.enemies.length +
    selectedLocation.dungeons.length +
    selectedLocation.bosses.length;

  const badgeCountForTab = (tabId: MapTab): number => {
    if (tabId === "overview") return sourceTotal;
    if (tabId === "resources") return selectedLocation.resources.length;
    if (tabId === "drops") return filteredDrops.length;
    return selectedWeatherTimeline.length;
  };

  const enrichedWindows = useMemo(() => {
    const now = Date.now();
    return selectedWeatherTimeline.slice(0, 16).map((weather, index) => {
      const key = String(weather.key || "").toUpperCase();
      const forecastKey = `${weather.starts_at || "window"}-${index}`;
      const startMs = safeDate(weather.starts_at)?.getTime() ?? 0;
      const endMs = safeDate(weather.ends_at)?.getTime() ?? 0;
      const isLive = startMs <= now && now < endMs;
      const crosscheck = getForecastEnemyCrosscheck(weather, selectedLocation.enemies);
      const parsedEffects = parseWeatherEffects(weather.buffs);
      const hasSkillingBoost =
        parsedEffects.special.length > 0 ||
        parsedEffects.skills.some(
          (skill) =>
            (skill.efficiency && skill.efficiency.startsWith("+")) ||
            (skill.experience && skill.experience.startsWith("+")),
        );

      return {
        weather,
        index,
        key,
        forecastKey,
        isLive,
        crosscheck,
        hasSkillingBoost,
      };
    });
  }, [selectedLocation.enemies, selectedWeatherTimeline]);

  const favoredWindowsCount = useMemo(
    () => enrichedWindows.filter((entry) => entry.crosscheck.favored.length > 0).length,
    [enrichedWindows],
  );

  const skillingWindowsCount = useMemo(
    () => enrichedWindows.filter((entry) => entry.hasSkillingBoost).length,
    [enrichedWindows],
  );

  const visibleForecastWindows = useMemo(() => {
    if (forecastFilter === "favored") {
      return enrichedWindows.filter((entry) => entry.crosscheck.favored.length > 0);
    }
    if (forecastFilter === "skilling") {
      return enrichedWindows.filter((entry) => entry.hasSkillingBoost);
    }
    return enrichedWindows;
  }, [enrichedWindows, forecastFilter]);

  const timelineItems: TimelineItem[] = useMemo(
    () =>
      visibleForecastWindows.map((entry) => {
        const { weather, index, key, forecastKey, isLive, crosscheck } = entry;
        const expanded = activeForecastKey === forecastKey;

        return {
          id: forecastKey,
          variant: isLive ? "success" : "default",
          status: isLive ? "Live now" : (weather as ForecastWeather & { day_name?: string }).day_name || "Upcoming",
          timestamp: weather.starts_at || String(index),
          formattedTime: formatWindow(weather),
          title: (
            <span className={styles.forecastTimelineTitle}>
              <span className={styles.forecastName}>
                {weatherIcon(key, 16)}
                <span>{weather.name || "Weather"}</span>
              </span>
              <span className={styles.forecastCounts}>
                {crosscheck.favored.length > 0 && (
                  <Badge variant="success" size="sm">
                    {crosscheck.favored.length} favored
                  </Badge>
                )}
                {crosscheck.penalized.length > 0 && (
                  <Badge variant="danger" size="sm">
                    {crosscheck.penalized.length} penalized
                  </Badge>
                )}
              </span>
            </span>
          ),
          children: (
            <div className={styles.forecastTimelineBody}>
              <WeatherEffectsBreakdown buffs={weather.buffs} compact />

              {selectedLocation.enemies.length > 0 && (
                <div className={styles.forecastReactionsBlock}>
                  <button
                    type="button"
                    className={styles.forecastReactionsToggle}
                    aria-expanded={expanded}
                    aria-controls={`forecast-drawer-${index}`}
                    onClick={() => setActiveForecastKey(expanded ? null : forecastKey)}
                  >
                    <span>
                      Enemy reactions ({crosscheck.favored.length} favored · {crosscheck.penalized.length} penalized)
                    </span>
                    <Icon
                      name="chevronDown"
                      size="sm"
                      className={`${styles.chevronIcon} ${expanded ? styles.chevronRotated : ""}`}
                      aria-hidden="true"
                    />
                  </button>

                  <div
                    id={`forecast-drawer-${index}`}
                    className={`${styles.forecastDrawer} ${expanded ? styles.forecastDrawerOpen : ""}`}
                    aria-hidden={!expanded}
                    inert={!expanded || undefined}
                  >
                    <div className={styles.forecastDrawerInner}>
                      <div className={styles.forecastDrawerContent}>
                        <div className={styles.reactionSplit}>
                          <WeatherEnemyGroup
                            title="Favored"
                            enemies={crosscheck.favored}
                            empty="No favored enemies"
                            tone="good"
                            windowWeatherName={weather.name || weather.key}
                            onSelectEnemy={onSelectEnemy}
                          />
                          <WeatherEnemyGroup
                            title="Penalized"
                            enemies={crosscheck.penalized}
                            empty="No penalized enemies"
                            tone="bad"
                            windowWeatherName={weather.name || weather.key}
                            onSelectEnemy={onSelectEnemy}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ),
        };
      }),
    [activeForecastKey, onSelectEnemy, selectedLocation.enemies.length, setActiveForecastKey, visibleForecastWindows],
  );

  return (
    <Card padding="md" className={styles.intelCard}>
      <section ref={intelRef} aria-label={`${selectedLocation.name} regional intelligence`} className={styles.intelInner}>
        <Tabs
          value={activeTab}
          onValueChange={(nextId) => setActiveTab(nextId as MapTab)}
          variant="pill"
        >
          <div className={styles.intelHeader}>
            <div>
              <span className={styles.eyebrow}>
                <Icon name="items" size="sm" aria-hidden="true" />
                <span>Regional Breakdown</span>
              </span>
              <h2 className={styles.intelTitle}>{selectedLocation.name}</h2>
            </div>

            <TabList aria-label="Regional intelligence views">
              {MAP_TABS.map((tab) => (
                <Tab key={tab.id} value={tab.id} badge={badgeCountForTab(tab.id)}>
                  {tab.label}
                </Tab>
              ))}
            </TabList>
          </div>

          {/* Tab 1: Overview & Sources */}
          <TabPanel value="overview" className={styles.tabPanelBody}>
            <div className={styles.reactionSplit}>
              <WeatherEnemyGroup
                title="Favored in current weather"
                enemies={selectedLocation.favoredEnemies}
                empty="No favored enemies in the current weather."
                tone="good"
                onSelectEnemy={onSelectEnemy}
              />
              <WeatherEnemyGroup
                title="Penalized in current weather"
                enemies={selectedLocation.penalizedEnemies}
                empty="No penalized enemies in the current weather."
                tone="bad"
                onSelectEnemy={onSelectEnemy}
              />
            </div>

            <div className={styles.sourceColumns}>
              <SourceColumn
                title="Enemies"
                iconName="combat"
                rows={selectedLocation.enemies}
                onSelectRow={onSelectEnemy}
              />
              <SourceColumn
                title="Dungeons"
                iconName="dungeon"
                rows={selectedLocation.dungeons}
                hrefBase="/dungeons"
                queryParam="dungeon"
              />
              <SourceColumn
                title="Bosses"
                iconName="boss"
                rows={selectedLocation.bosses}
                hrefBase="/bosses"
                queryParam="boss"
              />
            </div>
          </TabPanel>

          {/* Tab 2: Gathered Resources */}
          <TabPanel value="resources" className={styles.tabPanelBody}>
            {selectedLocation.resources.length > 0 ? (
              <>
                <p className={styles.tabLeadNote}>{GATHERED_RESOURCE_SOURCE_NOTE} Click any node to view market prices and recipes.</p>
                <div className={styles.itemGrid}>
                  {selectedLocation.resources.map((resource) => (
                    <button
                      type="button"
                      key={`${selectedLocation.key}-${resource.name}`}
                      onClick={() => openItemByName(resource.name)}
                      className={styles.itemTile}
                      aria-label={`${resource.name}, level ${resource.level}, ${resource.kind}${resource.marketValue > 0 ? `, ${formatGold(resource.marketValue)}` : ""}`}
                    >
                      {resource.imageUrl ? (
                        <GameImage
                          src={resource.imageUrl}
                          alt=""
                          width={32}
                          height={32}
                          className={styles.itemThumb}
                        />
                      ) : (
                        <span className={styles.itemThumbFallback}>
                          <Icon name="items" size="md" aria-hidden="true" />
                        </span>
                      )}
                      <span className={styles.itemCopy}>
                        <span className={styles.itemName}>{resource.name}</span>
                        <small className={styles.itemMeta}>
                          {resource.kind}
                          {resource.marketValue > 0 && (
                            <>
                              {" · "}
                              <GoldIcon size={11} />
                              {" "}
                              {formatGold(resource.marketValue)}
                            </>
                          )}
                        </small>
                      </span>
                      <span className={styles.itemRightTag}>Lv.{resource.level}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className={styles.mutedNote}>No gathered resources mapped for this location yet.</p>
            )}
          </TabPanel>

          {/* Tab 3: Loot Drops (Bounded Pagination) */}
          <TabPanel value="drops" className={styles.tabPanelBody}>
            {filteredDrops.length > 0 ? (
              <>
                <p className={styles.tabLeadNote}>
                  Sorted by safe market gold value across regional enemies, dungeons, and bosses. Click any drop for full valuation.
                </p>
                <div className={styles.itemGrid}>
                  {selectedVisibleDrops.map((drop) => (
                    <button
                      type="button"
                      key={drop.name}
                      onClick={() => openItemByName(drop.name)}
                      className={styles.itemTile}
                      aria-label={`${drop.name}, ${formatGold(drop.marketValue)}, ${formatCount(drop.count, "source")}${formatChance(drop.bestChance) ? `, ${formatChance(drop.bestChance)}` : ""}`}
                    >
                      {drop.imageUrl ? (
                        <GameImage
                          src={drop.imageUrl}
                          alt=""
                          width={32}
                          height={32}
                          className={styles.itemThumb}
                        />
                      ) : (
                        <span className={styles.itemThumbFallback}>
                          <Icon name="items" size="md" aria-hidden="true" />
                        </span>
                      )}
                      <span className={styles.itemCopy}>
                        <span className={styles.itemName}>{drop.name}</span>
                        <small className={styles.itemMeta}>
                          {formatCount(drop.count, "source")}
                          {formatChance(drop.bestChance) ? ` · ${formatChance(drop.bestChance)}` : ""}
                        </small>
                      </span>
                      <span className={styles.itemGoldRight}>
                        {drop.marketValue > 0 ? (
                          <>
                            <GoldIcon size={12} />
                            <span>{formatGold(drop.marketValue)}</span>
                          </>
                        ) : (
                          <span>-</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                {dropsTotalPages > 1 && (
                  <div className={styles.paginationWrap}>
                    <Pagination
                      currentPage={dropsPage}
                      totalPages={dropsTotalPages}
                      totalItems={filteredDrops.length}
                      pageSize={DROPS_PAGE_SIZE}
                      onPageChange={setDropsPage}
                      itemLabel="drops"
                      scrollToTop={false}
                      showSummary={false}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className={styles.mutedNote}>No confirmed combat, dungeon, or boss loot drops for this location yet.</p>
            )}
          </TabPanel>

          {/* Tab 4: Chronological Weather Forecast Timeline */}
          <TabPanel value="weather" className={styles.tabPanelBody}>
            {enrichedWindows.length === 0 ? (
              <p className={styles.mutedNote}>No forecast windows mapped for this location yet.</p>
            ) : (
              <>
                <div className={styles.forecastToolbar}>
                  <SegmentedControl<ForecastFilter>
                    size="sm"
                    ariaLabel="Filter forecast windows"
                    value={forecastFilter}
                    onChange={(next) => {
                      setForecastFilter(next);
                      setActiveForecastKey(null);
                    }}
                    options={[
                      { value: "all", label: `All (${enrichedWindows.length})` },
                      { value: "favored", label: `Favored (${favoredWindowsCount})`, disabled: favoredWindowsCount === 0 },
                      { value: "skilling", label: `Skill Buffs (${skillingWindowsCount})`, disabled: skillingWindowsCount === 0 },
                    ]}
                  />
                  <span className={styles.tabLeadNote}>Local time windows · click any enemy chip for full stats and loot.</span>
                </div>

                {timelineItems.length > 0 ? (
                  <Timeline
                    headingLevel="h3"
                    directionNotice="Order: Current window first • Local timezone"
                    items={timelineItems}
                  />
                ) : (
                  <p className={styles.mutedNote}>No forecast windows match this filter.</p>
                )}
              </>
            )}
          </TabPanel>
        </Tabs>
      </section>
    </Card>
  );
}
