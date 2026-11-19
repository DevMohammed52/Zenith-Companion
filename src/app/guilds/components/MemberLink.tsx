"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { formatGuildNumber, formatGuildPosition, getIdleMmoProfileUrl } from "@/lib/guilds";
import styles from "../page.module.css";

export interface MemberLinkProps {
  member: {
    name: string;
    position?: string | null;
    total_level?: number | null;
  };
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
      <div>
        <strong>{member.name}</strong>
        <span>{formatGuildPosition(member.position)}</span>
      </div>
      <span className={styles.memberLevel}>
        {formatGuildNumber(member.total_level)} TL <ExternalLink size={13} aria-hidden="true" />
      </span>
    </a>
  );
}
