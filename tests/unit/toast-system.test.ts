import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { calculateAdaptiveDuration } from "@/components/ui/Toast";

describe("Global Toast System Contracts & Quality Gates", () => {
  describe("Gate 1: Adaptive Duration & Accessibility Timing", () => {
    it("returns 0 (persistent) for error alerts so failures are never missed", () => {
      expect(calculateAdaptiveDuration("Fatal Error", "Database sync failed", false, "error")).toBe(0);
    });

    it("bounds standard duration between 2,800ms and 7,500ms based on word count", () => {
      const short = calculateAdaptiveDuration("Saved", "");
      expect(short).toBeGreaterThanOrEqual(2800);

      const longText = "This is a very long notification description containing many words designed to test the upper boundary calculation of the adaptive formula.";
      const long = calculateAdaptiveDuration("Detailed Status Update", longText);
      expect(long).toBeLessThanOrEqual(7500);
      expect(long).toBeGreaterThan(short);
    });

    it("enforces minimum 8,000ms duration when an interactive action is present", () => {
      const withAction = calculateAdaptiveDuration("Pet Removed", "", true, "default");
      expect(withAction).toBeGreaterThanOrEqual(8000);
    });
  });

  describe("Gate 2: CSS Token & Viewport Layering Contracts", () => {
    it("verifies Toast viewport sits at z-index 11000 to float above modals (9999)", () => {
      const cssPath = resolve(process.cwd(), "src/components/ui/Toast.module.css");
      expect(existsSync(cssPath)).toBe(true);
      const css = readFileSync(cssPath, "utf-8");

      expect(css).toContain("z-index: 11000");
      expect(css).toContain("flex-direction: column-reverse");
      expect(css).toContain("var(--bottom-dock-height, 64px)");
    });

    it("verifies mobile stack cap hides 3rd+ toasts on small screens", () => {
      const cssPath = resolve(process.cwd(), "src/components/ui/Toast.module.css");
      const css = readFileSync(cssPath, "utf-8");

      expect(css).toContain(".toast:nth-child(n+3)");
      expect(css).toContain("display: none");
    });

    it("verifies ToastProvider is mounted in layout.tsx", () => {
      const layoutPath = resolve(process.cwd(), "src/app/layout.tsx");
      const layout = readFileSync(layoutPath, "utf-8");
      expect(layout).toContain("<ToastProvider>");
      expect(layout).toContain("</ToastProvider>");
    });
  });
});
