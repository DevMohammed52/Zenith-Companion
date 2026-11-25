"use client";

import React from "react";
import { EnemyModal } from "@/components/EnemyModal";
import type { EnrichedEnemy } from "@/lib/world-intelligence";

export function EnemyDetailModal({
  enemy,
  marketData,
  onClose,
  onOpenItem,
}: {
  enemy: EnrichedEnemy;
  marketData?: Record<string, any> | null;
  onClose: () => void;
  onOpenItem: (name: string) => void;
}) {
  return (
    <EnemyModal
      enemy={enemy}
      marketData={marketData}
      onClose={onClose}
      onOpenItem={onOpenItem}
      context="enemies"
    />
  );
}
