"use client";

import type { CSSProperties } from "react";
import { Swords, Gauge, Search } from "lucide-react";
import { QUALITY_COLORS } from "@/lib/quality";
import type { PetRecord, StatKey } from "../types";
import {
  formatGold,
  formatNumber,
  secondsToDuration,
  getPetSourceLabel,
  qualityLabel,
} from "../utils/pet-helpers";
import { PetImage } from "./PetImage";

export function PetCard({
  pet,
  stats,
  totalPower,
  huntingTime,
  ownedCount,
  onInspect,
}: {
  pet: PetRecord;
  stats: Partial<Record<StatKey, number>>;
  totalPower: number;
  huntingTime: number;
  ownedCount: number;
  onInspect: () => void;
}) {
  const accent = QUALITY_COLORS[pet.quality] || QUALITY_COLORS.UNKNOWN;
  const battleZoneCount = pet.battle?.zones?.length || 0;
  return (
    <button
      aria-label={`Open ${pet.name} pet details`}
      className="pet-card"
      onClick={onInspect}
      style={{ "--quality-accent": accent } as CSSProperties}
      type="button"
    >
      <div className="pet-card-top">
        <PetImage pet={pet} />
        <div>
          <div className="pet-card-name">{pet.name}</div>
          <div className="pet-card-source">{getPetSourceLabel(pet)}</div>
        </div>
        <div className="pet-card-badges">
          {ownedCount > 0 && <span className="pet-owned-pill">Owned {ownedCount}</span>}
          <span className="pet-quality-pill">{qualityLabel(pet.quality)}</span>
        </div>
      </div>
      <div className="pet-card-stats">
        <span>
          <Swords size={14} /> {formatNumber(totalPower)}
        </span>
        <span>
          <Gauge size={14} /> {formatNumber(stats.movement_speed, 2)}m/s
        </span>
        <span>
          <Search size={14} /> {secondsToDuration(huntingTime)}
        </span>
      </div>
      <div className="pet-card-market">
        <span>{pet.exchange?.listingCount ? `Lowest listing (${pet.exchange.listingCount} listed)` : "Lowest listing"}</span>
        <strong>{formatGold(pet.exchange?.minPrice)}</strong>
      </div>
      <div className="pet-card-market pet-card-market-secondary">
        <span>{battleZoneCount ? `Battle research (${battleZoneCount} zone${battleZoneCount === 1 ? "" : "s"})` : "Battle research"}</span>
        <strong>{battleZoneCount ? "Open samples" : "No sample"}</strong>
      </div>
    </button>
  );
}
