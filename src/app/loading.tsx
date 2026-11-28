import { Skeleton, SkeletonContainer } from "@/components/ui/Skeleton";
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <main className={styles.page}>
      <SkeletonContainer
        busy
        announcement="Loading Zenith Companion..."
        className={styles.shellStack}
      >
        {/* Top Hero / Header Placeholder */}
        <section className={styles.heroCard} aria-hidden="true">
          <div className={styles.heroIdentity}>
            <Skeleton width={116} height={116} />
            <div className={styles.heroLines}>
              <Skeleton width={210} height={28} />
              <div className={styles.pillRow}>
                <Skeleton variant="text" width={92} height={18} />
                <Skeleton variant="text" width={112} height={18} />
                <Skeleton variant="text" width={96} height={18} />
              </div>
            </div>
          </div>
          <div className={styles.heroTiles}>
            <Skeleton width="100%" height={68} />
            <Skeleton width="100%" height={68} />
            <Skeleton width="100%" height={68} />
          </div>
        </section>

        {/* Primary Split Workspace (7fr / 5fr bento cadence) */}
        <section className={styles.splitGrid} aria-hidden="true">
          <div className={styles.panelCard}>
            <div className={styles.panelTop}>
              <Skeleton width={160} height={20} />
              <Skeleton variant="text" width={72} height={16} />
            </div>
            <div className={styles.ledgerStack}>
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className={styles.ledgerRow}>
                  <Skeleton width={28} height={28} />
                  <div className={styles.ledgerText}>
                    <Skeleton variant="text" width="58%" height={15} />
                    <Skeleton variant="text" width="34%" height={12} />
                  </div>
                  <Skeleton variant="text" width={64} height={16} />
                </div>
              ))}
            </div>
            <div className={styles.footerTiles}>
              <Skeleton width="100%" height={64} />
              <Skeleton width="100%" height={64} />
              <Skeleton width="100%" height={64} />
            </div>
          </div>

          <div className={styles.sideColumn}>
            <div className={styles.panelCard}>
              <div className={styles.panelTop}>
                <Skeleton width={120} height={20} />
                <Skeleton variant="text" width={68} height={16} />
              </div>
              <div className={styles.sideSplit}>
                <div className={styles.sideLines}>
                  <Skeleton width={150} height={22} />
                  <Skeleton variant="text" width={110} height={15} />
                  <Skeleton variant="text" width={88} height={18} />
                </div>
                <Skeleton width={96} height={96} />
              </div>
            </div>

            <div className={styles.panelCard}>
              <div className={styles.panelTop}>
                <Skeleton width={140} height={20} />
                <Skeleton variant="text" width={64} height={16} />
              </div>
              <Skeleton width="100%" height={68} />
              <div className={styles.panelTop}>
                <Skeleton variant="text" width={128} height={14} />
                <Skeleton variant="text" width={140} height={14} />
              </div>
            </div>
          </div>
        </section>

        {/* Bottom 3-Column Reference Strip */}
        <section className={styles.bottomGrid} aria-hidden="true">
          {[0, 1, 2].map((card) => (
            <div key={card} className={styles.panelCard}>
              <div className={styles.panelTop}>
                <Skeleton width={132} height={18} />
                <Skeleton variant="text" width={56} height={14} />
              </div>
              <Skeleton width="100%" height={38} />
              <Skeleton width="100%" height={38} />
              <Skeleton width="84%" height={38} />
            </div>
          ))}
        </section>
      </SkeletonContainer>
    </main>
  );
}
