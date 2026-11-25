"use client";

import { useState } from "react";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { Icon } from "@/components/ui/Icon";
import { museumCategoryLabel } from "@/lib/museum";
import { CATEGORY_ICONS, type MuseumItem } from "../types";
import { formatNumber } from "../utils/museum-helpers";
import styles from "../page.module.css";

export function MuseumItemCard({
  item,
  onInspectCollectible,
}: {
  item: MuseumItem;
  onInspectCollectible: (id: string, name: string) => void;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgSrc = item.imageUrl && item.imageUrl !== failedSrc ? item.imageUrl : null;
  const fallbackIcon = CATEGORY_ICONS[item.category];

  const actionNode =
    item.category === "COLLECTIBLES" ? (
      <button
        type="button"
        className={styles.cardAction}
        onClick={() => onInspectCollectible(String(item.id), item.name)}
        aria-label={`Inspect ${item.name}`}
        title={`Inspect ${item.name}`}
      >
        <Icon name="view" size="sm" aria-hidden="true" />
      </button>
    ) : item.category === "PETS" ? (
      <Link
        href={`/pets?pet=${encodeURIComponent(item.name)}`}
        className={styles.cardAction}
        aria-label={`Open ${item.name} in Pet Database`}
        title={`Open ${item.name} in Pet Database`}
      >
        <Icon name="pets" size="sm" aria-hidden="true" />
      </Link>
    ) : item.category === "BESTIARY" ? (
      <Link
        href={`/enemies?enemy=${encodeURIComponent(item.name)}`}
        className={styles.cardAction}
        aria-label={`Open ${item.name} in Enemy Database`}
        title={`Open ${item.name} in Enemy Database`}
      >
        <Icon name="combat" size="sm" aria-hidden="true" />
      </Link>
    ) : null;

  return (
    <article className={styles.itemCard}>
      <div className={styles.itemArt}>
        {imgSrc ? (
          <GameImage
            src={imgSrc}
            alt=""
            width={56}
            height={56}
            sizes="56px"
            loading="lazy"
            aria-hidden="true"
            onError={() => setFailedSrc(imgSrc)}
          />
        ) : (
          <Icon name={fallbackIcon} size="lg" aria-hidden="true" />
        )}
      </div>

      <div className={styles.itemBody}>
        <strong className={styles.itemName}>{item.name}</strong>
        <span className={styles.itemMetaStrip}>
          <span>{museumCategoryLabel(item.category)}</span>
          <span>Qty {formatNumber(item.quantity)}</span>
        </span>
      </div>

      {actionNode}
    </article>
  );
}
