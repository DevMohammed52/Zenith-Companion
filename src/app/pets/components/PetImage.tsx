"use client";

import React from "react";
import { PawPrint } from "lucide-react";
import { GameImage } from "@/components/GameImage";
import type { PetRecord } from "../types";
import styles from "./PetImage.module.css";

export function PetImage({
  pet,
  size = 44,
  className = "",
}: {
  pet: PetRecord;
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
        <PawPrint size={Math.round(size * 0.6)} aria-hidden="true" />
      )}
    </div>
  );
}
