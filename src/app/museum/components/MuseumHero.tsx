import Link from "next/link";
import ZenithIcon from "@/components/icons/ZenithIcon";
import type { useProfiles } from "@/lib/profiles";
import type { MuseumCategorySummary } from "../types";
import styles from "../page.module.css";

export function MuseumHero({
  activeProfile,
  summaries,
}: {
  activeProfile: ReturnType<typeof useProfiles>["activeProfile"];
  summaries: MuseumCategorySummary[];
}) {
  return (
    <section className={styles.museumHero}>
      <div className={styles.museumHeroCopy}>
        <span className={styles.eyebrow}>
          <ZenithIcon name="museum" size={14} /> Museum
        </span>
        <h1 id="museum-page-title">Museum Collection</h1>
        <p>
          Search the museum items saved on your active profile, then filter by
          collection type, quantity, and import status.
        </p>
      </div>
      <div
        className={styles.museumProfileCard}
        aria-label="Active profile museum source"
      >
        <span>Active Profile</span>
        <strong>{activeProfile?.name || "No profile selected"}</strong>
        <small>{activeProfile?.className || "Create or import a profile first"}</small>
        <div className={styles.museumProfileLinks}>
          <Link href="/profiles#profile-transfer">Import source</Link>
          {summaries.some(
            (summary) => summary.category === "PETS" && summary.itemCount > 0
          ) && <Link href="/pets/owned">Owned pets</Link>}
        </div>
      </div>
    </section>
  );
}
