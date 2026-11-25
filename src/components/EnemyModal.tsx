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
}

function getToneVariant(kind: WeatherPreferenceKind): "success" | "danger" | "neutral" {
  if (isFavorableWeather(kind)) return "success";
  if (isPenalizedWeather(kind)) return "danger";
  return "neutral";
}

function formatFavorableWindow(enemy: EnrichedEnemy): string {
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

  return (
    <ModalSheet
      isOpen={true}
      onClose={onClose}
      title={enemy.name}
      description={`${enemy.locationName} • Level ${enemy.level}`}
      maxWidth="lg"
      footer={
        <div className={styles.footerRow}>
          <Link
            href={`/enemies?enemy=${encodeURIComponent(enemy.name)}`}
            className={styles.footerLink}
            onClick={onClose}
          >
            <Icon name="combat" size="sm" aria-hidden="true" />
            <span>Open in Enemy Database</span>
            <Icon name="externalLink" size="xs" aria-hidden="true" />
          </Link>
        </div>
      }
    >
      <div className={styles.content}>
        {/* Identity Header */}
        <div className={styles.hero}>
          <div className={styles.avatar}>
            <GameImage
              src={enemy.imageUrl}
              alt={enemy.name}
              width={56}
              height={56}
              className={styles.avatarImg}
              fallback={<Icon name="boss" size="xl" aria-hidden="true" />}
            />
          </div>
          <div className={styles.identity}>
            <div className={styles.titleRow}>
              <h3 className={styles.enemyName}>{enemy.name}</h3>
              <Badge variant="neutral" size="sm">Lv. {enemy.level}</Badge>
            </div>
            <div className={styles.metaRow}>
              <span>{enemy.locationName}</span>
              <span className={styles.vDivider} aria-hidden="true" />
              <span>{enemy.chanceOfLoot}% drop roll</span>
            </div>
          </div>
        </div>

        {/* Combat Stat Strip */}
        <div className={styles.statStrip} aria-label={`${enemy.name} combat stats`}>
          <div className={styles.statCell}>
            <span className={styles.statLabel}>Level</span>
            <strong className={styles.statValue}>{enemy.level}</strong>
          </div>
          <span className={styles.vDividerTall} aria-hidden="true" />
          <div className={styles.statCell}>
            <span className={styles.statLabel}>Health</span>
            <strong className={styles.statValue}>{enemy.health.toLocaleString()} HP</strong>
          </div>
          <span className={styles.vDividerTall} aria-hidden="true" />
          <div className={styles.statCell}>
            <span className={styles.statLabel}>Combat EXP</span>
            <strong className={styles.statValue}>{enemy.experience.toLocaleString()} XP</strong>
          </div>
          <span className={styles.vDividerTall} aria-hidden="true" />
          <div className={styles.statCell}>
            <span className={styles.statLabel}>Loot EV / Kill</span>
            <strong className={styles.statGold}>
              {enemy.lootEv > 0 ? (
                <>
                  <GoldIcon size={13} />
                  <span>{Math.round(enemy.lootEv).toLocaleString()}g</span>
                </>
              ) : (
                "-"
              )}
            </strong>
          </div>
        </div>

        <Separator orientation="horizontal" decorative />

        {/* Weather Synergy */}
        <section className={styles.section} aria-label="Weather synergy">
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>
              <Icon name="weather" size="sm" aria-hidden="true" />
              <span>Weather Synergy</span>
            </span>
            <Badge variant={getToneVariant(enemy.currentWeatherMatch)} size="sm">
              {getWeatherPreferenceLabel(enemy.currentWeatherMatch)}
            </Badge>
          </div>
          <p className={styles.summaryCopy}>
            Current weather: <strong>{enemy.currentWeather?.name || "Unknown"}</strong> · Next favorable:{" "}
            <strong>{formatFavorableWindow(enemy)}</strong>
          </p>
          {prefGroups.length > 0 && (
            <div className={styles.prefGrid}>
              {prefGroups.map((group) => (
                <div key={group.kind} className={styles.prefRow}>
                  <Badge variant={getToneVariant(group.kind)} size="sm">
                    {getWeatherPreferenceLabel(group.kind)}
                  </Badge>
                  <span className={styles.prefValues}>{group.values.join(", ")}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <Separator orientation="horizontal" decorative />

        {/* Loot Drop Table */}
        <section className={styles.section} aria-label="Loot drop table">
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>
              <Icon name="items" size="sm" aria-hidden="true" />
              <span>Loot Drop Table</span>
            </span>
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
                        <span>{drop.chance}%</span>
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
