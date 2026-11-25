"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ProfileMuseumSnapshot } from "@/lib/museum";
import type { useProfiles } from "@/lib/profiles";
import type { MuseumCategorySummary } from "../types";
import { formatNumber, formatRelativeAge } from "../utils/museum-helpers";
import styles from "../page.module.css";

export function MuseumHero({
  loaded,
  activeProfile,
  museum,
  itemsCount,
  totalQuantity,
  summaries,
  onOpenSnapshotInfo,
}: {
  loaded: boolean;
  activeProfile: ReturnType<typeof useProfiles>["activeProfile"];
  museum: ProfileMuseumSnapshot | undefined;
  itemsCount: number;
  totalQuantity: number;
  summaries: MuseumCategorySummary[];
  onOpenSnapshotInfo: () => void;
}) {
  const hasPets = summaries.some((summary) => summary.category === "PETS" && summary.itemCount > 0);

  return (
    <section className={styles.hero}>
      <div className={styles.heroMain}>
        <div className={styles.eyebrow}>
          <Icon name="museum" size="sm" aria-hidden="true" />
          <span>Museum</span>
        </div>
        <h1 id="museum-page-title" className={styles.title}>Museum Collection</h1>
        <p className={styles.subtitle}>
          Browse unlocked collectibles, pets, bestiary entries, skins, and backgrounds on{" "}
          {activeProfile?.name || "your active character"}.
        </p>
        <div className={styles.heroStrip} aria-label="Collection summary">
          {!loaded ? (
            <>
              <Skeleton variant="text" width={72} height={18} />
              <Skeleton variant="text" width={88} height={18} />
              <Skeleton variant="text" width={120} height={18} />
            </>
          ) : (
            <>
              <span>{activeProfile?.name || "No profile"}</span>
              {itemsCount > 0 && (
                <>
                  <span>{formatNumber(itemsCount)} unique</span>
                  <span>{formatNumber(totalQuantity)} total collected</span>
                </>
              )}
              {museum?.importedAt && <span>Imported {formatRelativeAge(museum.importedAt)}</span>}
            </>
          )}
        </div>
      </div>

      <div className={styles.heroControls}>
        {!loaded ? (
          <>
            <Skeleton variant="rectangular" width={132} height={44} />
            <Skeleton variant="rectangular" width={136} height={44} />
          </>
        ) : (
          <>
            {museum && (
              <Button
                variant="secondary"
                size="md"
                icon={<Icon name="info" size="sm" aria-hidden="true" />}
                onClick={onOpenSnapshotInfo}
              >
                Snapshot Info
              </Button>
            )}
            {hasPets && (
              <Link className={styles.heroLinkButton} href="/pets/owned">
                <Icon name="petsOwned" size="sm" aria-hidden="true" />
                Owned Pets
              </Link>
            )}
            <Link className={styles.heroPrimaryLink} href="/profiles#profile-transfer">
              <Icon name="upload" size="sm" aria-hidden="true" />
              Import Profile
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
