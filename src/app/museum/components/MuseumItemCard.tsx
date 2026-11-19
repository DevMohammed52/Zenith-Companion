import { museumCategoryLabel } from "@/lib/museum";
import { CATEGORY_ICONS, type MuseumItem } from "../types";
import { categoryTone, formatNumber } from "../utils/museum-helpers";
import styles from "../page.module.css";

const TONE_CLASSES: Record<string, string | undefined> = {
  violet: styles.toneViolet,
  cyan: styles.toneCyan,
  gold: styles.toneGold,
  green: styles.toneGreen,
  amber: styles.toneAmber,
  rose: styles.toneRose,
};

export function MuseumItemCard({ item }: { item: MuseumItem }) {
  const Icon = CATEGORY_ICONS[item.category];
  const tone = categoryTone(item.category);
  const toneClass = TONE_CLASSES[tone] || styles.toneViolet;

  return (
    <article
      className={`${styles.museumItem} ${toneClass}`}
      data-tone={tone}
    >
      <div className={styles.museumItemArt}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            width={60}
            height={60}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Icon size={28} aria-hidden="true" />
        )}
      </div>
      <div className={styles.museumItemBody}>
        <div>
          <span>{museumCategoryLabel(item.category)}</span>
          <strong>{item.name}</strong>
        </div>
        <small>ID {String(item.id)}</small>
      </div>
      <div className={styles.museumItemQuantity}>
        <span>Qty</span>
        <strong>{formatNumber(item.quantity)}</strong>
      </div>
    </article>
  );
}
