"use client";

import Link from "next/link";
import { EmptyState, Icon } from "@/components/ui";
import styles from "../page.module.css";

export function AlchemyEmptyState({
  mythicSearchMatches,
  onReset,
}: {
  mythicSearchMatches: string[];
  onReset: () => void;
}) {
  if (mythicSearchMatches.length > 0) {
    return (
      <EmptyState
        icon={<Icon name="mythicAlchemy" size="xl" aria-hidden="true" />}
        title="Level 90 Mythic recipes live in Mythic Lab"
        description={`${mythicSearchMatches.slice(0, 2).join(", ")} is a Level 90 Mythic recipe with 30-use scroll charges. Open Mythic Lab to optimize those runs.`}
        action={{
          label: "Reset Filters",
          onClick: onReset,
        }}
        secondaryAction={
          <Link href="/alchemy/mythic" className={styles.navPillLink}>
            <span>Open Mythic Lab</span>
          </Link>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<Icon name="searchEmpty" size="xl" aria-hidden="true" />}
      title="No alchemy recipes match those filters"
      description="Clear search or relax the level, profit, liquidity, or volume filters to bring recipes back."
      action={{
        label: "Reset Filters",
        onClick: onReset,
      }}
    />
  );
}
