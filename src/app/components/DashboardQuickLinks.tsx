"use client";

import Link from "next/link";
import ZenithIcon from "@/components/icons/ZenithIcon";

export interface DashboardQuickLinksProps {
  ownedPetsCount?: number;
  activeMythicNames: string[];
}

export function DashboardQuickLinks({
  ownedPetsCount,
  activeMythicNames,
}: DashboardQuickLinksProps) {
  return (
    <section className="command-secondary-strip" aria-label="Quick links">
      <Link href="/pets" className="command-mini-card">
        <ZenithIcon name="pets" size={17} />
        <span>Pet Database</span>
        <strong>{ownedPetsCount ? `${ownedPetsCount} owned` : "109 species"}</strong>
      </Link>
      <Link href="/alchemy/mythic" className="command-mini-card">
        <ZenithIcon name="spark" size={17} />
        <span>Mythic Lab</span>
        <strong>{activeMythicNames.length} active</strong>
      </Link>
      <Link href="/forge/lessons" className="command-mini-card">
        <ZenithIcon name="forge" size={17} />
        <span>Forge Lessons</span>
        <strong>Lesson planner</strong>
      </Link>
      <Link href="/weather" className="command-mini-card">
        <ZenithIcon name="weather" size={17} />
        <span>Weather</span>
        <strong>Zone rotation</strong>
      </Link>
      <Link href="/guilds" className="command-mini-card">
        <ZenithIcon name="guild" size={17} />
        <span>Guild Data</span>
        <strong>Rankings &amp; rosters</strong>
      </Link>
    </section>
  );
}
