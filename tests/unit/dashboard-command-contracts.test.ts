import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard command center contracts", () => {
  const pagePath = path.join(process.cwd(), "src", "app", "page.tsx");
  const globalsCssPath = path.join(process.cwd(), "src", "app", "globals.css");

  function getMediaQueryBlock(css: string, mediaCondition: string, targetSelector: string): string | null {
    const escapedCondition = mediaCondition.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`@media\\s*\\(${escapedCondition}\\)\\s*\\{([\\s\\S]*?)\\n\\}`, "g");
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(css)) !== null) {
      if (match[1].includes(targetSelector)) {
        return match[1];
      }
    }
    return null;
  }

  it("does not offer redundant local backup export in onboarding prompt", () => {
    const pageContent = readFileSync(pagePath, "utf-8");
    expect(pageContent).not.toContain("Export local backup");
    expect(pageContent).not.toMatch(/dashboard-setup-actions[\s\S]*?Upload/);
  });

  it("enforces mobile status grid typography >= 0.72rem in globals.css", () => {
    const css = readFileSync(globalsCssPath, "utf-8");
    const mobileBlock = getMediaQueryBlock(css, "max-width: 760px", "command-status-grid");
    expect(mobileBlock).not.toBeNull();

    expect(mobileBlock).toMatch(/\.command-status-card\s+span\s*\{[^}]*font-size:\s*0\.72rem/);
    expect(mobileBlock).toMatch(/\.command-status-card\s+em\s*\{[^}]*font-size:\s*0\.72rem/);
    expect(mobileBlock).not.toContain("font-size: 0.57rem");
    expect(mobileBlock).not.toContain("font-size: 0.68rem");
  });

  it("enforces 2-column layout for command-status-grid on screens <= 600px", () => {
    const css = readFileSync(globalsCssPath, "utf-8");
    const block600 = getMediaQueryBlock(css, "max-width: 600px", "command-status-grid");
    expect(block600).not.toBeNull();

    expect(block600).toMatch(/\.command-status-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    expect(block600).toMatch(/\.command-status-card:last-child:nth-child\(odd\)\s*\{[^}]*grid-column:\s*span\s*2/);
  });

  it("enforces >= 44px touch targets on mobile/touch viewports for dashboard links", () => {
    const css = readFileSync(globalsCssPath, "utf-8");
    const mobileBlock = getMediaQueryBlock(css, "max-width: 760px", "command-module-links");
    expect(mobileBlock).not.toBeNull();
    expect(mobileBlock).toMatch(/\.command-module-links\s+a[\s\S]*?\.dashboard-setup-actions\s+a\s*\{[^}]*min-height:\s*44px/);

    const coarseBlock = getMediaQueryBlock(css, "pointer: coarse", "command-module-links");
    expect(coarseBlock).not.toBeNull();
    expect(coarseBlock).toMatch(/\.command-module-links\s+a[\s\S]*?\.dashboard-setup-actions\s+a\s*\{[^}]*min-height:\s*44px/);
  });

  it("keeps desktop baseline heights compact for mouse users", () => {
    const css = readFileSync(globalsCssPath, "utf-8");
    expect(css).toMatch(/\.dashboard-setup-actions\s+a\s*\{[^}]*min-height:\s*2\.55rem/);
    expect(css).toMatch(/\.command-module-links\s+a\s*\{[^}]*min-height:\s*2\.25rem/);
  });
});
