"use client";

import React from "react";
import { Badge, Icon } from "@/components/ui";
import { formatGuildNumber, formatGuildPosition, getIdleMmoProfileUrl } from "@/lib/guilds";
import styles from "../page.module.css";

export interface MemberLinkProps {
  member: {
    name: string;
    position?: string | null;
    total_level?: number | null;
  };
}

function getRoleBadgeVariant(position?: string | null): "warning" | "refined" | "neutral" {
  const normalized = String(position || "").toUpperCase();
  if (normalized === "LEADER") return "warning";
  if (normalized === "DEPUTY" || normalized === "OFFICER") return "refined";
  return "neutral";
}

export function MemberLink({ member }: MemberLinkProps) {
  return (
    <a
      className={styles.memberRow}
      href={getIdleMmoProfileUrl(member.name)}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${member.name} profile on IdleMMO`}
      title={`Open ${member.name} profile on IdleMMO`}
    >
      <div className={styles.memberIdentity}>
        <strong>{member.name}</strong>
        <Badge variant={getRoleBadgeVariant(member.position)} size="sm">
          {formatGuildPosition(member.position)}
        </Badge>
      </div>
      <span className={styles.memberLevel}>
        <span>{formatGuildNumber(member.total_level)} TL</span>
        <Icon name="externalLink" size="xs" aria-hidden="true" />
      </span>
    </a>
  );
}
