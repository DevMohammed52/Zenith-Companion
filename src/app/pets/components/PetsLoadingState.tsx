import { Skeleton, SkeletonContainer } from "@/components/ui/Skeleton";
import styles from "../Pets.module.css";

export function PetsGridSkeleton() {
  return (
    <SkeletonContainer announcement="Loading pet database, evolution formulas, and exchange prices...">
      <div className={styles.cardGrid} style={{ minHeight: "920px" }}>
        {Array.from({ length: 9 }, (_, index) => (
          <Skeleton key={index} variant="rectangular" height={172} />
        ))}
      </div>
    </SkeletonContainer>
  );
}

export function PetsShellFallback() {
  return (
    <main className={styles.page}>
      <SkeletonContainer announcement="Loading pet database, evolution formulas, and exchange prices...">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6, 24px)" }}>
          <Skeleton variant="rectangular" height={150} />
          <Skeleton variant="rectangular" height={168} />
          <div className={styles.cardGrid} style={{ minHeight: "920px" }}>
            {Array.from({ length: 9 }, (_, index) => (
              <Skeleton key={index} variant="rectangular" height={172} />
            ))}
          </div>
        </div>
      </SkeletonContainer>
    </main>
  );
}
