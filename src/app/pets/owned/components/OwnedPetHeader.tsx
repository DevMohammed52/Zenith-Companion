import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import styles from "../page.module.css";

export function OwnedPetHeader({
  loaded,
  totalSaved,
  ownedSpeciesCount,
  totalCatalogSpeciesCount,
  activeCount,
  importedCount,
  manualCount,
  hasProfile,
  onAddCurrentPet,
}: {
  loaded: boolean;
  totalSaved: number;
  ownedSpeciesCount: number;
  totalCatalogSpeciesCount: number;
  activeCount: number;
  importedCount: number;
  manualCount: number;
  hasProfile: boolean;
  onAddCurrentPet: () => void;
}) {
  const val = (n: number) => (loaded ? String(n) : "—");

  return (
    <header className={styles.hero}>
      <div className={styles.heroMain}>
        <div className={styles.kicker}>
          <Icon name="petsOwned" size="sm" aria-hidden="true" />
          <span>Owned Pets</span>
        </div>
        <h1 id="owned-pets-page-title" className={styles.heroTitle}>
          Owned Pets
        </h1>
        <p className={styles.heroSubtitle}>
          Manage your equipped pet, check health and location locks, compare pets side by side, and spot missing pets.
        </p>

        <div className={styles.metaStrip} aria-label="Owned pets summary">
          <span className={styles.metaPill}>
            Saved: <strong>{val(totalSaved)}</strong>
          </span>
          <span className={styles.metaPill}>
            Collection:{" "}
            <strong>
              {loaded && totalCatalogSpeciesCount > 0
                ? `${ownedSpeciesCount} / ${totalCatalogSpeciesCount}`
                : "—"}
            </strong>
          </span>
          <span className={styles.metaPill}>
            Equipped: <strong>{val(activeCount)}</strong>
          </span>
          <span className={styles.metaPill}>
            Imported: <strong>{val(importedCount)}</strong>
          </span>
          <span className={styles.metaPill}>
            Manual: <strong>{val(manualCount)}</strong>
          </span>
        </div>
      </div>

      <div className={styles.heroActions}>
        <Link href="/profiles#profile-pet" className={styles.heroNavLink}>
          <span>Profile pet</span>
          <Icon name="chevronRight" size="sm" aria-hidden="true" />
        </Link>
        <Button
          variant="primary"
          size="md"
          onClick={onAddCurrentPet}
          disabled={!hasProfile}
          icon={<Icon name="plus" size="sm" aria-hidden="true" />}
        >
          Add active pet
        </Button>
      </div>
    </header>
  );
}
