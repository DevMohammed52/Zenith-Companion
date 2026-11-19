import { AlertTriangle, Clock3, Database, PawPrint, Shield } from "lucide-react";
import type { ProfileImportSource } from "@/lib/profiles";
import {
  formatDateTime,
  formatSectionList,
  formatSourceMode,
} from "../utils/owned-pet-helpers";
import styles from "../page.module.css";

export function OwnedPetImportReadiness({
  importSource,
  hasImportedPetSection,
  missingOrPrivate,
  unmatchedSpeciesCount,
}: {
  importSource?: ProfileImportSource;
  hasImportedPetSection: boolean;
  missingOrPrivate: string[];
  unmatchedSpeciesCount: number;
}) {
  return (
    <section className={styles.importReadiness} aria-label="Owned pet import readiness">
      <div>
        <Shield size={16} />
        <span>Profile source</span>
        <strong>{formatSourceMode(importSource?.mode)}</strong>
      </div>
      <div>
        <Clock3 size={16} />
        <span>Last import</span>
        <strong>
          {formatDateTime(importSource?.importedAt || importSource?.refreshedAt)}
        </strong>
      </div>
      <div>
        <Database size={16} />
        <span>Pet section</span>
        <strong>{hasImportedPetSection ? "Imported" : "Not imported"}</strong>
      </div>
      <div className={missingOrPrivate.length ? styles.warningCell : ""}>
        <AlertTriangle size={16} />
        <span>Missing/private</span>
        <strong>{formatSectionList(missingOrPrivate)}</strong>
      </div>
      <div className={unmatchedSpeciesCount ? styles.warningCell : ""}>
        <PawPrint size={16} />
        <span>Database links</span>
        <strong>
          {unmatchedSpeciesCount
            ? `${unmatchedSpeciesCount} not linked yet`
            : "All linked"}
        </strong>
      </div>
    </section>
  );
}
