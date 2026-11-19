import ZenithIcon from "@/components/icons/ZenithIcon";
import type { PetDatabase } from "../types";

export function PetHero({
  database,
  counts,
  masteryBonus,
  ownedSpeciesCount,
}: {
  database: PetDatabase | null;
  counts?: PetDatabase["meta"]["counts"];
  masteryBonus: number;
  ownedSpeciesCount: number;
}) {
  return (
    <section className="pets-hero">
      <div>
        <div className="pets-kicker">
          <ZenithIcon name="pets" size={16} /> Pet Database
        </div>
        <h1>Pet Database</h1>
        <p>
          Compare pet stats, sources, market values, and combat strengths.
        </p>
      </div>
      <div className="pets-hero-grid">
        <div>
          <span>Pets</span>
          <strong>{counts?.pets || database?.pets.length || "-"}</strong>
        </div>
        <div>
          <span>Egg Links</span>
          <strong>{counts?.petsWithEggs || "-"}</strong>
        </div>
        <div>
          <span>Listings</span>
          <strong>{counts?.exchangeListings?.toLocaleString() || "-"}</strong>
        </div>
        <div>
          <span>Mastery Bonus</span>
          <strong>{masteryBonus}%</strong>
        </div>
        <div>
          <span>Owned Species</span>
          <strong>{ownedSpeciesCount || "-"}</strong>
        </div>
      </div>
    </section>
  );
}
