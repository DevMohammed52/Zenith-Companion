import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import styles from "../page.module.css";

export function OwnedPetHeader({ onAddCurrentPet }: { onAddCurrentPet: () => void }) {
  return (
    <section className={styles.header}>
      <div>
        <span className={styles.kicker}>
          <ZenithIcon name="pets" size={17} /> Profile Pets
        </span>
        <h1 id="owned-pets-page-title">Owned Pets</h1>
        <p>
          Saved pets belong to the active local profile and stay in browser storage until imported,
          added, used, or removed.
        </p>
      </div>
      <div className={styles.actions}>
        <Link href="/profiles#profile-pet" className={styles.secondaryAction}>
          Profile pet <ArrowRight size={16} />
        </Link>
        <button type="button" className={styles.primaryAction} onClick={onAddCurrentPet}>
          <Plus size={16} /> Add active pet
        </button>
      </div>
    </section>
  );
}
