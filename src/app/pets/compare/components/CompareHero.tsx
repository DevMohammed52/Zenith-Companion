import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
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
    <section className={styles.hero}>
      <div>
        <span className={styles.kicker}>
          <ZenithIcon name="pets" size={17} /> Pet Comparison
        </span>
        <h1 id="pet-compare-page-title">Compare Pets</h1>
        <p>
          Compare IdleMMO pet species and owned snapshots against the same level, mastery,
          food, and recorded battle sample.
        </p>
      </div>
      <div className={styles.heroActions}>
        <Link href="/pets" className={styles.secondaryLink}>
          Pet Database <ArrowRight size={16} />
        </Link>
        <button type="button" className={styles.secondaryLink} onClick={onClearComparison}>
          <Trash2 size={16} /> Clear comparison
        </button>
      </div>
      <div className={styles.heroStats} aria-label="Current pet comparison summary">
        <div>
          <span>Selected</span>
          <strong>
            {selectedCount}/{MAX_COMPARE}
          </strong>
        </div>
        <div>
          <span>Owned pool</span>
          <strong>{ownedPoolCount}</strong>
        </div>
        <div>
          <span>Battle data</span>
          <strong>{petsWithBattleCount}</strong>
        </div>
      </div>
    </section>
  );
}
