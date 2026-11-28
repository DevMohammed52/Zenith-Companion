"use client";

import { useState } from "react";
import Link from "next/link";
import { ZenithMark } from "@/components/brand/ZenithBrand";
import { Icon } from "@/components/ui/Icon";
import { clearTransientUiCache } from "@/lib/route-recovery";
import styles from "./AppErrorFallback.module.css";

type AppErrorFallbackProps = {
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  digest?: string;
  reset?: () => void;
  fullScreen?: boolean;
};

export default function AppErrorFallback({
  code,
  eyebrow,
  title,
  description,
  digest,
  reset,
  fullScreen = false,
}: AppErrorFallbackProps) {
  const [copiedDigest, setCopiedDigest] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);

  const handleReload = () => {
    window.location.reload();
  };

  const handleCopyDigest = async () => {
    if (!digest) return;
    try {
      await navigator.clipboard?.writeText(digest);
      setCopiedDigest(true);
      window.setTimeout(() => setCopiedDigest(false), 2000);
    } catch {
      setCopiedDigest(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const cleared = await clearTransientUiCache();
      setCacheMessage(
        cleared > 0
          ? `Cleared ${cleared} cached session entries. Your profiles and crafting queues are intact.`
          : "Transient cache is already clean. Saved profiles and queues remain intact.",
      );
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <main className={`${styles.page} ${fullScreen ? styles.fullScreen : ""}`}>
      <section className={styles.panel} aria-labelledby="error-title">
        <div className={styles.topRow}>
          <div className={styles.identity}>
            <span className={styles.markWrap}>
              <ZenithMark size={24} variant="shaded" idPrefix="err-mark" />
            </span>
            <span className={styles.eyebrow}>{eyebrow}</span>
          </div>
          <span className={styles.codeBadge}>Error {code}</span>
        </div>

        <div className={styles.copy}>
          <h1 id="error-title" className={styles.heading}>
            {title}
          </h1>
          <p className={styles.description}>{description}</p>
        </div>

        <div className={styles.actions}>
          {reset && (
            <button type="button" className={styles.primaryAction} onClick={reset}>
              <Icon name="refresh" size="sm" aria-hidden="true" />
              <span>Try again</span>
            </button>
          )}
          <button
            type="button"
            className={reset ? styles.secondaryAction : styles.primaryAction}
            onClick={handleReload}
          >
            <Icon name="refresh" size="sm" aria-hidden="true" />
            <span>Reload page</span>
          </button>
          {fullScreen ? (
            <>
              <a className={styles.secondaryAction} href="/">
                <Icon name="dashboard" size="sm" aria-hidden="true" />
                <span>Dashboard</span>
              </a>
              <a className={styles.secondaryAction} href="/items">
                <Icon name="items" size="sm" aria-hidden="true" />
                <span>Items Database</span>
              </a>
            </>
          ) : (
            <>
              <Link className={styles.secondaryAction} href="/">
                <Icon name="dashboard" size="sm" aria-hidden="true" />
                <span>Dashboard</span>
              </Link>
              <Link className={styles.secondaryAction} href="/items">
                <Icon name="items" size="sm" aria-hidden="true" />
                <span>Items Database</span>
              </Link>
            </>
          )}
        </div>

        <div className={styles.statusFooter}>
          <div className={styles.assuranceRow}>
            <Icon name="defense" size="sm" className={styles.assuranceIcon} aria-hidden="true" />
            <span>Saved character profiles, settings, and crafting queues remain stored in this browser.</span>
          </div>

          {digest && (
            <div className={styles.digestRow}>
              <span className={styles.digestLabel}>Reference</span>
              <code className={styles.digestCode}>{digest}</code>
              <button
                type="button"
                className={styles.digestCopyBtn}
                onClick={handleCopyDigest}
                aria-label="Copy error reference"
              >
                <Icon name={copiedDigest ? "check" : "copy"} size="xs" aria-hidden="true" />
                <span>{copiedDigest ? "Copied" : "Copy"}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      <section className={styles.recoveryCard} aria-label="Troubleshooting options">
        <button
          type="button"
          className={styles.recoveryToggle}
          onClick={() => setShowRecovery((prev) => !prev)}
          aria-expanded={showRecovery}
        >
          <span className={styles.recoveryToggleLeft}>
            <Icon name="warning" size="sm" aria-hidden="true" />
            <span>Troubleshooting and local recovery</span>
          </span>
          <Icon name={showRecovery ? "chevronUp" : "chevronDown"} size="sm" aria-hidden="true" />
        </button>

        {showRecovery && (
          <div className={styles.recoveryBody}>
            <p className={styles.recoveryDesc}>
              If a recent update left stale scripts or session state in this tab, clear transient cache and reload without touching saved profiles or queues.
            </p>
            <div className={styles.recoveryActions}>
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={handleClearCache}
                disabled={clearingCache}
              >
                <Icon name="trash" size="sm" aria-hidden="true" />
                <span>{clearingCache ? "Clearing..." : "Clear transient cache"}</span>
              </button>
              {fullScreen ? (
                <a href="/profiles" className={styles.secondaryAction}>
                  <Icon name="profile" size="sm" aria-hidden="true" />
                  <span>Manage profile backups</span>
                </a>
              ) : (
                <Link href="/profiles" className={styles.secondaryAction}>
                  <Icon name="profile" size="sm" aria-hidden="true" />
                  <span>Manage profile backups</span>
                </Link>
              )}
            </div>
            {cacheMessage && (
              <p className={styles.cacheResult} role="status">
                {cacheMessage}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
