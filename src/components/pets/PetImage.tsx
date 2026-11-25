"use client";

import React from "react";
import { GameImage } from "@/components/GameImage";
import { Icon } from "@/components/ui/Icon";
import type { PetRecord } from "@/lib/pets";
import styles from "./PetImage.module.css";

/**
 * Shared companion sprite thumbnail with fallback icon and Wyrmshadow orientation handling.
 */
export function PetImage({
  pet,
  size = 44,
  className = "",
}: {
  pet: Pick<PetRecord, "name" | "imageUrl" | "egg">;
  size?: number;
  className?: string;
}) {
  const image = pet.imageUrl || pet.egg?.imageUrl;
  const isUpsideDown = pet.name === "Dead Wyrmshadow";

  return (
    <div
      className={`${styles.avatar} ${className}`.trim()}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {image ? (
        <GameImage
          src={image}
          alt={pet.name}
          width={size}
          height={size}
          sizes={`${size}px`}
          className={isUpsideDown ? styles.upsideDown : undefined}
          loading="lazy"
        />
      ) : (
        <Icon name="pets" size={size <= 36 ? "md" : "lg"} aria-hidden="true" />
      )}
    </div>
  );
}
