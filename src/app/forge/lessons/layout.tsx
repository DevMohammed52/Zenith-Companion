import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "IdleMMO Forge Lessons & Mastery | Zenith Companion",
  description: "Plan IdleMMO forge training sessions, calculate material burn rates, and optimize level progression.",
  path: "/forge/lessons",
  keywords: ["IdleMMO forge lessons", "IdleMMO forge training", "Zenith Companion forge"],
});

export default function ForgeLessonsLayout({ children }: { children: ReactNode }) {
  return children;
}
