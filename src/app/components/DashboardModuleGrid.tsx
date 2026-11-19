"use client";

import Link from "next/link";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { MODULE_GROUPS, type ModuleGroup } from "../types";

export interface DashboardModuleGridProps {
  moduleGroups?: ModuleGroup[];
}

export function DashboardModuleGrid({ moduleGroups = MODULE_GROUPS }: DashboardModuleGridProps) {
  return (
    <section className="command-module-grid" aria-label="Tool groups">
      {moduleGroups.map((group) => {
        return (
          <article className="command-module-card" key={group.title}>
            <header>
              <ZenithIcon name={group.icon} size={18} />
              <div>
                <h2>{group.title}</h2>
                <p>{group.text}</p>
              </div>
            </header>
            <div className="command-module-links">
              {group.links.map((link) => {
                return (
                  <Link href={link.href} key={link.href}>
                    <ZenithIcon name={link.icon} size={15} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </article>
        );
      })}
    </section>
  );
}
