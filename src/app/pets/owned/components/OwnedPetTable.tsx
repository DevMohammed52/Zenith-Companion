"use client";

import Link from "next/link";
import { PetImage } from "@/components/pets/PetImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Icon } from "@/components/ui/Icon";
import { getQualityPalette } from "@/lib/quality";
import type { ProfileOwnedPet } from "@/lib/profiles";
import { formatNumber, qualityLabel, type PetRecord } from "@/lib/pets";
import { formatSourceMode, formatValue, petKey } from "../utils/owned-pet-helpers";
import styles from "../page.module.css";

export function OwnedPetTable({
  pets,
  activePetKey,
  selectedCompareIds,
  onToggleCompare,
  getCatalogSummary,
  onUseAsActive,
  onOpenDetails,
}: {
  pets: ProfileOwnedPet[];
  activePetKey: string;
  selectedCompareIds: string[];
  onToggleCompare: (id: string) => void;
  getCatalogSummary: (pet: ProfileOwnedPet) => {
    databasePet: PetRecord | null | undefined;
    power: number;
    bestBattle: { zone: string | null; value: number } | null;
  };
  onUseAsActive: (pet: ProfileOwnedPet) => void;
  onOpenDetails: (pet: ProfileOwnedPet) => void;
}) {
  return (
    <section className={styles.tableCard} aria-label="Owned pets table">
      <div className={styles.tableWrap} role="region" tabIndex={0} aria-label="Owned pets roster table">
        <table className={styles.rosterTable}>
          <thead>
            <tr>
              <th scope="col" className={styles.selectColHead}>Pick</th>
              <th scope="col" className={styles.stickyColHead}>Pet</th>
              <th scope="col">Quality</th>
              <th scope="col" className={styles.numCol}>Lv / Evo</th>
              <th scope="col" className={styles.numCol}>Power</th>
              <th scope="col" className={styles.numCol}>Move</th>
              <th scope="col" className={styles.numCol}>Best EV / hr</th>
              <th scope="col">Location / Source</th>
              <th scope="col" className={styles.actionsCol}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pets.map((ownedPet) => {
              const { databasePet, power, bestBattle } = getCatalogSummary(ownedPet);
              const isActive =
                petKey(ownedPet) === activePetKey || Boolean(ownedPet.active || ownedPet.equipped);
              const displayName = ownedPet.nickname || ownedPet.species;
              const resolvedQuality = ownedPet.quality || databasePet?.quality || "UNKNOWN";
              const palette = getQualityPalette(resolvedQuality);

              return (
                <tr key={ownedPet.id}>
                  <td className={styles.selectCell}>
                    <Checkbox
                      label=""
                      aria-label={`Select ${displayName} for comparison`}
                      checked={selectedCompareIds.includes(ownedPet.id)}
                      onChange={() => onToggleCompare(ownedPet.id)}
                    />
                  </td>
                  <th scope="row" className={styles.stickyRowHead}>
                    <div className={styles.tablePetCell}>
                      <PetImage
                        pet={{
                          name: displayName,
                          imageUrl: ownedPet.imageUrl || databasePet?.imageUrl || "",
                          egg: databasePet?.egg,
                        }}
                        size={32}
                      />
                      <div className={styles.tablePetIdentity}>
                        <strong>{displayName}</strong>
                        <span>
                          {formatSourceMode(ownedPet.source)}
                          {isActive ? " | Equipped" : ""}
                        </span>
                      </div>
                    </div>
                  </th>
                  <td>
                    <Badge
                      variant="neutral"
                      size="sm"
                      style={{
                        color: palette.textColor,
                        borderColor: palette.border,
                        backgroundColor: palette.background,
                      }}
                    >
                      {qualityLabel(resolvedQuality)}
                    </Badge>
                  </td>
                  <td className={styles.numCol}>
                    Lv.{ownedPet.level || 1} E{ownedPet.evolution || 0}
                  </td>
                  <td className={styles.numCol}>{formatNumber(power)}</td>
                  <td className={styles.numCol}>{formatValue(ownedPet.stats.movementSpeed)}</td>
                  <td className={styles.numCol}>
                    {bestBattle?.zone ? `${formatNumber(bestBattle.value)}g` : "-"}
                  </td>
                  <td>
                    {ownedPet.location?.name || databasePet?.acquisition?.[0]?.boss || "With character"}
                  </td>
                  <td className={styles.actionsCol}>
                    <div className={styles.tableActions}>
                      <Button
                        variant={isActive ? "secondary" : "primary"}
                        size="sm"
                        disabled={isActive}
                        onClick={() => onUseAsActive(ownedPet)}
                      >
                        {isActive ? "Equipped" : "Equip"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onOpenDetails(ownedPet)}>
                        Details
                      </Button>
                      <Link
                        href={`/pets/compare?pets=${encodeURIComponent(`owned:${ownedPet.id}`)}`}
                        className={styles.cardIconAction}
                        aria-label={`Compare ${displayName} in Pet Comparison`}
                      >
                        <Icon name="petCompare" size="sm" aria-hidden="true" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
