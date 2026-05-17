import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ITEMS_PATH = path.join(ROOT, 'public', 'all-items-db.json');
const OUT_PATH = path.join(ROOT, 'src', 'data', 'item-lore-signals.ts');

const BOILERPLATE_PATTERNS = [
  /^use to receive\b/i,
  /^open to receive\b/i,
  /^this is used to upgrade\b/i,
  /^this item can only be bought\b/i,
  /^a recipe for crafting\b/i,
  /^can be consumed to unlock\b/i,
];

const RULES = [
  {
    id: 'runemark-runes',
    pattern: /\b(ancient rune|ancient runes|runemark|runebound|runeblade|rune-etched|rune|runes|runic)\b/i,
    terms: ['ancient runes', 'runemark', 'rune'],
    entryIds: ['artifacts-the-runemark-of-eternity', 'world-the-citadel'],
    confidence: 'inferred',
    reason: 'The item description uses rune language that aligns with the Runemark and Citadel archive.',
  },
  {
    id: 'citadel',
    pattern: /\bcitadel\b/i,
    terms: ['citadel'],
    entryIds: ['world-the-citadel', 'artifacts-the-runemark-of-eternity'],
    confidence: 'inferred',
    reason: 'The item description explicitly references the Citadel thread.',
  },
  {
    id: 'arvendor',
    pattern: /\barvendor(?:ian)?\b/i,
    terms: ['arvendor', 'arvendorian'],
    entryIds: ['civilizations-arvendor', 'world-the-citadel'],
    confidence: 'canon',
    reason: 'The item description explicitly names Arvendor or Arvendorian origin.',
  },
  {
    id: 'eldorian',
    pattern: /\beldori(?:a|an|ans)\b/i,
    terms: ['eldoria', 'eldorian'],
    entryIds: ['civilizations-eldorian', 'world-solaris-isle'],
    confidence: 'canon',
    reason: 'The item description explicitly names Eldoria or Eldorian origin.',
  },
  {
    id: 'mokthar',
    pattern: /\bmokthar\b/i,
    terms: ['mokthar'],
    entryIds: ['civilizations-mokthar'],
    confidence: 'canon',
    reason: 'The item description explicitly names Mokthar origin.',
  },
  {
    id: 'oakenra',
    pattern: /\boakenra\b/i,
    terms: ['oakenra'],
    entryIds: ['civilizations-oakenra'],
    confidence: 'canon',
    reason: 'The item description explicitly names Oakenra origin.',
  },
  {
    id: 'ombric',
    pattern: /\bombric\b/i,
    terms: ['ombric'],
    entryIds: ['civilizations-ombric'],
    confidence: 'canon',
    reason: 'The item description explicitly names Ombric origin.',
  },
  {
    id: 'ancients',
    pattern: /\b(the ancients|ancient civilization|ancient civilizations|ancient guardians|first people)\b/i,
    terms: ['the ancients', 'ancient civilization', 'first people'],
    entryIds: ['civilizations-the-ancients', 'civilizations-the-first-people'],
    confidence: 'inferred',
    reason: 'The item description points at the oldest civilization layer in the lore archive.',
  },
  {
    id: 'sirens',
    pattern: /\bsiren(?:'s|s)?\b/i,
    terms: ['siren', 'sirens'],
    entryIds: ['bestiary-sirens'],
    confidence: 'canon',
    reason: 'The item description explicitly references the Siren bestiary thread.',
  },
  {
    id: 'kikimoras',
    pattern: /\bkikimora(?:s)?\b/i,
    terms: ['kikimora', 'kikimoras'],
    entryIds: ['bestiary-kikimoras'],
    confidence: 'canon',
    reason: 'The item description explicitly references the Kikimora bestiary thread.',
  },
  {
    id: 'serpent',
    pattern: /\b(colossal serpent|serpent|serpent's|serpentine)\b/i,
    terms: ['serpent', 'colossal serpent'],
    entryIds: ['concepts-colossal-serpent'],
    confidence: 'theory',
    reason: 'The item description uses serpent imagery; this is a thematic hook, not proof of identity.',
  },
  {
    id: 'gods',
    pattern: /\b(celestial beings?|celestial deity|old god|new god|forgotten god|long-forgotten god|god of|gods?|deities|divine)\b/i,
    terms: ['celestial beings', 'celestial deity', 'forgotten god', 'divine', 'deity'],
    entryIds: ['concepts-gods-and-deities'],
    confidence: 'inferred',
    reason: 'The item description uses divine or deity language connected to the Gods and Deities concept record.',
  },
  {
    id: 'celestial-system',
    pattern: /\b(celestial system|lunar vigil|lunar|moonlit|moonlight|stars?|starlight)\b/i,
    terms: ['celestial system', 'lunar', 'stars'],
    entryIds: ['world-the-celestial-system-of-valaron', 'concepts-cults'],
    confidence: 'theory',
    reason: 'The item description uses sky, lunar, or star language that can support celestial-system research.',
  },
  {
    id: 'valaron',
    pattern: /\bvalaron\b/i,
    terms: ['valaron'],
    entryIds: ['world-valaron'],
    confidence: 'canon',
    reason: 'The item description explicitly names Valaron.',
  },
  {
    id: 'void-reality',
    pattern: /\b(void|reality|phase(?:shift)?|fade from reality|beyond reality)\b/i,
    terms: ['void', 'reality', 'phaseshift'],
    entryIds: ['concepts-colossal-serpent'],
    confidence: 'theory',
    reason: 'The item description uses reality/void language; this is a cosmology research hook, not a confirmed link.',
  },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isBoilerplate(description) {
  return BOILERPLATE_PATTERNS.some((pattern) => pattern.test(description.trim()));
}

function extractEvidence(description, pattern) {
  const sentences = description
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const sentence = sentences.find((candidate) => pattern.test(candidate)) || description.trim();
  return sentence.length > 180 ? `${sentence.slice(0, 177).trim()}...` : sentence;
}

function sortBySignalStrength(a, b) {
  const confidenceRank = { canon: 0, inferred: 1, theory: 2 };
  return (
    confidenceRank[a.confidence] - confidenceRank[b.confidence]
    || a.itemName.localeCompare(b.itemName)
    || a.entryIds.join('/').localeCompare(b.entryIds.join('/'))
  );
}

const db = readJson(ITEMS_PATH);
const items = Object.values(db)
  .filter((item) => item && typeof item === 'object' && typeof item.name === 'string')
  .sort((a, b) => a.name.localeCompare(b.name));

const signals = [];
const seen = new Set();

for (const item of items) {
  const description = String(item.description || '').trim();
  if (!description || isBoilerplate(description)) continue;

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    if (!rule.pattern.test(description)) continue;

    const key = `${item.name}:${rule.entryIds.join('|')}`;
    if (seen.has(key)) continue;
    seen.add(key);

    signals.push({
      itemName: item.name,
      entryIds: rule.entryIds,
      reason: rule.reason,
      confidence: rule.confidence,
      source: 'description',
      evidence: extractEvidence(description, rule.pattern),
      matchedTerms: rule.terms,
    });
  }
}

signals.sort(sortBySignalStrength);

const header = `// Generated by scripts/build-item-lore-signals.mjs. Do not edit by hand.

export type ItemLoreDescriptionSignal = {
  itemName: string;
  entryIds: string[];
  reason: string;
  confidence: 'canon' | 'inferred' | 'theory';
  source: 'description';
  evidence: string;
  matchedTerms: string[];
};

`;

const body = `export const ITEM_LORE_DESCRIPTION_SIGNALS = ${JSON.stringify(signals, null, 2)} as const satisfies readonly ItemLoreDescriptionSignal[];
`;

fs.writeFileSync(OUT_PATH, `${header}${body}`, 'utf8');
console.log(`Generated ${signals.length} item description lore signals at ${path.relative(ROOT, OUT_PATH)}`);
