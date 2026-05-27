"use client";

import Link from "next/link";
import { AlertTriangle, Home, PackageSearch, RefreshCw } from "lucide-react";
import styles from "./AppErrorFallback.module.css";

type AppErrorFallbackProps = {
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  reset?: () => void;
  fullScreen?: boolean;
};

export default function AppErrorFallback({
  code,
  eyebrow,
  title,
  description,
  reset,
  fullScreen = false,
}: AppErrorFallbackProps) {
  return (
    <main className={`${styles.errorFallback} ${fullScreen ? styles.fullScreen : ""}`}>
      <section className={styles.panel} aria-labelledby="error-title">
        <div className={styles.code}>{code}</div>
        <div className={styles.copy}>
          <p className={styles.kicker}>{eyebrow}</p>
          <h1 id="error-title">{title}</h1>
          <p>{description}</p>
        </div>
        <div className={styles.actions}>
          {reset ? (
            <button type="button" className={styles.primaryAction} onClick={reset}>
              <RefreshCw aria-hidden="true" size={18} />
              Try again
            </button>
          ) : null}
          <Link className={reset ? styles.secondaryAction : styles.primaryAction} href="/">
            <Home aria-hidden="true" size={18} />
            Dashboard
          </Link>
          <Link className={styles.secondaryAction} href="/items">
            <PackageSearch aria-hidden="true" size={18} />
            Search items
          </Link>
        </div>
      </section>

      <aside className={styles.note} aria-label="Error handling note">
        <AlertTriangle aria-hidden="true" size={18} />
        <span>Details are kept out of the browser. Check server logs for the underlying error.</span>
      </aside>
    </main>
  );
}
