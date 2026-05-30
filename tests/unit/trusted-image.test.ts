import { describe, expect, it } from "vitest";
import { getTrustedCssImageUrl, getTrustedGameImageUrl, isTrustedGameImageUrl } from "@/lib/trusted-image";

describe("trusted game image URLs", () => {
  it("allows local app assets", () => {
    expect(getTrustedGameImageUrl("/favicon.ico")).toBe("/favicon.ico");
    expect(isTrustedGameImageUrl("/assets/icon.png")).toBe(true);
  });

  it("allows known IdleMMO CDN image paths", () => {
    expect(isTrustedGameImageUrl("https://cdn.idle-mmo.com/cdn-cgi/image/width=100/classes/warrior.png")).toBe(true);
    expect(isTrustedGameImageUrl("https://cdn.idle-mmo.com/uploaded/skins/sample.png")).toBe(true);
    expect(isTrustedGameImageUrl("https://cdn.idle-mmo.com/skins/backgrounds/default.jpg")).toBe(true);
    expect(isTrustedGameImageUrl("https://cdn.idle-mmo.com/global/world-map.png")).toBe(true);
  });

  it("rejects third-party, insecure, protocol-relative, and unrelated CDN paths", () => {
    expect(getTrustedGameImageUrl("https://example.com/uploaded/skins/sample.png")).toBe("");
    expect(getTrustedGameImageUrl("http://cdn.idle-mmo.com/uploaded/skins/sample.png")).toBe("");
    expect(getTrustedGameImageUrl("//cdn.idle-mmo.com/uploaded/skins/sample.png")).toBe("");
    expect(getTrustedGameImageUrl("https://cdn.idle-mmo.com/private/sample.png")).toBe("");
  });

  it("escapes trusted CSS image values", () => {
    expect(getTrustedCssImageUrl("https://cdn.idle-mmo.com/uploaded/skins/sample.png")).toBe(
      'url("https://cdn.idle-mmo.com/uploaded/skins/sample.png")',
    );
  });
});
