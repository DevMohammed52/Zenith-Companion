"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Check, ExternalLink, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import styles from "./SiteFooter.module.css";

const IDLE_MMO_PROFILE_URL = "https://web.idle-mmo.com/@D3vxGh0st";
const IDLE_MMO_GAME_URL = "https://web.idle-mmo.com";
const DISCORD_HANDLE = "d3v_gh0st";

export default function SiteFooter() {
  const { toast } = useToast();
  const [copiedDiscord, setCopiedDiscord] = useState(false);

  const handleCopyDiscord = async () => {
    try {
      await navigator.clipboard.writeText(DISCORD_HANDLE);
      setCopiedDiscord(true);
      toast.success("Discord handle copied: d3v_gh0st");
      setTimeout(() => setCopiedDiscord(false), 2000);
    } catch {
      toast.error("Failed to copy Discord handle.");
    }
  };

  return (
    <footer className={styles.footer} aria-label="Project information and external links">
      <div className={styles.container}>
        <div className={styles.mainSection}>
          <div className={styles.brandBlock}>
            <div className={styles.brandHeader}>
              <span className={styles.brandName}>Zenith Companion</span>
              <span className={styles.privacyPill}>Local-first</span>
            </div>
            <p className={styles.description}>
              Market prices, crafting recipes, and skilling calculators for IdleMMO.
              Your data stays in your browser.
            </p>
          </div>

          <div className={styles.linksGroup}>
            <div className={styles.navColumn}>
              <span className={styles.columnHeading}>Quick Links</span>
              <div className={styles.linkList}>
                <Link href="/items" className={styles.footerLink}>
                  Items Database
                </Link>
                <Link href="/alchemy" className={styles.footerLink}>
                  Alchemy Calculator
                </Link>
                <Link href="/bosses" className={styles.footerLink}>
                  World Bosses
                </Link>
                <Link href="/settings" className={styles.footerLink}>
                  Settings
                </Link>
              </div>
            </div>

            <div className={styles.communityColumn}>
              <span className={styles.columnHeading}>Community</span>
              <div className={styles.communityLinks}>
                <a
                  href={IDLE_MMO_GAME_URL}
                  className={styles.footerLink}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open IdleMMO game website (opens in new tab)"
                >
                  <span>Play IdleMMO</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
                <a
                  href={IDLE_MMO_PROFILE_URL}
                  className={styles.footerLink}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open creator D3vxGh0st profile on IdleMMO (opens in new tab)"
                >
                  <span>Creator Profile</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={handleCopyDiscord}
                  className={styles.copyButton}
                  aria-label={`Copy Discord username ${DISCORD_HANDLE} to clipboard`}
                >
                  <MessageSquare size={13} aria-hidden="true" />
                  <span>{copiedDiscord ? "Copied!" : `Discord: ${DISCORD_HANDLE}`}</span>
                  {copiedDiscord ? (
                    <Check size={12} className={styles.checkIcon} aria-hidden="true" />
                  ) : (
                    <Copy size={12} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p className={styles.disclaimer}>
            Zenith Companion is a community fan project. Not affiliated with, endorsed by, or connected to
            Galahad Creative or IdleMMO. IdleMMO trademarks and game assets belong to Galahad Creative.
          </p>
        </div>
      </div>
    </footer>
  );
}
