"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "../Profiles.module.css";
import { PROFILE_SECTIONS } from "../types";

export function ProfilesLoadingShell() {
  return (
    <main className={`container ${styles.page}`} aria-busy="true" aria-live="polite">
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <div className={styles.headerTitleRow}>
            <span className={styles.headerIcon} aria-hidden="true">
              <Icon name="profileSwitch" size="lg" />
            </span>
            <h1 className="header-title" style={{ margin: 0 }}>
              Profiles
            </h1>
          </div>
          <p className={styles.subtitle}>Preparing your local character roster and workspace.</p>
        </div>
        <div className={styles.headerActions} aria-hidden="true">
          <Skeleton width={120} height={44} />
          <Skeleton width={132} height={44} />
        </div>
      </header>

      <section className={`${styles.layout} profile-layout`} aria-label="Profile manager loading">
        <section className={`${styles.listPanel} profile-list-panel`}>
          <div className={styles.listHeader}>
            <div className={styles.listHeaderLeft}>
              <h2>Character Roster</h2>
            </div>
            <Skeleton width={140} height={20} />
          </div>
          <div className={styles.profileList}>
            {Array.from({ length: 3 }).map((_, index) => (
              <div className={styles.profileListItem} key={index}>
                <Skeleton width={40} height={40} />
                <div style={{ display: "grid", gap: "0.35rem" }}>
                  <Skeleton variant="text" width="80%" height={14} />
                  <Skeleton variant="text" width="60%" height={12} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <nav className={styles.sectionNav} aria-label="Profile sections loading">
          {PROFILE_SECTIONS.map(([id, label]) => (
            <span key={id} className={styles.sectionTab} aria-disabled="true">
              {label}
            </span>
          ))}
        </nav>

        <div className={`${styles.editor} profile-editor`} style={{ minHeight: "560px", contain: "layout" }}>
          <section className={styles.panel} tabIndex={-1}>
            <div className={styles.panelHeading}>
              <div>
                <h2>Identity</h2>
                <p>Preparing saved character data.</p>
              </div>
            </div>
            <div style={{ display: "grid", gap: "1rem" }}>
              <Skeleton width="100%" height={88} />
              <div className={styles.gridThree}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} width="100%" height={44} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
