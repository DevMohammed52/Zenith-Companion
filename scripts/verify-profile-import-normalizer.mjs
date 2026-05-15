import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const root = process.cwd();
const outDir = path.join(root, ".next", "profile-import-verify");

const modules = [
  {
    source: "src/lib/museum.ts",
    output: "museum.cjs",
    rewrites: [],
  },
  {
    source: "src/lib/profiles.tsx",
    output: "profiles.cjs",
    rewrites: [
      ['"@/lib/housing"', '"./housing-stub.cjs"'],
      ['"@/lib/museum"', '"./museum.cjs"'],
      ['"@/lib/skill-profit"', '"./skill-profit-stub.cjs"'],
    ],
  },
  {
    source: "src/lib/profile-import.ts",
    output: "profile-import.cjs",
    rewrites: [
      ['"@/lib/profiles"', '"./profiles.cjs"'],
      ['"@/lib/museum"', '"./museum.cjs"'],
    ],
  },
  {
    source: "src/lib/pets.ts",
    output: "pets.cjs",
    rewrites: [],
  },
];

async function writeStubModules() {
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(
    path.join(outDir, "housing-stub.cjs"),
    `
exports.createDefaultHousing = function createDefaultHousing() {
  return {
    enabled: false,
    membership: false,
    guestAccess: false,
    cooking: { station: "", level: "" },
    forge: { station: "", level: "" },
    laboratory: { station: "", level: "" },
    workshop: { station: "", level: "" },
  };
};
exports.sanitizeHousing = function sanitizeHousing(input) {
  return { ...exports.createDefaultHousing(), ...(input || {}) };
};
`,
  );
  await fs.writeFile(path.join(outDir, "skill-profit-stub.cjs"), "exports.ASSAULT_RANKS = [];\n");
}

function transpileModule(sourceCode, sourcePath) {
  const result = ts.transpileModule(sourceCode, {
    fileName: sourcePath,
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  if (result.diagnostics?.length) {
    const formatted = ts.formatDiagnosticsWithColorAndContext(result.diagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => root,
      getNewLine: () => "\n",
    });
    throw new Error(formatted);
  }
  return result.outputText;
}

async function compileLocalModules() {
  await writeStubModules();
  for (const module of modules) {
    const sourcePath = path.join(root, module.source);
    let source = await fs.readFile(sourcePath, "utf8");
    for (const [from, to] of module.rewrites) {
      source = source.replaceAll(from, to);
    }
    await fs.writeFile(path.join(outDir, module.output), transpileModule(source, sourcePath));
  }
}

await compileLocalModules();

const profileImport = await import(pathToFileURL(path.join(outDir, "profile-import.cjs")));
const profiles = await import(pathToFileURL(path.join(outDir, "profiles.cjs")));
const pets = await import(pathToFileURL(path.join(outDir, "pets.cjs")));

const importedAt = "2026-05-14T08:00:00.000Z";
const fixture = {
  hash: "VM29l7kQZZ0JbQ80q6WD",
  importedAt,
  information: {
    character: {
      name: "Saqr",
      class: "SMELTER",
      total_level: 1843,
      image_url: "https://cdn.idle-mmo.com/uploaded/skins/saqr.png",
      background_url: "https://cdn.idle-mmo.com/skins/backgrounds/default.jpg",
      current_status: "Cooking",
      location: { id: 42, name: "Volcano" },
      guild: { id: 7, tag: "ZEN", level: 12, position: "Member" },
      stats: {
        strength: { level: 88, experience: 4567 },
        defence: { level: 76, experience: 3456 },
      },
      skills: {
        combat: { level: 100, ascension_level: 8, experience: 123456 },
        "hunting-mastery": { level: 155, ascension_level: 55, experience: 98765 },
        dungeoneering: { level: 92, experience: 87654 },
        "pet-mastery": { level: 25, experience: 7890 },
        cooking: { level: 91, experience: 999999 },
        mining: { level: 45, experience: 1000 },
      },
    },
  },
  metrics: {
    endpoint_updates_at: "2026-05-14T07:58:00.000Z",
    metrics: {
      combat: { kills: 12, deaths: 1 },
      skilling: { cooked_items: 44 },
    },
  },
  pets: {
    pets: [
      {
        id: 1001,
        pet_id: 30,
        name: "Aerion",
        custom_name: "Glow",
        image_url: "https://cdn.idle-mmo.com/uploaded/skins/CczGESMfcJ0kmsCM4lqxTudmTA6K7l-metaYWVyaW9uLnBuZw==-.png",
        quality: "Epic",
        level: 22,
        experience: 500,
        total_experience: 12500,
        equipped: true,
        stats: {
          agility: 8,
          accuracy: 9,
          protection: 7,
          attack_power: 11,
          movement_speed: 4,
          max_stamina: 3,
          critical_damage: 2,
          critical_chance: 1,
        },
        evolution: {
          state: 2,
          max: 5,
          can_evolve: true,
          targets: [{ key: "attack_power", label: "Attack Power" }],
        },
        health: { current: 80, maximum: 100, percentage: 80 },
        location: { id: 11, name: "Forest" },
      },
    ],
  },
  museum: {
    status: "partial",
    importedAt,
    pagination: {
      currentPage: 1,
      lastPage: 2,
      perPage: 25,
      total: 26,
      fetchedPages: [1],
      failedPages: [2],
    },
    missingOrPrivate: ["museum.page.2"],
    items: [
      { category: "PETS", id: 30, name: "Aerion", quantity: 1, imageUrl: "https://cdn.idle-mmo.com/uploaded/skins/CczGESMfcJ0kmsCM4lqxTudmTA6K7l-metaYWVyaW9uLnBuZw==-.png" },
      { category: "SKINS", id: 9, name: "Chef Robe", quantity: 1, imageUrl: "https://cdn.idle-mmo.com/skins/chef-robe.png" },
    ],
  },
};

const draft = profileImport.normalizeIdleMmoProfileImport(fixture);

assert.equal(draft.name, "Saqr");
assert.equal(draft.className, "Smelter");
assert.equal(draft.levels.totalLevel, 1843);
assert.equal(draft.levels.combat, 108);
assert.equal(draft.skills.combat.level, 108);
assert.equal(draft.skills.cooking.level, 91);
assert.equal(draft.levels.huntingMastery, 155);
assert.equal(draft.levels.dungeoneering, 92);
assert.equal(draft.levels.petMastery, 25);
assert.equal(draft.skills["pet-mastery"].level, 25);
assert.equal(draft.location.name, "Volcano");
assert.equal(draft.guild.tag, "ZEN");
assert.equal(draft.ownedPets.length, 1);
assert.equal(draft.ownedPets[0].nickname, "Glow");
assert.equal(draft.ownedPets[0].petId, 30);
assert.equal(draft.ownedPets[0].stats.attackPower, 11);
assert.equal(draft.pet.species, "Aerion");
assert.equal(draft.metricsSnapshot.categories.combat.kills, 12);
assert.equal(draft.museum.items.length, 2);
assert.equal(draft.museum.pagination.failedPages[0], 2);
assert.deepEqual(draft.importSource.importedSections, ["information", "metrics", "pets", "museum"]);
assert.equal(draft.importSource.characterHashTail, "ZZ0JbQ80q6WD");

const existing = profiles.sanitizeProfile({
  ...profiles.createDefaultProfile("Manual"),
  name: "Manual Name",
  className: "Warrior",
  fieldSources: {
    name: { source: "manual", updatedAt: importedAt },
    className: { source: "manual", updatedAt: importedAt },
  },
});
const merged = profileImport.mergeImportedProfileDraft(existing, draft, importedAt);

assert.equal(merged.profile.name, "Manual Name");
assert.equal(merged.profile.className, "Warrior");
assert.equal(merged.profile.levels.totalLevel, 1843);
assert.equal(merged.profile.ownedPets.length, 1);
assert(merged.skippedManualPaths.includes("name"));
assert(merged.skippedManualPaths.includes("className"));
assert.equal(merged.profile.fieldSources["levels.totalLevel"].source, "imported");

const blankManualExisting = profiles.sanitizeProfile({
  ...profiles.createDefaultProfile("Blank Manual"),
  className: "Standard",
  levels: {
    ...profiles.createDefaultProfile("Blank Manual").levels,
    combat: "",
    huntingMastery: "",
    dungeoneering: "",
    petMastery: "",
  },
  fieldSources: {
    className: { source: "manual", updatedAt: importedAt },
    "levels.combat": { source: "manual", updatedAt: importedAt },
    "levels.huntingMastery": { source: "manual", updatedAt: importedAt },
    "levels.dungeoneering": { source: "manual", updatedAt: importedAt },
    "levels.petMastery": { source: "manual", updatedAt: importedAt },
  },
});
const blankManualMerged = profileImport.mergeImportedProfileDraft(blankManualExisting, draft, importedAt);
assert.equal(blankManualMerged.profile.className, "Smelter");
assert.equal(blankManualMerged.profile.levels.combat, 108);
assert.equal(blankManualMerged.profile.levels.huntingMastery, 155);
assert.equal(blankManualMerged.profile.levels.dungeoneering, 92);
assert.equal(blankManualMerged.profile.levels.petMastery, 25);

const petLookup = pets.buildPetMatchLookup([
  { id: 30, name: "Aerion", quality: "EPIC" },
  { id: 1, name: "Aquarion", quality: "REFINED" },
]);
assert.equal(pets.findPetRecordForOwnedPet({ petId: 30, species: "Old API Label" }, petLookup).name, "Aerion");
assert.equal(pets.findPetRecordForOwnedPet({ species: " aquarion " }, petLookup).name, "Aquarion");
assert.equal(pets.findPetRecordForOwnedPet({ petId: 999, species: "Missing" }, petLookup), undefined);

console.log(`Profile import normalizer fixture passed: ${merged.appliedPaths.length} fields applied, ${merged.skippedManualPaths.length} manual fields preserved.`);
