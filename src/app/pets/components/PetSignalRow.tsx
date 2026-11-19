import { BarChart3, Database, Dumbbell, PawPrint, Search } from "lucide-react";
import type { PetRow } from "../types";
import { formatCompactGold, secondsToDuration } from "../utils/pet-helpers";

export function PetSignalRow({
  petRowsCount,
  bestHunter,
  battleResearchPetCount,
  bestMarket,
  ownedPetCount,
  ownedSpeciesCount,
  resultAnnouncement,
  scenarioIsModified,
  scenarioLabel,
}: {
  petRowsCount: number;
  bestHunter: PetRow | null;
  battleResearchPetCount: number;
  bestMarket: PetRow | null;
  ownedPetCount: number;
  ownedSpeciesCount: number;
  resultAnnouncement: string;
  scenarioIsModified: boolean;
  scenarioLabel: string;
}) {
  return (
    <>
      <section className="pets-signal-row">
        <div>
          <Dumbbell size={18} />
          <span>Filtered</span>
          <strong>{petRowsCount}</strong>
        </div>
        <div>
          <Search size={18} />
          <span>Fastest</span>
          <strong>{bestHunter ? secondsToDuration(bestHunter.huntingTime) : "-"}</strong>
        </div>
        <div>
          <BarChart3 size={18} />
          <span>Battle Samples</span>
          <strong>{battleResearchPetCount || "-"}</strong>
        </div>
        <div>
          <Database size={18} />
          <span>Highest Listing</span>
          <strong>{bestMarket ? formatCompactGold(bestMarket.pet.exchange?.minPrice) : "-"}</strong>
        </div>
        <div>
          <PawPrint size={18} />
          <span>Owned Matches</span>
          <strong>{ownedPetCount ? `${ownedPetCount} pets / ${ownedSpeciesCount} species` : "-"}</strong>
        </div>
      </section>
      <div className="pet-result-status" aria-live="polite" aria-atomic="true">
        <span>{resultAnnouncement}</span>
        <strong className={scenarioIsModified ? "modified" : undefined}>
          {scenarioLabel}
          {scenarioIsModified ? " / Modified" : ""}
        </strong>
      </div>
    </>
  );
}
