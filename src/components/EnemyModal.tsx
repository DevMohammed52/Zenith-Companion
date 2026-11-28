"use client";

import React from "react";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import { Badge, Icon, ModalSheet, Separator } from "@/components/ui";
import { getSafeMarketValue } from "@/lib/market-pricing";
import {
  getWeatherPreferenceLabel,
  isFavorableWeather,
  isPenalizedWeather,
  type EnrichedEnemy,
  type WeatherPreferenceKind,
} from "@/lib/world-intelligence";
import styles from "./EnemyModal.module.css";

interface EnemyModalProps {
  enemy: EnrichedEnemy | null;
  marketData?: Record<string, any> | null;
  onClose: () => void;
  onOpenItem: (name: string) => void;
  /** "map" links footer to /enemies; "enemies" links footer to /map */
  context?: "map" | "enemies";
}

function getToneVariant(kind: WeatherPreferenceKind): "success" | "danger" | "neutral" {
  if (isFavorableWeather(kind)) return "success";
  if (isPenalizedWeather(kind)) return "danger";
  return "neutral";
}

function getPrefToneClass(kind: WeatherPreferenceKind): string {
  if (isFavorableWeather(kind)) return styles.prefGood;
  if (isPenalizedWeather(kind)) return styles.prefBad;
  return styles.prefNeutral;
}

function formatFavorableWindow(enemy: EnrichedEnemy): string {
  if (isFavorableWeather(enemy.currentWeatherMatch)) {
    return `${enemy.currentWeather?.name || "Favorable"} active now`;
  }
  const win = enemy.nextFavorableWeather;
  if (!win) return "None scheduled";
  const start = win.starts_at ? new Date(win.starts_at) : null;
  if (!start || !Number.isFinite(start.getTime())) {
    return win.name || "Scheduled";
  }
  const diffMin = Math.round((start.getTime() - Date.now()) / 60000);
  const label = win.name || "Weather";
  if (diffMin <= 0) return `${label} (Now)`;
  if (diffMin < 60) return `${label} in ${diffMin}m`;
  const hrs = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return `${label} in ${hrs}h ${mins}m`;
}

export function EnemyModal({
  enemy,
  marketData,
  onClose,
  onOpenItem,
  context = "map",
}: EnemyModalProps) {
  if (!enemy) return null;

  const pref = enemy.weatherPreference;
  const rawGroups: Array<{ kind: WeatherPreferenceKind; values: string[] }> = pref
    ? [
        { kind: "loves", values: pref.loves },
        { kind: "likes", values: pref.likes },
        { kind: "neutral", values: pref.neutral },
        { kind: "dislikes", values: pref.dislikes },
        { kind: "hates", values: pref.hates },
      ]
    : [];
  const prefGroups = rawGroups.filter((g) => g.values.length > 0);
  const hasEv = Number.isFinite(enemy.lootEv) && enemy.lootEv > 0;

  return (
    <ModalSheet
      isOpen={true}
      onClose={onClose}
      title={enemy.name}
      description={`${enemy.locationName} (Level ${enemy.level})`}
      maxWidth="lg"
      footer={
        <div className={styles.footerRow}>
          {context === "enemies" ? (
            <Link
              href={`/map?location=${encodeURIComponent(enemy.locationKey)}`}
              className={styles.footerLink}
              onClick={onClose}
            >
              <Icon name="mapPin" size="sm" aria-hidden="true" />
              <span>View {enemy.locationName} on Map</span>
            </Link>
          ) : (
            <Link
              href={`/enemies?enemy=${encodeURIComponent(enemy.name)}`}
              className={styles.footerLink}
              onClick={onClose}
            >
              <Icon name="combat" size="sm" aria-hidden="true" />
              <span>Open in Enemy Database</span>
              <Icon name="externalLink" size="xs" aria-hidden="true" />
            </Link>
          )}
        </div>
      }
    >
      <div className={styles.content}>
        {/* Identity Bar (No duplicate enemy title heading below ModalSheet header) */}
        <div className={styles.hero}>
          <div className={styles.avatar}>
            <GameImage
              src={enemy.imageUrl}
              alt={enemy.name}
              width={52}
              height={52}
              className={styles.avatarImg}
              fallback={<Icon name="enemy" size="xl" aria-hidden="true" />}
            />
          </div>
          <div className={styles.identity}>
            <div className={styles.badgeCluster}>
              <Badge variant="neutral" size="sm">Lv. {enemy.level}</Badge>
              <Badge variant={getToneVariant(enemy.currentWeatherMatch)} size="sm">
                {enemy.currentWeather?.name || "Weather"}: {getWeatherPreferenceLabel(enemy.currentWeatherMatch)}
              </Badge>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <Icon name="mapPin" size="xs" aria-hidden="true" />
                <span>{enemy.locationName}</span>
              </span>
              <span className={styles.vDivider} aria-hidden="true" />
              <span className={styles.metaItem}>
                <Icon name="items" size="xs" aria-hidden="true" />
                <span>{enemy.chanceOfLoot}% drop roll</span>
              </span>
            </div>
          </div>
        </div>

        {/* Combat Stat Strip */}
        <div className={styles.statStrip} aria-label={`${enemy.name} combat stats`}>
          <div className={styles.statCell}>
            <span className={styles.statLabel}>
              <Icon name="defense" size="xs" aria-hidden="true" />
              <span>Level</span>
            </span>
            <strong className={styles.statValue}>{enemy.level}</strong>
          </div>

          <div className={styles.statCell}>
            <span className={styles.statLabel}>
              <Icon name="health" size="xs" aria-hidden="true" />
              <span>Health</span>
            </span>
            <strong className={styles.statValue}>{enemy.health.toLocaleString()} HP</strong>
          </div>

          <div className={styles.statCell}>
            <span className={styles.statLabel}>
              <Icon name="xp" size="xs" aria-hidden="true" />
              <span>Combat EXP</span>
            </span>
            <strong className={styles.statValue}>{enemy.experience.toLocaleString()} XP</strong>
          </div>

          <div className={styles.statCell}>
            <span className={styles.statLabel}>
              <Icon name="gold" size="xs" aria-hidden="true" />
              <span>Loot EV / Kill</span>
            </span>
            <strong className={hasEv ? styles.statGold : styles.statValue}>
              {hasEv ? (
                <>
                  <GoldIcon size={13} />
                  <span>{Math.round(enemy.lootEv).toLocaleString()}g</span>
                </>
              ) : (
                "—"
              )}
            </strong>
          </div>
        </div>

        <Separator orientation="horizontal" decorative />

        {/* Weather Synergy */}
        <section className={styles.section} aria-label="Weather synergy">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>
              <Icon name="weatherOvercast" size="sm" aria-hidden="true" />
              <span>Weather Synergy</span>
            </h3>
            <Badge variant={getToneVariant(enemy.currentWeatherMatch)} size="sm">
              {getWeatherPreferenceLabel(enemy.currentWeatherMatch)}
            </Badge>
          </div>
          <p className={styles.summaryCopy}>
            Current weather: <strong>{enemy.currentWeather?.name || "Unknown"}</strong> | Favorable window:{" "}
            <strong>{formatFavorableWindow(enemy)}</strong>
          </p>
          {prefGroups.length > 0 && (
            <div className={styles.prefChips}>
              {prefGroups.map((group) => (
                <span key={group.kind} className={`${styles.prefChip} ${getPrefToneClass(group.kind)}`}>
                  <strong>{getWeatherPreferenceLabel(group.kind)}</strong>
                  <span>{group.values.join(", ")}</span>
                </span>
              ))}
            </div>
          )}
        </section>

        <Separator orientation="horizontal" decorative />

        {/* Loot Drop Table */}
        <section className={styles.section} aria-label="Loot drop table">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>
              <Icon name="items" size="sm" aria-hidden="true" />
              <span>Loot Drop Table</span>
            </h3>
            <span className={styles.countMeta}>
              {enemy.loot.length} {enemy.loot.length === 1 ? "item" : "items"}
            </span>
          </div>

          {enemy.loot.length === 0 ? (
            <p className={styles.emptyText}>No drop entries recorded for this enemy.</p>
          ) : (
            <div className={styles.lootGrid}>
              {enemy.loot.map((drop) => {
                const marketVal = marketData ? getSafeMarketValue(marketData[drop.name]) : 0;
                const qty = Number(drop.quantity || 1);
                return (
                  <button
                    type="button"
                    key={`${enemy.name}-${drop.name}`}
                    className={styles.lootButton}
                    onClick={() => onOpenItem(drop.name)}
                    aria-label={`View ${drop.name}: ${drop.chance}% drop rate${qty > 1 ? `, x${qty}` : ""}${marketVal > 0 ? `, ${Math.round(marketVal).toLocaleString()}g` : ""}`}
                  >
                    <div className={styles.lootArt}>
                      <GameImage
                        src={drop.image_url}
                        alt={drop.name}
                        width={32}
                        height={32}
                        className={styles.lootSprite}
                        fallback={<Icon name="items" size="md" aria-hidden="true" />}
                      />
                    </div>
                    <div className={styles.lootInfo}>
                      <span className={styles.lootName}>{drop.name}</span>
                      <span className={styles.lootMeta}>
                        <span className={styles.lootChance}>{drop.chance}%</span>
                        {qty > 1 && <span>x{qty}</span>}
                        {marketVal > 0 && (
                          <span className={styles.lootGold}>
                            <GoldIcon size={11} />
                            <span>{Math.round(marketVal).toLocaleString()}g</span>
                          </span>
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </ModalSheet>
  );
}
