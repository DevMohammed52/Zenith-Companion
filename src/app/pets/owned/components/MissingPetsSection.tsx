"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { PetImage } from "@/components/pets/PetImage";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { getQualityPalette } from "@/lib/quality";
import {
  QUALITY_COLORS,
  formatGold,
  formatNumber,
  getBestBattleProfit,
  getPetSourceLabel,
  qualityLabel,
  type PetRecord,
} from "@/lib/pets";
import type { OwnedViewMode } from "../types";
import styles from "../page.module.css";

export function MissingPetsSection({
  pets,
  viewMode,
}: {
  pets: PetRecord[];
  viewMode: OwnedViewMode;
}) {
  if (viewMode === "table") {
    return (
      <section className={styles.tableCard} aria-label="Missing pets table">
        <div className={styles.tableWrap} role="region" tabIndex={0} aria-label="Missing pets table">
          <table className={styles.rosterTable}>
            <thead>
              <tr>
                <th scope="col" className={styles.stickyColHead}>Pet</th>
                <th scope="col">Quality</th>
                <th scope="col">How to get</th>
                <th scope="col" className={styles.numCol}>Best EV / hr</th>
                <th scope="col" className={styles.numCol}>Exchange Floor</th>
                <th scope="col" className={styles.actionsCol}>Links</th>
              </tr>
            </thead>
            <tbody>
              {pets.map((pet) => {
                const palette = getQualityPalette(pet.quality);
                const best = getBestBattleProfit(pet, "withSleep", "standard");
                return (
                  <tr key={pet.name}>
                    <th scope="row" className={styles.stickyRowHead}>
                      <div className={styles.tablePetCell}>
                        <PetImage pet={pet} size={32} />
                        <div className={styles.tablePetIdentity}>
                          <strong>{pet.name}</strong>
                          <span>{best.zone || "No battle sample"}</span>
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
                        {qualityLabel(pet.quality)}
                      </Badge>
                    </td>
                    <td>{getPetSourceLabel(pet) || "Unknown"}</td>
                    <td className={styles.numCol}>
                      {best.zone ? `${formatNumber(best.value)}g` : "-"}
                    </td>
                    <td className={styles.numCol}>{formatGold(pet.exchange?.minPrice)}</td>
                    <td className={styles.actionsCol}>
                      <div className={styles.tableActions}>
                        <Link
                          href={`/pets/compare?pets=${encodeURIComponent(`db:${pet.name}`)}`}
                          className={styles.cardIconAction}
                          aria-label={`Compare ${pet.name} in Pet Comparison`}
                        >
                          <Icon name="petCompare" size="sm" aria-hidden="true" />
                        </Link>
                        <Link
                          href={`/pets?q=${encodeURIComponent(pet.name)}`}
                          className={styles.cardLinkAction}
                        >
                          <span>Catalog</span>
                          <Icon name="chevronRight" size="xs" aria-hidden="true" />
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

  return (
    <section className={styles.grid} aria-label="Missing pets from your collection">
      {pets.map((pet) => {
        const palette = getQualityPalette(pet.quality);
        const accent =
          QUALITY_COLORS[pet.quality.toUpperCase() as keyof typeof QUALITY_COLORS] ||
          QUALITY_COLORS.UNKNOWN;
        const best = getBestBattleProfit(pet, "withSleep", "standard");

        return (
          <article
            key={pet.name}
            className={styles.card}
            style={{ "--accent": accent } as CSSProperties}
          >
            <div className={styles.cardTop}>
              <PetImage pet={pet} size={44} />
              <div className={styles.cardIdentity}>
                <h2 className={styles.cardTitle}>{pet.name}</h2>
                <p className={styles.cardSubtitle}>{getPetSourceLabel(pet) || "Unknown source"}</p>
              </div>
              <Badge
                variant="neutral"
                size="sm"
                style={{
                  color: palette.textColor,
                  borderColor: palette.border,
                  backgroundColor: palette.background,
                }}
              >
                {qualityLabel(pet.quality)}
              </Badge>
            </div>

            <div className={styles.statGrid}>
              <div className={styles.statTile}>
                <span className={styles.statTileLabel}>Best Battle EV</span>
                <strong className={styles.statTileValue}>
                  {best.zone ? `${formatNumber(best.value)}g/hr` : "-"}
                </strong>
              </div>
              <div className={styles.statTile}>
                <span className={styles.statTileLabel}>Best Zone</span>
                <strong className={styles.statTileValue}>{best.zone || "-"}</strong>
              </div>
              <div className={styles.statTile}>
                <span className={styles.statTileLabel}>Exchange Floor</span>
                <strong className={styles.statTileValue}>
                  {formatGold(pet.exchange?.minPrice)}
                </strong>
              </div>
            </div>

            <div className={styles.cardActions}>
              <Link
                href={`/pets?q=${encodeURIComponent(pet.name)}`}
                className={styles.cardLinkAction}
              >
                <span>View in Pet Database</span>
                <Icon name="chevronRight" size="xs" aria-hidden="true" />
              </Link>
              <Link
                href={`/pets/compare?pets=${encodeURIComponent(`db:${pet.name}`)}`}
                className={styles.cardIconAction}
                aria-label={`Compare ${pet.name} in Pet Comparison`}
              >
                <Icon name="petCompare" size="sm" aria-hidden="true" />
              </Link>
            </div>
          </article>
        );
      })}
    </section>
  );
}
