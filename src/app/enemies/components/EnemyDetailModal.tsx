"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Cloud,
  ExternalLink,
  Heart,
  MapPin,
  Package,
  Shield,
  Skull,
  Sparkles,
  X,
} from "lucide-react";
import { useModalA11y } from "@/lib/use-modal-a11y";
import {
  getWeatherPreferenceLabel,
  type EnrichedEnemy,
} from "@/lib/world-intelligence";
import { formatGold, formatWindow, matchTone } from "../types";
import { PreferencePills } from "./PreferencePills";

export function EnemyDetailModal({
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
    <div
      className="enemy-modal-overlay"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
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
            {enemy.imageUrl ? (
              <img src={enemy.imageUrl} alt="" width={56} height={56} loading="eager" decoding="async" />
            ) : (
              <Skull size={38} />
            )}
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
                  {drop.image_url ? (
                    <img src={drop.image_url} alt="" width={34} height={34} loading="lazy" decoding="async" />
                  ) : (
                    <Package size={20} />
                  )}
                  <span>
                    <strong>{drop.name}</strong>
                    <small>{drop.chance}% drop rate{Number(drop.quantity || 1) > 1 ? ` - x${drop.quantity}` : ""}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="detail-links">
            <Link href={`/map?location=${encodeURIComponent(enemy.locationKey)}`}>
              <MapPin size={14} /> Map location <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
