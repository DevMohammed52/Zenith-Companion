import { describe, expect, it } from "vitest";
import {
  createDefaultProfile,
  sanitizeProfile,
  sanitizeProfilesState,
} from "@/lib/profiles";
import type { ProfileMuseumSnapshot } from "@/lib/museum";

function createMockMuseumSnapshot(hashTail: string): ProfileMuseumSnapshot {
  return {
    status: "imported",
    sourceHashTail: hashTail,
    importedAt: new Date().toISOString(),
    pageCount: 1,
    itemCount: 2,
    pagination: {
      currentPage: 1,
      lastPage: 1,
      fetchedPages: [1],
      failedPages: [],
    },
    missingOrPrivate: [],
    items: [
      {
        category: "COLLECTIBLES",
        id: "col_1",
        name: "Ancient Coin",
        quantity: 5,
        imageUrl: "https://assets.idle-mmo.com/items/coin.png",
      },
      {
        category: "PETS",
        id: "pet_1",
        name: "Golden Fox",
        quantity: 1,
        imageUrl: "https://assets.idle-mmo.com/pets/fox.png",
      },
    ],
  };
}

describe("Profile Museum Isolation & Sanitization", () => {
  it("preserves museum snapshot on main character profile", () => {
    const main = createDefaultProfile("Main Hero");
    main.kind = "main";
    main.importSource = {
      mode: "imported",
      characterHashTail: "mainhash1234",
      importedAt: new Date().toISOString(),
      refreshedAt: new Date().toISOString(),
      importedSections: ["information", "metrics", "pets", "museum"],
      missingOrPrivate: [],
      notes: "Imported test",
    };
    main.museum = createMockMuseumSnapshot("mainhash1234");

    const sanitized = sanitizeProfile(main);
    expect(sanitized.museum).toBeDefined();
    expect(sanitized.museum?.items).toHaveLength(2);
    expect(sanitized.museum?.sourceHashTail).toBe("mainhash1234");
    expect(sanitized.importSource.importedSections).toContain("museum");
  });

  it("preserves museum snapshot on directly-imported alt profile with matching hash tail", () => {
    const alt = createDefaultProfile("Alt Rogue");
    alt.kind = "alt";
    alt.importSource = {
      mode: "imported",
      characterHashTail: "althash56789",
      importedAt: new Date().toISOString(),
      refreshedAt: new Date().toISOString(),
      importedSections: ["information", "metrics", "pets", "museum"],
      missingOrPrivate: [],
      notes: "Imported test",
    };
    alt.museum = createMockMuseumSnapshot("althash56789");

    const sanitized = sanitizeProfile(alt);
    expect(sanitized.museum).toBeDefined();
    expect(sanitized.museum?.items).toHaveLength(2);
    expect(sanitized.museum?.sourceHashTail).toBe("althash56789");
    expect(sanitized.importSource.importedSections).toContain("museum");
  });

  it("strips copied root museum from alt profile when hash tails mismatch", () => {
    const altWithCopiedMuseum = createDefaultProfile("Alt Miner");
    altWithCopiedMuseum.kind = "alt";
    altWithCopiedMuseum.importSource = {
      mode: "imported",
      characterHashTail: "althash99999",
      importedAt: new Date().toISOString(),
      refreshedAt: new Date().toISOString(),
      importedSections: ["information", "metrics", "pets", "museum"],
      missingOrPrivate: [],
      notes: "Imported test",
    };
    // Museum was copied from main (mainhash1234)
    altWithCopiedMuseum.museum = createMockMuseumSnapshot("mainhash1234");

    const sanitized = sanitizeProfile(altWithCopiedMuseum);
    expect(sanitized.museum).toBeUndefined();
    expect(sanitized.importSource.importedSections).not.toContain("museum");
    expect(sanitized.importSource.importedSections).toEqual(["information", "metrics", "pets"]);
  });

  it("heals alt profiles across ProfilesState when alt inherited main museum", () => {
    const main = createDefaultProfile("Main Account");
    main.kind = "main";
    main.importSource = {
      mode: "imported",
      characterHashTail: "root12345678",
      importedAt: new Date().toISOString(),
      refreshedAt: new Date().toISOString(),
      importedSections: ["information", "metrics", "pets", "museum"],
      missingOrPrivate: [],
      notes: "Imported test",
    };
    main.museum = createMockMuseumSnapshot("root12345678");

    const alt1 = createDefaultProfile("Alt 1 (Copied)");
    alt1.kind = "alt";
    alt1.importSource = {
      mode: "imported",
      characterHashTail: "alt1_1234567",
      importedAt: new Date().toISOString(),
      refreshedAt: new Date().toISOString(),
      importedSections: ["information", "metrics", "pets", "museum"],
      missingOrPrivate: [],
      notes: "Imported test",
    };
    // Copied from root
    alt1.museum = createMockMuseumSnapshot("root12345678");

    const alt2 = createDefaultProfile("Alt 2 (Directly Imported)");
    alt2.kind = "alt";
    alt2.importSource = {
      mode: "imported",
      characterHashTail: "alt2_8765432",
      importedAt: new Date().toISOString(),
      refreshedAt: new Date().toISOString(),
      importedSections: ["information", "metrics", "pets", "museum"],
      missingOrPrivate: [],
      notes: "Imported test",
    };
    // Directly imported with matching 12-char hash tail
    alt2.museum = createMockMuseumSnapshot("alt2_8765432");

    const state = sanitizeProfilesState({
      profiles: [main, alt1, alt2],
      activeProfileId: main.id,
    });

    expect(state.profiles).toHaveLength(3);

    // Main retains museum
    expect(state.profiles[0].museum).toBeDefined();
    expect(state.profiles[0].museum?.sourceHashTail).toBe("root12345678");

    // Alt 1 had copied museum stripped
    expect(state.profiles[1].museum).toBeUndefined();
    expect(state.profiles[1].importSource.importedSections).not.toContain("museum");

    // Alt 2 retains its genuine personal museum
    expect(state.profiles[2].museum).toBeDefined();
    expect(state.profiles[2].museum?.sourceHashTail).toBe("alt2_8765432");
    expect(state.profiles[2].importSource.importedSections).toContain("museum");
  });
});
