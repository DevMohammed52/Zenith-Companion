"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { Icon } from "@/components/ui/Icon";
import { QUALITY_PALETTE } from "@/lib/quality";
import { MEMBERSHIP_BADGE_URL, type ActivePetHighlight } from "../types";
import styles from "../page.module.css";

interface DashboardHeroProps {
  hasConfiguredProfile: boolean;
  hasMembership: boolean;
  activeProfileName: string;
  activeProfileClass: string;
  activeProfileImageUrl: string;
  activeProfileBackgroundUrl: string;
  guildLabel: string | null;
  totalLevel: number;
  combatLevel: number;
  activePet: ActivePetHighlight | null;
  equippedGearCount: number;
  ownedPetsCount: number;
  museumItemCount: number;
  petSpeciesCount: number;
}

export function DashboardHero({
  hasConfiguredProfile,
  hasMembership,
  activeProfileName,
  activeProfileClass,
  activeProfileImageUrl,
  activeProfileBackgroundUrl,
  guildLabel,
  totalLevel,
  combatLevel,
  activePet,
  equippedGearCount,
  ownedPetsCount,
  museumItemCount,
  petSpeciesCount,
}: DashboardHeroProps) {
  const petPalette = activePet ? QUALITY_PALETTE[activePet.quality] : null;
  const showMembershipStyle = hasConfiguredProfile && hasMembership;

  return (
    <header className={styles.spotlight}>
      {hasConfiguredProfile && activeProfileBackgroundUrl && (
        <GameImage
          src={activeProfileBackgroundUrl}
          alt=""
          width={1200}
          height={240}
          loading="eager"
          className={styles.spotlightBg}
        />
      )}
      <div className={styles.spotlightScrim} aria-hidden="true" />

      <div className={styles.spotlightIdentity}>
        <div
          className={
            hasConfiguredProfile && activePet?.imageUrl
              ? activePet.showcase.placement === "behind"
                ? `${styles.characterStage} ${styles.characterStageBehindPet}`
                : `${styles.characterStage} ${styles.characterStageSidePet}`
              : styles.characterStage
          }
        >
          <div className={styles.heroFigureWrap}>
            <span className={styles.characterFloorGlow} aria-hidden="true" />
            <GameImage
              src={activeProfileImageUrl}
              alt={activeProfileName}
              width={140}
              height={148}
              loading="eager"
              className={styles.characterSprite}
              fallback={<Icon name="profile" size="xl" aria-hidden="true" />}
            />
          </div>
          {hasConfiguredProfile && activePet?.imageUrl && (
            <Link
              href="/pets/owned"
              className={[
                styles.companionStage,
                activePet.showcase.placement === "behind"
                  ? styles.companionBehindHero
                  : styles.companionNearHero,
                activePet.quality === "MYTHIC" ? styles.companionMythicStage : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                {
                  "--pet-size": `${activePet.showcase.sizePx}px`,
                  "--pet-hover": `-${activePet.showcase.hoverPx}px`,
                } as CSSProperties
              }
              aria-label={`Active companion pet: ${activePet.displayName}`}
              title={`${activePet.displayName} (Lv. ${activePet.level})`}
            >
              <span className={styles.companionFloorGlow} aria-hidden="true" />
              <GameImage
                src={activePet.imageUrl}
                alt=""
                width={activePet.showcase.sizePx}
                height={activePet.showcase.sizePx}
                loading="eager"
                className={
                  activePet.showcase.isUpsideDown
                    ? `${styles.companionSprite} ${styles.companionUpsideDown}`
                    : styles.companionSprite
                }
              />
            </Link>
          )}
        </div>

        <div className={styles.identityCopy}>
          <div className={styles.nameRow}>
            <h1 className={styles.characterName}>
              {hasConfiguredProfile ? (
                showMembershipStyle ? (
                  <span className={styles.membershipNameWrap}>
                    <span className={styles.membershipGradient}>{activeProfileName}</span>
                    <GameImage
                      src={MEMBERSHIP_BADGE_URL}
                      alt="Active membership"
                      width={20}
                      height={20}
                      loading="eager"
                      className={styles.membershipBadgeIcon}
                    />
                  </span>
                ) : (
                  activeProfileName
                )
              ) : (
                "IdleMMO Companion"
              )}
            </h1>
            {hasConfiguredProfile && guildLabel && (
              <span className={styles.guildTag}>{guildLabel}</span>
            )}
            <span className={styles.classPill}>
              {hasConfiguredProfile ? activeProfileClass : "Guest Preview"}
            </span>
          </div>

          <div className={styles.identityStatsRow}>
            {hasConfiguredProfile ? (
              <>
                <span className={styles.identityStat}>
                  Total <strong>Lv. {totalLevel.toLocaleString()}</strong>
                </span>
                <span className={styles.hairlineV} aria-hidden="true" />
                <span className={styles.identityStat}>
                  Combat <strong>Lv. {combatLevel.toLocaleString()}</strong>
                </span>
                {activePet && (
                  <>
                    <span className={styles.hairlineV} aria-hidden="true" />
                    <Link
                      href="/pets/owned"
                      className={styles.petInlineLink}
                      style={petPalette ? { color: petPalette.textColor } : undefined}
                    >
                      {activePet.displayName} (Lv. {activePet.level})
                    </Link>
                  </>
                )}
              </>
            ) : (
              <span className={styles.identityStat}>
                Live market gold rates, world bosses, zone weather, and character tools.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.spotlightMetrics} role="group" aria-label="Character quick stats">
        <Link href="/bis" className={styles.spotlightTile}>
          <span className={styles.spotlightTileLabel}>Gear</span>
          <strong className={styles.spotlightTileVal}>{equippedGearCount} / 9 slots</strong>
        </Link>

        <Link href="/pets/owned" className={styles.spotlightTile}>
          <span className={styles.spotlightTileLabel}>Pets</span>
          <strong className={styles.spotlightTileVal}>
            {ownedPetsCount > 0 ? `${ownedPetsCount} owned` : `${petSpeciesCount} species`}
          </strong>
        </Link>

        <Link href={museumItemCount > 0 ? "/museum" : "/profiles"} className={styles.spotlightTile}>
          <span className={styles.spotlightTileLabel}>
            {museumItemCount > 0 ? "Museum" : "Profile"}
          </span>
          <strong className={styles.spotlightTileVal}>
            {museumItemCount > 0 ? `${museumItemCount.toLocaleString()} items` : hasConfiguredProfile ? "Manage" : "Import ID"}
          </strong>
        </Link>
      </div>
    </header>
  );
}
