"use client";

import React from "react";
import Link from "next/link";
import {
  Cloud,
  Coins,
  Heart,
  MapPin,
  Package,
  Shield,
  Skull,
  Sparkles,
} from "lucide-react";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { GameImage } from "@/components/GameImage";
import {
  getWeatherPreferenceLabel,
  type EnrichedEnemy,
} from "@/lib/world-intelligence";
import { getSafeMarketValue } from "@/lib/market-pricing";
import { formatGold, formatWindow, matchTone } from "../types";
import { PreferencePills } from "./PreferencePills";

export function EnemyDetailModal({
  enemy,
  marketData,
  onClose,
  onOpenItem,
}: {
  enemy: EnrichedEnemy;
  marketData?: Record<string, any> | null;
  onClose: () => void;
  onOpenItem: (name: string) => void;
}) {
  const tone = matchTone(enemy.currentWeatherMatch);

  return (
    <ModalSheet
      isOpen={true}
      onClose={onClose}
      title={enemy.name}
      description={`${enemy.locationName} • Level ${enemy.level}`}
      maxWidth="lg"
      className="enemy-detail-sheet"
      footer={
        <div className="enemy-modal-footer">
          <Link
            href={`/map?location=${encodeURIComponent(enemy.locationKey)}`}
            className="enemy-map-link"
            onClick={onClose}
          >
            <MapPin size={15} aria-hidden="true" />
            <span>View {enemy.locationName} on Map</span>
          </Link>
        </div>
      }
    >
      <div className="enemy-modal-content">
        {/* Enemy Profile Banner */}
        <section className="enemy-modal-hero" aria-label="Monster profile">
          <div className="enemy-modal-avatar">
            <GameImage
              src={enemy.imageUrl}
              alt={enemy.name}
              width={56}
              height={56}
              className="enemy-modal-sprite"
              unoptimized={true}
              fallback={<Skull size={28} className="modal-fallback-icon" aria-hidden="true" />}
            />
          </div>
          <div className="enemy-modal-identity">
            <div className="enemy-modal-title-row">
              <h2 className="enemy-modal-title">{enemy.name}</h2>
              <span className="enemy-modal-level-badge">Lv. {enemy.level}</span>
            </div>
            <div className="enemy-modal-tags">
              <span className="enemy-modal-location-tag">
                <MapPin size={13} aria-hidden="true" />
                <span>{enemy.locationName}</span>
              </span>
              <span className="enemy-modal-loot-chance-tag">
                <Package size={13} aria-hidden="true" />
                <span>{enemy.chanceOfLoot}% drop roll</span>
              </span>
            </div>
          </div>
        </section>

        {/* Combat Attributes Grid */}
        <section className="enemy-stat-grid" aria-label={`${enemy.name} combat attributes`}>
          <div className="stat-card">
            <div className="stat-icon-label">
              <Shield size={14} className="stat-icon level" aria-hidden="true" />
              <span>Level</span>
            </div>
            <strong>{enemy.level}</strong>
          </div>

          <div className="stat-card">
            <div className="stat-icon-label">
              <Heart size={14} className="stat-icon health" aria-hidden="true" />
              <span>Health</span>
            </div>
            <strong>{enemy.health.toLocaleString()} HP</strong>
          </div>

          <div className="stat-card">
            <div className="stat-icon-label">
              <Sparkles size={14} className="stat-icon xp" aria-hidden="true" />
              <span>Combat EXP</span>
            </div>
            <strong>{enemy.experience.toLocaleString()} XP</strong>
          </div>

          <div className="stat-card">
            <div className="stat-icon-label">
              <Coins size={14} className="stat-icon ev" aria-hidden="true" />
              <span>Loot EV / Kill</span>
            </div>
            <strong className="stat-ev-value">{formatGold(enemy.lootEv)}</strong>
          </div>
        </section>

        {/* Weather Synergy */}
        <section className="enemy-detail-card weather-card" aria-label="Weather synergies">
          <header className="card-header">
            <span className="card-title">
              <Cloud size={14} aria-hidden="true" />
              <span>Weather Synergy</span>
            </span>
            <span className={`match-chip ${tone}`}>
              {getWeatherPreferenceLabel(enemy.currentWeatherMatch)}
            </span>
          </header>

          <p className="weather-summary-text">
            Current weather at {enemy.locationName}: <strong>{enemy.currentWeather?.name || "Clear"}</strong>.
            {" "}Favorable window: <strong>{formatWindow(enemy)}</strong>.
          </p>

          <PreferencePills enemy={enemy} />
        </section>

        {/* Loot Drop Table */}
        <section className="enemy-detail-card loot-card" aria-label="Loot drop table">
          <header className="card-header">
            <span className="card-title">
              <Package size={14} aria-hidden="true" />
              <span>Loot Drop Table</span>
            </span>
            <span className="drop-count-badge">
              {enemy.lootCount} {enemy.lootCount === 1 ? "item" : "items"}
            </span>
          </header>

          {enemy.loot.length === 0 ? (
            <p className="loot-empty-text">No drop entries registered for this enemy.</p>
          ) : (
            <div className="loot-items-grid">
              {enemy.loot.map((drop) => {
                const dropMarketValue = marketData ? getSafeMarketValue(marketData[drop.name]) : 0;
                return (
                  <button
                    type="button"
                    key={`${enemy.name}-${drop.name}`}
                    onClick={() => onOpenItem(drop.name)}
                    className="loot-item-btn"
                    aria-label={`View item details for ${drop.name}: ${drop.chance}% drop rate${Number(drop.quantity || 1) > 1 ? `, quantity ${drop.quantity}` : ""}${dropMarketValue > 0 ? `, market value ${formatGold(dropMarketValue)}` : ""}`}
                  >
                    <div className="loot-item-art">
                      <GameImage
                        src={drop.image_url}
                        alt={drop.name}
                        width={36}
                        height={36}
                        className="loot-sprite"
                        unoptimized={true}
                        fallback={<Package size={18} className="loot-fallback-icon" aria-hidden="true" />}
                      />
                    </div>
                    <div className="loot-item-info">
                      <strong className="loot-item-name">{drop.name}</strong>
                      <div className="loot-item-meta">
                        <span className="drop-rate">{drop.chance}%</span>
                        {Number(drop.quantity || 1) > 1 && (
                          <span className="drop-qty">x{drop.quantity}</span>
                        )}
                        {dropMarketValue > 0 && (
                          <span className="drop-market-price">{formatGold(dropMarketValue)}</span>
                        )}
                      </div>
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
