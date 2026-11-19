import { BadgeCheck, Database, PawPrint, Shield } from "lucide-react";
import styles from "../page.module.css";

export function OwnedPetSummary({
  totalSaved,
  activeCount,
  manualCount,
  importedCount,
}: {
  totalSaved: number;
  activeCount: number;
  manualCount: number;
  importedCount: number;
}) {
  return (
    <section className={styles.summaryGrid} aria-label="Owned pet summary">
      <div>
        <Database size={17} />
        <span>Total saved</span>
        <strong>{totalSaved}</strong>
      </div>
      <div>
        <PawPrint size={17} />
        <span>Active/equipped</span>
        <strong>{activeCount}</strong>
      </div>
      <div>
        <BadgeCheck size={17} />
        <span>Manual</span>
        <strong>{manualCount}</strong>
      </div>
      <div>
        <Shield size={17} />
        <span>Imported</span>
        <strong>{importedCount}</strong>
      </div>
    </section>
  );
}
