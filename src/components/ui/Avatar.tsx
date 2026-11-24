"use client";

import React, { useState } from "react";
import styles from "./Avatar.module.css";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "rounded";
export type AvatarRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
  size?: AvatarSize;
  shape?: AvatarShape;
  rarity?: AvatarRarity;
  badge?: boolean | number | string;
  className?: string;
}

export function Avatar({
  src,
  alt = "",
  fallback,
  size = "md",
  shape = "circle",
  rarity,
  badge,
  className = "",
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const sizeClass =
    size === "xs"
      ? styles.sizeXs
      : size === "sm"
      ? styles.sizeSm
      : size === "md"
      ? styles.sizeMd
      : size === "lg"
      ? styles.sizeLg
      : styles.sizeXl;

  const shapeClass = shape === "rounded" ? styles.shapeSquare : "";

  const rarityClass = rarity
    ? rarity === "uncommon"
      ? styles.rarityUncommon
      : rarity === "rare"
      ? styles.rarityRare
      : rarity === "epic"
      ? styles.rarityEpic
      : rarity === "legendary"
      ? styles.rarityLegendary
      : rarity === "mythic"
      ? styles.rarityMythic
      : styles.rarityCommon
    : "";

  const renderBadge = () => {
    if (badge === undefined || badge === false) return null;

    if (badge === true) {
      return (
        <span className={styles.badgeSlot}>
          <span className={styles.badgePip} aria-hidden="true" />
        </span>
      );
    }

    const badgeStr =
      typeof badge === "number" && badge > 99 ? "99+" : String(badge).slice(0, 4);

    return (
      <span className={styles.badgeSlot}>
        <span className={styles.badgeNumeric} aria-label={`Badge: ${badge}`}>
          {badgeStr}
        </span>
      </span>
    );
  };

  const showImage = src && !hasError;

  return (
    <div
      className={`${styles.root} ${sizeClass} ${shapeClass} ${className}`.trim()}
      data-rarity={rarity}
    >
      <div className={`${styles.inner} ${rarityClass}`}>
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={styles.image}
            style={{ opacity: isLoaded ? 1 : 0 }}
          />
        ) : null}

        {(!showImage || !isLoaded) && (
          <div className={styles.fallback} aria-hidden={alt === "" ? "true" : undefined}>
            {fallback || (alt ? alt.slice(0, 2).toUpperCase() : "?")}
          </div>
        )}
      </div>

      {renderBadge()}
    </div>
  );
}
