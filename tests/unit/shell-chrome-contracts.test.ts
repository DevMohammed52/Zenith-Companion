import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const UI_DIR = path.join(process.cwd(), "src", "components", "ui");
const COMPONENTS_DIR = path.join(process.cwd(), "src", "components");

describe("UI primitives: focus, motion, and layout-invariance contracts", () => {
  const cssFiles = readdirSync(UI_DIR).filter((file) => file.endsWith(".module.css"));

  it("includes prefers-reduced-motion fallback in every animated/transitioned primitive CSS module", () => {
    const missingReducedMotion: string[] = [];

    for (const file of cssFiles) {
      const content = readFileSync(path.join(UI_DIR, file), "utf-8");
      const usesMotion = /\b(transition|animation)\s*:/.test(content);
      if (usesMotion && !content.includes("prefers-reduced-motion")) {
        missingReducedMotion.push(file);
      }
    }

    expect(missingReducedMotion).toEqual([]);
  });

  it("pairs any outline: none rule with an explicit :focus-visible or :focus-within style", () => {
    const missingFocusIndicator: string[] = [];

    for (const file of cssFiles) {
      const content = readFileSync(path.join(UI_DIR, file), "utf-8");
      if (content.includes("outline: none")) {
        const hasFocusRule = content.includes(":focus-visible") || content.includes(":focus-within");
        if (!hasFocusIndicatorPresent(hasFocusRule, content)) {
          missingFocusIndicator.push(file);
        }
      }
    }

    expect(missingFocusIndicator).toEqual([]);
  });

  it("avoids animating Switch thumb width and exposes stepper/combobox clear focus rings", () => {
    const switchCss = readFileSync(path.join(UI_DIR, "Switch.module.css"), "utf-8");
    expect(switchCss).not.toMatch(/transition:[^;]*\bwidth\b/);
    expect(switchCss).not.toMatch(/\.thumb\s*\{[^}]*width:\s*24px/);

    const numberInputCss = readFileSync(path.join(UI_DIR, "NumberInput.module.css"), "utf-8");
    expect(numberInputCss).toContain(".stepperBtn:focus-visible");

    const comboboxCss = readFileSync(path.join(UI_DIR, "Combobox.module.css"), "utf-8");
    expect(comboboxCss).toContain(".clearButton:focus-visible");
    expect(comboboxCss).toContain(".inputWrap:focus-within");

    const popoverCss = readFileSync(path.join(UI_DIR, "Popover.module.css"), "utf-8");
    expect(popoverCss).toContain(".content:focus-visible");
  });
});

function hasFocusIndicatorPresent(hasFocusRule: boolean, content: string): boolean {
  return hasFocusRule && /outline:\s*2px|box-shadow:\s*0 0 0|box-shadow:\s*inset 0 0 0/.test(content);
}

describe("Shell chrome: icon discipline, accessibility, and hierarchy contracts", () => {
  const shellFiles = [
    "Sidebar.tsx",
    "MobileBottomDock.tsx",
    "SiteFooter.tsx",
    "GlobalSearch.tsx",
    "ProfileSwitcher.tsx",
    "DataFreshnessIndicator.tsx",
    "MobileMenuBtn.tsx",
  ];

  it("routes all shell UI icons through centralized registries instead of direct lucide-react imports", () => {
    const directLucideImports: string[] = [];

    for (const file of shellFiles) {
      const source = readFileSync(path.join(COMPONENTS_DIR, file), "utf-8");
      if (/from\s+["']lucide-react["']/.test(source)) {
        directLucideImports.push(file);
      }
    }

    expect(directLucideImports).toEqual([]);
  });

  it("uses ui EmptyState instead of legacy StateBlock in GlobalSearch", () => {
    const searchSource = readFileSync(path.join(COMPONENTS_DIR, "GlobalSearch.tsx"), "utf-8");
    expect(searchSource).not.toContain("StateBlock");
    expect(searchSource).toContain("<EmptyState");
  });

  it("provides explicit short dock labels and calm Astral Slate sidebar section hierarchy", () => {
    const dockSource = readFileSync(path.join(COMPONENTS_DIR, "MobileBottomDock.tsx"), "utf-8");
    expect(dockSource).toContain('"/alchemy": "Alchemy"');
    expect(dockSource).toContain('"/skill-profit": "Profit"');

    const sidebarCss = readFileSync(path.join(COMPONENTS_DIR, "Sidebar.module.css"), "utf-8");
    expect(sidebarCss).toContain(".group + .group");
    expect(sidebarCss).toContain("var(--control-active-bg");
    expect(sidebarCss).not.toContain("color: #ffffff !important");
    expect(sidebarCss).toContain(".mobileClose:focus-visible");
  });
});
