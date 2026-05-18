import { describe, expect, it } from "vitest";
import {
  calculateTeleportCost,
  calculateTravelSeconds,
  getBossRouteDistance,
} from "@/lib/world-boss-routing";

describe("world boss routing math", () => {
  it("keeps known bidirectional distances available", () => {
    expect(getBossRouteDistance("Enchanted Oasis", "Bluebell Hollow")).toBe(50_451);
    expect(getBossRouteDistance("Bluebell Hollow", "Enchanted Oasis")).toBe(50_451);
    expect(getBossRouteDistance("Bluebell Hollow", "Bluebell Hollow")).toBe(0);
  });

  it("preserves the validated teleport cost formula", () => {
    expect(calculateTeleportCost(50_451, 1_359)).toBe(4_066);
    expect(calculateTeleportCost(50_451, 1_359, true)).toBe(2_033);
    expect(calculateTeleportCost(1, 0)).toBe(50);
  });

  it("uses movement speed as meters per second for travel time", () => {
    expect(calculateTravelSeconds(1_000, 25)).toBe(40);
    expect(calculateTravelSeconds(0, 25)).toBe(0);
  });
});
