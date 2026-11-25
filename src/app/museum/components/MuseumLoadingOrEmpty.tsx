"use client";

import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { IconConcept } from "@/lib/icons";
import styles from "../page.module.css";

export function MuseumLoading() {
  return (
    <div className={styles.loadingWrap} aria-busy="true" aria-label="Loading museum collection">
      <div className={styles.loadingControls} aria-hidden="true">
        <div className={styles.loadingCategoryGrid}>
          {Array.from({ length: 7 }).map((_, idx) => (
            <Skeleton key={idx} variant="rectangular" width="100%" height={44} />
          ))}
        </div>
        <Skeleton variant="rectangular" width="100%" height={44} />
      </div>
      <Skeleton variant="text" width={220} height={18} aria-hidden="true" />
      <div className={styles.itemGrid} aria-hidden="true">
        {Array.from({ length: 8 }).map((_, idx) => (
          <Skeleton key={idx} variant="rectangular" width="100%" height={84} />
        ))}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        Checking browser-saved profiles for museum items.
      </p>
    </div>
  );
}

export function MuseumEmptySnapshot({
  icon,
  variant = "default",
  title,
  body,
}: {
  icon: IconConcept;
  variant?: "default" | "error";
  title: string;
  body: string;
}) {
  const router = useRouter();

  return (
    <section className={styles.emptyPanel}>
      <EmptyState
        icon={icon}
        variant={variant}
        title={title}
        description={body}
        action={{
          label: "Import or Refresh Profile",
          onClick: () => router.push("/profiles#profile-transfer"),
        }}
      />
    </section>
  );
}
