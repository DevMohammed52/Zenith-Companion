import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASE_URL = "https://support.idle-mmo.com/release-notes";
const LEGACY_URL = "https://web.idle-mmo.com/patch-notes";
const DEFAULT_OUT = path.join(ROOT, "public", "idlemmo-patch-notes.json");
const USER_AGENT = "ZenithCompanionPatchNotes/2.0";

const args = parseArgs(process.argv.slice(2));
const outFile = path.resolve(String(args.out || DEFAULT_OUT));
const latestOnly = Boolean(args["latest-only"]);

const CATEGORY_RULES = [
  ["public-api", /\b(public api|api endpoint|endpoint|hashed_id|pet public api|public pet api)\b/i],
  ["combat", /\b(combat|battle|battl|enemy|enemies|stance|health|hp|food used|loot chance)\b/i],
  ["hunting", /\b(hunting|hunt|power hunting|pet hunting)\b/i],
  ["dungeons", /\b(dungeon|dungeons|queued dungeon|dungeoneering)\b/i],
  ["world-bosses", /\b(world boss|world bosses|boss timer|respawn)\b/i],
  ["pets", /\b(pet|pets|egg|eggs|companion exchange|celestial exchange|stamina)\b/i],
  ["guilds", /\b(guild|guilds|guild hall|guild weapon|guild raid|guild assault)\b/i],
  ["conquest", /\b(conquest|zone|assault|dominated|contested|season rank|season shard)\b/i],
  ["housing", /\b(house|houses|housing|construction|building|foundation|guest house|remote conduit|component|repair)\b/i],
  ["economy", /\b(economy|market|vendor|gold|tax|pricing|price|profit|trade|membership item|dragon soul stone)\b/i],
  ["alchemy", /\b(alchemy|potion|essence|crystal)\b/i],
  ["forge", /\b(forge|blueprint|equipment|tool|tools|weapon|shield|bow)\b/i],
  ["skills", /\b(skill|skills|woodcutting|mining|fishing|cooking|smelting|level|experience|exp)\b/i],
  ["items", /\b(item|items|inventory|bank|drop|loot|market listing|vendor value)\b/i],
  ["weather", /\b(weather|forecast)\b/i],
  ["map", /\b(map|location|locations|teleport|travel)\b/i],
  ["tavern", /\b(tavern|post|reply|comment|spam)\b/i],
  ["translations", /\b(translation|language|indonesian|filipino|bahasa|dialogue|localisation)\b/i],
  ["mobile-ui", /\b(mobile|android|adreno|ui|ux|rendering|brightness|contrast|scale)\b/i],
  ["seasonal", /\b(seasonal|springtide|yule|campaign|event|shards)\b/i],
  ["membership", /\b(membership|member|members)\b/i],
  ["quests", /\b(quest|dialogue)\b/i],
  ["bug-fixes", /\b(fixed|bug|bugs|issue|error|incorrect|missing|stale)\b/i],
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const firstPageHtml = await fetchPage(1);
  const inertiaData = parseInertiaData(firstPageHtml);

  let total = 0;
  let lastPage = 1;
  const allNotes = [];

  if (inertiaData?.props?.notes) {
    const notesProp = inertiaData.props.notes;
    total = notesProp.total || 0;
    lastPage = notesProp.last_page || 1;
    const pagesToFetch = latestOnly ? [1] : Array.from({ length: lastPage }, (_, index) => index + 1);

    for (const page of pagesToFetch) {
      const html = page === 1 ? firstPageHtml : await fetchPage(page);
      const pageData = page === 1 ? inertiaData : parseInertiaData(html);
      if (pageData?.props?.notes?.data) {
        for (const item of pageData.props.notes.data) {
          const parsed = await processInertiaNote(item, page);
          allNotes.push(parsed);
        }
      }
      if (page !== pagesToFetch.at(-1)) await sleep(150);
    }
  } else {
    // Fallback parser
    total = parseTotalResults(firstPageHtml) || 0;
    lastPage = parseLastPage(firstPageHtml, total);
    const pagesToFetch = latestOnly ? [1] : Array.from({ length: lastPage }, (_, index) => index + 1);

    for (const page of pagesToFetch) {
      const html = page === 1 ? firstPageHtml : await fetchPage(page);
      allNotes.push(...parseLegacyPatchNotesPage(html, page));
      if (page !== pagesToFetch.at(-1)) await sleep(150);
    }
  }

  const existing = readExisting(outFile);
  const merged = mergeNotes(existing, allNotes);
  const categoryCounts = countCategories(merged);
  const latest = merged[0];
  const oldest = merged.at(-1);

  const payload = {
    meta: {
      generatedAt: new Date().toISOString(),
      source: BASE_URL,
      mode: latestOnly ? "latest-page-merge" : "full-refresh",
      totalAvailable: total || merged.length,
      totalFetched: merged.length,
      latestPatchId: latest?.id ?? null,
      oldestPatchId: oldest?.id ?? null,
      latestVersion: latest?.version ?? null,
      oldestVersion: oldest?.version ?? null,
      categoryCounts,
      note: "Generated from the public IdleMMO release notes page. Keep sourceUrl links visible in UI.",
    },
    patchNotes: merged,
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`);

  console.log(`Wrote ${path.relative(ROOT, outFile)} with ${merged.length} patch notes.`);
  console.log(`Latest: ${latest?.version ?? "n/a"} (#${latest?.id ?? "n/a"})`);
  console.log(`Oldest: ${oldest?.version ?? "n/a"} (#${oldest?.id ?? "n/a"})`);
}

async function fetchPage(page) {
  const url = page === 1 ? BASE_URL : `${BASE_URL}?page=${page}`;
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function parseInertiaData(html) {
  const match = html.match(/data-page="([^"]+)"/);
  if (!match) return null;
  try {
    const raw = match[1].replace(/&quot;/g, '"');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function processInertiaNote(item, page) {
  const id = Number(item.id);
  const headline = textFromHtml(item.title_html || "");
  const { version, title } = parseHeadline(headline);
  const releasedAt = item.released_at ? normalizeDateTime(item.released_at) : null;
  const sourceUrl = item.path ? `https://support.idle-mmo.com${item.path}` : `${BASE_URL}?patch_note_id=${id}`;

  let bodyHtml = item.content_html || "";

  // If truncated, attempt to fetch clean markdown
  if (item.is_truncated && item.path) {
    try {
      const mdRes = await fetch(`https://support.idle-mmo.com${item.path}.md`, {
        headers: { "user-agent": USER_AGENT },
      });
      if (mdRes.ok) {
        const mdText = await mdRes.text();
        const contentBlocks = parseMarkdownBlocks(mdText);
        const sections = buildSections(contentBlocks);
        const bodyText = contentBlocks.map((b) => b.text).join("\n");
        const searchText = normalizeWhitespace(`${headline} ${bodyText}`);
        const categories = inferCategories(searchText);

        return {
          id,
          version,
          title,
          headline,
          releasedAt,
          releaseLabel: formatRelativeDate(releasedAt),
          releaseDateLabel: formatDateLabel(releasedAt),
          page,
          sourceUrl,
          categories,
          excerpt: makeExcerpt(bodyText),
          contentBlocks,
          sections,
          bodyText,
          searchText: searchText.toLowerCase(),
        };
      }
    } catch {}
  }

  const contentBlocks = parseContentBlocks(bodyHtml);
  const sections = buildSections(contentBlocks);
  const bodyText = contentBlocks.map((b) => b.text).join("\n");
  const searchText = normalizeWhitespace(`${headline} ${bodyText}`);
  const categories = inferCategories(searchText);

  return {
    id,
    version,
    title,
    headline,
    releasedAt,
    releaseLabel: formatRelativeDate(releasedAt),
    releaseDateLabel: formatDateLabel(releasedAt),
    page,
    sourceUrl,
    categories,
    excerpt: makeExcerpt(bodyText),
    contentBlocks,
    sections,
    bodyText,
    searchText: searchText.toLowerCase(),
  };
}

function parseMarkdownBlocks(md) {
  const lines = md.split("\n");
  const blocks = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("#")) {
      const text = line.replace(/^#+\s*/, "").trim();
      blocks.push({ type: "heading", text });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const text = line.slice(2).trim();
      blocks.push({ type: "listItem", text });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }

  return blocks;
}

function parseLegacyPatchNotesPage(html, page) {
  const notes = [];
  const pattern = /<div id="patch-note-(\d+)">([\s\S]*?)(?=\s*<hr class="border-gray-800 my-12">|\s*<div class="mt-6 flex|\s*<nav|\s*<\/div>\s*<\/div>\s*<footer)/g;
  let match;

  while ((match = pattern.exec(html))) {
    const id = Number(match[1]);
    const block = match[2];
    const headline = textFromHtml(firstMatch(block, /<h2[^>]*>([\s\S]*?)<\/h2>/i));
    const { version, title } = parseHeadline(headline);
    const timeMatch = block.match(/<time\s+datetime="([^"]+)">([\s\S]*?)<\/time>/i);
    const sourceUrl =
      firstMatch(block, /\$clipboard\('([^']+patch_note_id=\d+)'/i) ||
      `${LEGACY_URL}?patch_note_id=${id}`;
    const tooltipDate = firstMatch(block, /x-tooltip="'([^']+)'"><time/i);
    const bodyHtml = firstMatch(block, /<div class="markdown">\s*<div>([\s\S]*?)<\/div>\s*<\/div>/i) || "";
    const contentBlocks = parseContentBlocks(bodyHtml);
    const sections = buildSections(contentBlocks);
    const bodyText = contentBlocks.map((item) => item.text).join("\n");
    const searchText = normalizeWhitespace(`${headline} ${bodyText}`);
    const categories = inferCategories(searchText);

    notes.push({
      id,
      version,
      title,
      headline,
      releasedAt: timeMatch ? normalizeDateTime(timeMatch[1]) : null,
      releaseLabel: timeMatch ? textFromHtml(timeMatch[2]) : "",
      releaseDateLabel: tooltipDate || null,
      page,
      sourceUrl,
      categories,
      excerpt: makeExcerpt(bodyText),
      contentBlocks,
      sections,
      bodyText,
      searchText: searchText.toLowerCase(),
    });
  }

  return notes;
}

function parseContentBlocks(html) {
  const prepared = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<img\b[^>]*alt="([^"]*)"[^>]*>/gi, (_match, alt) => `\n@@IMAGE:${decodeHtml(alt)}\n`)
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_match, _level, text) => `\n@@HEADING:${textFromHtml(text)}\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_match, text) => `\n@@LIST:${textFromHtml(text)}\n`)
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_match, text) => `\n@@PARA:${textFromHtml(text)}\n`);

  const blocks = [];

  for (const line of prepared.split(/\n+/)) {
    const value = line.trim();
    if (!value) continue;

    if (value.startsWith("@@HEADING:")) {
      blocks.push({ type: "heading", text: normalizeWhitespace(value.slice(10)) });
    } else if (value.startsWith("@@LIST:")) {
      blocks.push({ type: "listItem", text: normalizeWhitespace(value.slice(7)) });
    } else if (value.startsWith("@@PARA:")) {
      blocks.push({ type: "paragraph", text: normalizeWhitespace(value.slice(7)) });
    } else if (value.startsWith("@@IMAGE:")) {
      blocks.push({ type: "image", text: normalizeWhitespace(value.slice(8)) });
    }
  }

  if (!blocks.length) {
    const fallback = textFromHtml(html);
    if (fallback) blocks.push({ type: "paragraph", text: fallback });
  }

  return blocks.filter((block) => block.text);
}

function buildSections(blocks) {
  const sections = [];
  let current = { heading: "Overview", blocks: [] };

  for (const block of blocks) {
    if (block.type === "heading") {
      if (current.blocks.length) sections.push(current);
      current = { heading: block.text, blocks: [] };
      continue;
    }

    current.blocks.push(block);
  }

  if (current.blocks.length) sections.push(current);
  return sections;
}

function parseHeadline(headline) {
  const match = headline.match(/^(?:Version\s+)?([0-9a-zA-Z.-]+)(?:\s+-\s+(.+))?$/i);
  if (!match) return { version: headline, title: "" };
  return {
    version: match[1],
    title: match[2] || "",
  };
}

function inferCategories(text) {
  return CATEGORY_RULES
    .filter(([, pattern]) => pattern.test(text))
    .map(([category]) => category);
}

function countCategories(notes) {
  return notes.reduce((counts, note) => {
    for (const category of note.categories) {
      counts[category] = (counts[category] || 0) + 1;
    }
    return counts;
  }, {});
}

function mergeNotes(existing, incoming) {
  const byKey = new Map();
  // Key by version or ID to avoid duplicate representations
  for (const note of existing) {
    const key = note.version ? `v_${note.version}` : `id_${note.id}`;
    byKey.set(key, note);
  }
  for (const note of incoming) {
    const key = note.version ? `v_${note.version}` : `id_${note.id}`;
    byKey.set(key, note);
  }
  return Array.from(byKey.values()).sort((a, b) => {
    const timeA = a.releasedAt ? Date.parse(a.releasedAt) : 0;
    const timeB = b.releasedAt ? Date.parse(b.releasedAt) : 0;
    if (timeA !== timeB) return timeB - timeA;
    return b.id - a.id;
  });
}

function readExisting(file) {
  if (!fs.existsSync(file)) return [];
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  return Array.isArray(payload.patchNotes) ? payload.patchNotes : [];
}

function parseTotalResults(html) {
  const value = firstMatch(html, /Showing\s+\d+\s+to\s+\d+\s+of\s+([\d,]+)\s+results/i);
  return value ? Number(value.replace(/,/g, "")) : null;
}

function parseLastPage(html, total) {
  const pageNumbers = Array.from(html.matchAll(/page=(\d+)/g), (match) => Number(match[1])).filter(Boolean);
  const linkedLastPage = pageNumbers.length ? Math.max(...pageNumbers) : 1;
  const calculatedLastPage = total ? Math.ceil(total / 8) : 1;
  return Math.max(linkedLastPage, calculatedLastPage);
}

function normalizeDateTime(value) {
  return value.includes("T") ? value : value.replace(" ", "T");
}

function formatDateLabel(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatRelativeDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const diffMs = Date.now() - d.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

function makeExcerpt(text) {
  const clean = normalizeWhitespace(text);
  if (clean.length <= 220) return clean;
  return `${clean.slice(0, 217).trim()}...`;
}

function textFromHtml(value = "") {
  return normalizeWhitespace(
    decodeHtml(
      value
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " "),
    ),
  );
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)));
}

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function firstMatch(value, pattern) {
  const match = value.match(pattern);
  return match ? match[1] : "";
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
