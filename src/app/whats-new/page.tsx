import fs from "node:fs";
import path from "node:path";
import { parseChangelog, type ParsedChangelog } from "@/lib/changelog-parser";
import { createRouteMetadata } from "@/lib/route-metadata";
import { APP_VERSION, APP_RELEASE_DATE } from "@/lib/version";
import WhatsNewClient from "./WhatsNewClient";

export const metadata = createRouteMetadata({
  title: "What's New in Zenith",
  description:
    "Official release history and changelog for Zenith Companion. Browse new features, calculation engine improvements, UI overhauls, and bug fixes.",
  path: "/whats-new",
  keywords: [
    "Zenith Companion What's New",
    "Zenith updates",
    "Zenith changelog",
    "IdleMMO tools release notes",
    "Zenith Companion patch notes",
  ],
});

function loadChangelogData(): ParsedChangelog {
  try {
    const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
    if (fs.existsSync(changelogPath)) {
      const raw = fs.readFileSync(changelogPath, "utf8");
      return parseChangelog(raw);
    }
  } catch {
    // Fall back to pre-compiled JSON
  }

  try {
    const jsonPath = path.join(process.cwd(), "public", "zenith-changelog.json");
    if (fs.existsSync(jsonPath)) {
      const rawJson = fs.readFileSync(jsonPath, "utf8");
      return JSON.parse(rawJson);
    }
  } catch {
    // Return empty fallback
  }

  return {
    title: "Changelog",
    description: "Zenith Companion updates.",
    releases: [],
    meta: {
      totalReleases: 0,
      latestVersion: APP_VERSION,
      latestDate: APP_RELEASE_DATE,
      categories: [],
    },
  };
}

export default function WhatsNewPage() {
  const changelogData = loadChangelogData();
  return <WhatsNewClient initialData={changelogData} />;
}
