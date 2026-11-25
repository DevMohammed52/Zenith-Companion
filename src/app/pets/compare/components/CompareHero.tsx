import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MAX_COMPARE } from "../types";
import styles from "../page.module.css";

export function CompareHero({
  selectedCount,
  ownedPoolCount,
  petsWithBattleCount,
  onClearComparison,
}: {
  selectedCount: number;
  ownedPoolCount: number;
  petsWithBattleCount: number;
  onClearComparison: () => void;
}) {
  return (
    <header className={styles.hero}>
      <div className={styles.heroMain}>
        <div className={styles.kicker}>
          <Icon name="petCompare" size="sm" aria-hidden="true" />
          <span>Companion Comparison</span>
        </div>
        <h1 id="pet-compare-page-title" className={styles.heroTitle}>
          Compare Pets
        </h1>
        <p className={styles.heroSubtitle}>
          Compare database species and owned snapshots side by side under shared level, mastery, and battle settings.
        </p>

        <div className={styles.metaStrip} aria-label="Comparison summary">
          <span className={styles.metaPill}>
            Selected: <strong>{selectedCount} / {MAX_COMPARE}</strong>
          </span>
          <span className={styles.metaPill}>
            Owned Pool: <strong>{ownedPoolCount}</strong>
          </span>
          <span className={styles.metaPill}>
            Battle Samples: <strong>{petsWithBattleCount} pets</strong>
          </span>
        </div>
      </div>

      <div className={styles.heroActions}>
        <Link href="/pets" className={styles.heroNavLink}>
          <span>Pet Database</span>
          <Icon name="chevronRight" size="sm" aria-hidden="true" />
        </Link>
        <Button
          variant="secondary"
          size="md"
          onClick={onClearComparison}
          disabled={selectedCount === 0}
          icon={<Icon name="trash" size="sm" aria-hidden="true" />}
        >
          Clear
        </Button>
      </div>
    </header>
  );
}
