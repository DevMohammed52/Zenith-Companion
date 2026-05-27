import { Compass } from "lucide-react";
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <main
      className={styles.loadingShell}
      aria-busy="true"
      aria-label="Loading Zenith Companion"
      aria-live="polite"
      role="status"
    >
      <section className={styles.loadingPanel}>
        <header className={styles.loadingHeader}>
          <div className={styles.loadingMark}>
            <span className={styles.scanBeam} aria-hidden="true" />
            <Compass aria-hidden="true" size={23} />
            <span className={styles.routeTrace} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>
          <div className={styles.loadingCopy}>
            <span>Zenith Companion</span>
            <strong>Preparing panel</strong>
          </div>
        </header>

        <div className={styles.skeletonFrame} aria-hidden="true">
          <div className={styles.skeletonTopline}>
            <span className={`${styles.skeletonBlock} ${styles.titleBlock}`} />
            <span className={`${styles.skeletonBlock} ${styles.statusPill}`} />
          </div>

          <div className={styles.metricGrid}>
            {[0, 1, 2].map((item) => (
              <span className={styles.metricShell} key={item}>
                <span className={`${styles.skeletonBlock} ${styles.metricValue}`} />
                <span className={`${styles.skeletonBlock} ${styles.metricLabel}`} />
              </span>
            ))}
          </div>

          <div className={styles.contentGrid}>
            <div className={styles.chartShell}>
              <span className={`${styles.skeletonBlock} ${styles.chartHeader}`} />
              <div className={styles.chartBars}>
                {[46, 68, 38, 78, 54, 63].map((height, index) => (
                  <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>

            <div className={styles.rowStack}>
              {[0, 1, 2, 3].map((item) => (
                <span className={styles.rowShell} key={item}>
                  <span className={styles.rowIcon} />
                  <span className={`${styles.skeletonBlock} ${styles.rowMain}`} />
                  <span className={`${styles.skeletonBlock} ${styles.rowMeta}`} />
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className={styles.loadingHint}>Preparing the next Zenith panel.</p>
      </section>
    </main>
  );
}
