import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeJson } from "./idlemmo-fetch-utils.mjs";

const ROOT = process.cwd();
const BASE_URL = "https://support.idle-mmo.com/release-notes";
const LEGACY_URL = "https://web.idle-mmo.com/patch-notes";
const DEFAULT_OUT = path.join(ROOT, "public", "idlemmo-patch-notes.json");
const USER_AGENT = "ZenithCompanionPatchNotes/2.1";
const MD_CONCURRENCY = 3;
const PAGE_DELAY_MS = 150;

export const CATEGORY_RULES = [
  ["public-api", /\b(public api|api endpoint|endpoints?|hashed_id|pet public api|public pet api|rate limit|openapi)\b/i],
  ["combat", /\b(combat|battle|battles|battling|enemy|enemies|stance|health|hp|food used|loot chance|accuracy|protection|crit)\b/i],
  ["hunting", /\b(hunting|hunt|power hunting|pet hunting|hunts)\b/i],
  ["dungeons", /\b(dungeon|dungeons|queued dungeon|dungeoneering|crypt|keys)\b/i],
  ["world-bosses", /\b(world boss|world bosses|world-boss|boss timer|respawn)\b/i],
  ["pets", /\b(pet|pets|egg|eggs|companion exchange|celestial exchange|stamina|evolution|mastery)\b/i],
  ["guilds", /\b(guild|guilds|guild hall|guild weapon|guild raid|guild assault)\b/i],
  ["conquest", /\b(conquest|zone|zones|assault|dominated|contested|season rank|season shard|shards)\b/i],
  ["housing", /\b(house|houses|housing|construction|building|foundation|guest house|remote conduit|component|repair)\b/i],
  ["economy", /\b(economy|market|vendor|gold|tax|pricing|price|profit|trade|trading|loan|loans|membership item|dragon soul stone)\b/i],
  ["alchemy", /\b(alchemy|potion|potions|essence|crystal|brewing)\b/i],
  ["forge", /\b(forge|forging|temper|tempering|blueprint|blueprints|equipment|tool|tools|weapon|weapons|shield|shields|bow|bows)\b/i],
  ["skills", /\b(skill|skills|woodcutting|mining|fishing|cooking|smelting|smithing|foraging|level|experience|exp|forsaken|banished|cursed|talent|talents)\b/i],
  ["items", /\b(item|items|inventory|bank|drop|drops|loot|market listing|vendor value|museum|collectible)\b/i],
  ["weather", /\b(weather|forecast|storm)\b/i],
  ["map", /\b(map|location|locations|teleport|teleportation|travel)\b/i],
  ["tavern", /\b(tavern|post|reply|comment|spam)\b/i],
  ["translations", /\b(translation|translations|localisation|localization|language|indonesian|filipino|bahasa|chinese|italian|turkish|dialogue)\b/i],
  ["mobile-ui", /\b(mobile|android|ios|adreno|ui|ux|rendering|brightness|contrast|scale|push notifications?)\b/i],
  ["seasonal", /\b(seasonal|springtide|yule|lunar|campaign|event|shards)\b/i],
  ["membership", /\b(membership|member|members)\b/i],
  ["quests", /\b(quest|quests|dialogue)\b/i],
  ["bug-fixes", /\b(fixed|fix|bug|bugs|issue|issues|error|incorrect|missing|stale|preventing|resolved)\b/i],
];

const RAW_HTML_TAG_PATTERN = /<\/?(?:p|div|strong|em|b|i|ul|ol|li|h[1-6]|br|a|img|blockquote|span)\b/i;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(url, { headers = {}, timeoutMs = 15000, retries = 3 } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": USER_AGENT,
          ...headers,
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.ok) {
        return response;
      }

      if ((response.status === 429 || response.status >= 500) && attempt < retries) {
        const retryAfterSec = Number(response.headers.get("retry-after"));
        const backoffMs =
          Number.isFinite(retryAfterSec) && retryAfterSec > 0
            ? Math.min(retryAfterSec * 1000, 15000)
            : 350 * 2 ** attempt;
        await sleep(backoffMs);
        continue;
      }

      throw new Error(`HTTP ${response.status} ${response.statusText} (${url})`);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(350 * 2 ** attempt);
        continue;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch ${url}`);
}

async function fetchPage(page) {
  const url = page === 1 ? BASE_URL : `${BASE_URL}?page=${page}`;
  const response = await fetchWithRetry(url, {
    headers: { accept: "text/html,application/xhtml+xml" },
  });
  return response.text();
}

export function parseInertiaData(html) {
  const match = String(html || "").match(/data-page="([^"]+)"/);
  if (!match) return null;
  try {
    return JSON.parse(decodeHtml(match[1]));
  } catch {
    return null;
  }
}

export function hasRawHtmlTags(value) {
  return RAW_HTML_TAG_PATTERN.test(String(value || ""));
}

function isReusableExistingNote(existingNote, item, headline, releasedAt) {
  if (!existingNote) return false;
  if (!Array.isArray(existingNote.contentBlocks) || existingNote.contentBlocks.length === 0) return false;
  if (hasRawHtmlTags(existingNote.bodyText) || hasRawHtmlTags(existingNote.excerpt)) return false;
  if (existingNote.contentBlocks.some((b) => hasRawHtmlTags(b?.text))) return false;
  if (existingNote.headline !== headline) return false;
  if (existingNote.releasedAt !== releasedAt) return false;
  // Re-fetch once if source was truncated and existing text was just a tiny stub under 220 chars
  if (item.is_truncated && String(existingNote.bodyText || "").endsWith("...")) return false;
  return true;
}

function finalizeNote({
  id,
  headline,
  releasedAt,
  releaseLabel,
  releaseDateLabel,
  page,
  sourceUrl,
  contentBlocks,
}) {
  const { version, title } = parseHeadline(headline);
  const cleanedBlocks = trimLeadingDuplicateHeadline(contentBlocks, headline, version);
  const sections = buildSections(cleanedBlocks);
  const bodyText = cleanedBlocks.map((b) => b.text).join("\n");
  const searchText = normalizeWhitespace(`${headline} ${bodyText}`);
  const categories = inferCategories(searchText);

  return {
    id,
    version,
    title,
    headline,
    releasedAt,
    releaseLabel: releaseLabel ?? formatRelativeDate(releasedAt),
    releaseDateLabel: releaseDateLabel ?? formatDateLabel(releasedAt),
    page,
    sourceUrl,
    categories,
    excerpt: makeExcerpt(bodyText),
    contentBlocks: cleanedBlocks,
    sections,
    bodyText,
    searchText: searchText.toLowerCase(),
  };
}

function trimLeadingDuplicateHeadline(blocks, headline, version) {
  if (!Array.isArray(blocks) || blocks.length <= 1) return blocks || [];
  const first = blocks[0];
  if (first?.type !== "heading") return blocks;
  const firstNorm = normalizeWhitespace(first.text).toLowerCase();
  const headlineNorm = normalizeWhitespace(headline).toLowerCase();
  const versionNorm = normalizeWhitespace(version).toLowerCase();
  if (firstNorm === headlineNorm || firstNorm === `version ${versionNorm}`) {
    return blocks.slice(1);
  }
  return blocks;
}

async function processInertiaBatch(items, page, existingById, { forceDetails = false } = {}) {
  const results = [];
  const needMd = [];

  for (const item of items) {
    const id = Number(item.id);
    const headline = textFromHtml(item.title_html || "");
    const releasedAt = item.released_at ? normalizeDateTime(item.released_at) : null;
    const sourceUrl = item.path ? `https://support.idle-mmo.com${item.path}` : `${BASE_URL}?patch_note_id=${id}`;
    const existingNote = existingById.get(id);

    if (item.is_truncated && item.path) {
      if (!forceDetails && isReusableExistingNote(existingNote, item, headline, releasedAt)) {
        results.push({ ...sanitizePatchNote(existingNote), page });
      } else {
        needMd.push({ item, id, headline, releasedAt, sourceUrl });
      }
      continue;
    }

    const contentBlocks = parseBodyBlocks(item.content_html || "");
    results.push(
      finalizeNote({
        id,
        headline,
        releasedAt,
        releaseLabel: formatRelativeDate(releasedAt),
        releaseDateLabel: formatDateLabel(releasedAt),
        page,
        sourceUrl,
        contentBlocks,
      }),
    );
  }

  for (let i = 0; i < needMd.length; i += MD_CONCURRENCY) {
    const chunk = needMd.slice(i, i + MD_CONCURRENCY);
    const chunkNotes = await Promise.all(
      chunk.map(async ({ item, id, headline, releasedAt, sourceUrl }) => {
        let rawBody = item.content_html || "";
        try {
          const mdRes = await fetchWithRetry(`https://support.idle-mmo.com${item.path}.md`);
          rawBody = await mdRes.text();
        } catch {
          // Fall back cleanly to inline HTML content when .md detail fetch fails
        }
        const contentBlocks = parseBodyBlocks(rawBody);
        return finalizeNote({
          id,
          headline,
          releasedAt,
          releaseLabel: formatRelativeDate(releasedAt),
          releaseDateLabel: formatDateLabel(releasedAt),
          page,
          sourceUrl,
          contentBlocks,
        });
      }),
    );
    results.push(...chunkNotes);
    if (i + MD_CONCURRENCY < needMd.length) {
      await sleep(PAGE_DELAY_MS);
    }
  }

  return results;
}

export function parseBodyBlocks(raw = "") {
  const source = String(raw || "").trim();
  if (!source) return [];
  return hasRawHtmlTags(source) ? parseContentBlocks(source) : parseMarkdownBlocks(source);
}

export function parseMarkdownBlocks(md = "") {
  const source = String(md || "").trim();
  if (!source) return [];
  if (hasRawHtmlTags(source)) {
    return parseContentBlocks(source);
  }

  const lines = source.split(/\r?\n/);
  const blocks = [];

  for (const rawLine of lines) {
    const line = normalizeWhitespace(rawLine);
    if (!line) continue;

    if (line.startsWith("#")) {
      const text = normalizeWhitespace(line.replace(/^#+\s*/, ""));
      if (text) blocks.push({ type: "heading", text });
    } else if (/^[-*•]\s+/.test(line)) {
      const text = normalizeWhitespace(line.replace(/^[-*•]\s+/, ""));
      if (text) blocks.push({ type: "listItem", text });
    } else if (/^\*\*[^*]+\*\*$/.test(line) && line.length <= 64) {
      const text = normalizeWhitespace(line.slice(2, -2));
      if (text) blocks.push({ type: "heading", text });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }

  return blocks;
}

export function parseContentBlocks(html = "") {
  const prepared = String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<img\b[^>]*alt="([^"]*)"[^>]*>/gi, (_match, alt) => `\n@@IMAGE:${decodeHtml(alt)}\n`)
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_match, _level, text) => `\n@@HEADING:${textFromHtml(text)}\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_match, text) => `\n@@LIST:${textFromHtml(text)}\n`)
    .replace(
      /<p[^>]*>\s*<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>\s*<\/p>/gi,
      (_match, text) => {
        const clean = textFromHtml(text);
        if (clean && clean.length <= 64 && !/[.!?]$/.test(clean)) {
          return `\n@@HEADING:${clean}\n`;
        }
        return `\n@@PARA:${clean}\n`;
      },
    )
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_match, text) => {
      const clean = textFromHtml(text);
      if (/^[-*•]\s+/.test(clean)) {
        return `\n@@LIST:${normalizeWhitespace(clean.replace(/^[-*•]\s+/, ""))}\n`;
      }
      return `\n@@PARA:${clean}\n`;
    });

  const blocks = [];

  for (const rawLine of prepared.split(/\n+/)) {
    const value = rawLine.trim();
    if (!value) continue;

    if (value.startsWith("@@HEADING:")) {
      const text = normalizeWhitespace(value.slice(10));
      if (text) blocks.push({ type: "heading", text });
    } else if (value.startsWith("@@LIST:")) {
      const text = normalizeWhitespace(value.slice(7));
      if (text) blocks.push({ type: "listItem", text });
    } else if (value.startsWith("@@PARA:")) {
      const text = normalizeWhitespace(value.slice(7));
      if (text) blocks.push({ type: "paragraph", text });
    } else if (value.startsWith("@@IMAGE:")) {
      const text = normalizeWhitespace(value.slice(8));
      if (text) blocks.push({ type: "image", text });
    }
  }

  if (!blocks.length) {
    const fallback = textFromHtml(html);
    if (fallback) {
      if (/^[-*•]\s+/.test(fallback)) {
        blocks.push({ type: "listItem", text: normalizeWhitespace(fallback.replace(/^[-*•]\s+/, "")) });
      } else {
        blocks.push({ type: "paragraph", text: fallback });
      }
    }
  }

  return blocks.filter((block) => block.text);
}

export function sanitizePatchNote(note) {
  if (!note || typeof note !== "object") return note;
  const rawJoined =
    Array.isArray(note.contentBlocks) && note.contentBlocks.length > 0
      ? note.contentBlocks
          .map((block) => {
            const text = String(block?.text || "");
            if (hasRawHtmlTags(text)) return text;
            if (block.type === "heading") return `<h2>${text}</h2>`;
            if (block.type === "listItem") return `<li>${text}</li>`;
            if (block.type === "image") return `<img alt="${text}" />`;
            return `<p>${text}</p>`;
          })
          .join("\n")
      : String(note.bodyText || note.excerpt || "");

  const contentBlocks = parseBodyBlocks(rawJoined);
  return finalizeNote({
    id: Number(note.id),
    headline: textFromHtml(note.headline || note.title || note.version || ""),
    releasedAt: note.releasedAt || null,
    releaseLabel: note.releaseLabel || "",
    releaseDateLabel: note.releaseDateLabel || null,
    page: Number(note.page) || 1,
    sourceUrl: note.sourceUrl || `${BASE_URL}?patch_note_id=${note.id}`,
    contentBlocks,
  });
}

export function sanitizePayload(payload) {
  const existing = Array.isArray(payload?.patchNotes) ? payload.patchNotes : [];
  const sanitized = mergeNotes([], existing.map((note) => sanitizePatchNote(note)));
  return buildPayload(sanitized, {
    source: payload?.meta?.source || BASE_URL,
    mode: payload?.meta?.mode || "sanitized",
    totalAvailable: Math.max(Number(payload?.meta?.totalAvailable) || 0, sanitized.length),
    fetchedPages: payload?.meta?.fetchedPages || [1],
  });
}

export function parseLegacyPatchNotesPage(html, page) {
  const notes = [];
  const pattern = /<div id="patch-note-(\d+)">([\s\S]*?)(?=\s*<hr class="border-gray-800 my-12">|\s*<div class="mt-6 flex|\s*<nav|\s*<\/div>\s*<\/div>\s*<footer)/g;
  let match;

  while ((match = pattern.exec(html))) {
    const id = Number(match[1]);
    const block = match[2];
    const headline = textFromHtml(firstMatch(block, /<h2[^>]*>([\s\S]*?)<\/h2>/i));
    const timeMatch = block.match(/<time\s+datetime="([^"]+)">([\s\S]*?)<\/time>/i);
    const sourceUrl =
      firstMatch(block, /\$clipboard\('([^']+patch_note_id=\d+)'/i) ||
      `${LEGACY_URL}?patch_note_id=${id}`;
    const tooltipDate = firstMatch(block, /x-tooltip="'([^']+)'"><time/i);
    const bodyHtml = firstMatch(block, /<div class="markdown">\s*<div>([\s\S]*?)<\/div>\s*<\/div>/i) || "";
    const contentBlocks = parseBodyBlocks(bodyHtml);

    notes.push(
      finalizeNote({
        id,
        headline,
        releasedAt: timeMatch ? normalizeDateTime(timeMatch[1]) : null,
        releaseLabel: timeMatch ? textFromHtml(timeMatch[2]) : "",
        releaseDateLabel: tooltipDate || null,
        page,
        sourceUrl,
        contentBlocks,
      }),
    );
  }

  return notes;
}

export function buildSections(blocks) {
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

export function parseHeadline(headline) {
  const clean = normalizeWhitespace(headline);
  const match = clean.match(/^(?:Version\s+)?([0-9]+(?:\.[0-9]+)+(?:-[a-zA-Z0-9]+)?)(?:\s*[-:]\s*(.+))?$/i);
  if (!match) return { version: clean, title: "" };
  return {
    version: match[1],
    title: normalizeWhitespace(match[2] || ""),
  };
}

export function inferCategories(text) {
  return CATEGORY_RULES
    .filter(([, pattern]) => pattern.test(text))
    .map(([category]) => category);
}

export function countCategories(notes) {
  return notes.reduce((counts, note) => {
    for (const category of note.categories || []) {
      counts[category] = (counts[category] || 0) + 1;
    }
    return counts;
  }, {});
}

export function mergeNotes(existing, incoming) {
  const byKey = new Map();
  // Key strictly by numeric patch ID when available so updates with duplicate version tags are not lost
  const getKey = (note) => (Number.isFinite(Number(note?.id)) && Number(note.id) > 0 ? `id_${Number(note.id)}` : `v_${note?.version || ""}`);

  for (const note of existing) {
    byKey.set(getKey(note), note);
  }
  for (const note of incoming) {
    byKey.set(getKey(note), note);
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const timeA = a.releasedAt ? Date.parse(a.releasedAt) : 0;
    const timeB = b.releasedAt ? Date.parse(b.releasedAt) : 0;
    if (timeA !== timeB) return timeB - timeA;
    return Number(b.id || 0) - Number(a.id || 0);
  });
}

function buildPayload(merged, { source = BASE_URL, mode = "full-refresh", totalAvailable = 0, fetchedPages = [1] } = {}) {
  const categoryCounts = countCategories(merged);
  const latest = merged[0];
  const oldest = merged.at(-1);

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      source,
      mode,
      totalAvailable: Math.max(Number(totalAvailable) || 0, merged.length),
      totalFetched: merged.length,
      fetchedPages,
      latestPatchId: latest?.id ?? null,
      oldestPatchId: oldest?.id ?? null,
      latestVersion: latest?.version ?? null,
      oldestVersion: oldest?.version ?? null,
      categoryCounts,
      note: "Generated from the public IdleMMO release notes page. Keep sourceUrl links visible in UI.",
    },
    patchNotes: merged,
  };
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
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function formatRelativeDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Math.max(0, Date.now() - d.getTime());
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

export function makeExcerpt(text) {
  const clean = normalizeWhitespace(text);
  if (clean.length <= 220) return clean;
  const slice = clean.slice(0, 217);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > 140 ? slice.slice(0, lastSpace) : slice).trim()}...`;
}

export function textFromHtml(value = "") {
  return normalizeWhitespace(
    decodeHtml(
      String(value || "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " "),
    ),
  );
}

export function decodeHtml(value) {
  return String(value || "")
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
    const [rawKey, rawVal] = arg.slice(2).split("=");
    const next = rawVal ?? argv[index + 1];
    if (rawVal === undefined && (!next || next.startsWith("--"))) {
      parsed[rawKey] = true;
    } else if (rawVal !== undefined) {
      parsed[rawKey] = rawVal;
    } else {
      parsed[rawKey] = next;
      index += 1;
    }
  }
  return parsed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outFile = path.resolve(String(args.out || DEFAULT_OUT));
  const latestOnly = Boolean(args["latest-only"]);
  const sanitizeExistingOnly = Boolean(args["sanitize-existing"]);
  const forceDetails = Boolean(args.force);

  const existingRaw = readExisting(outFile);
  const sanitizedExisting = existingRaw.map((note) => sanitizePatchNote(note));

  if (sanitizeExistingOnly) {
    const existingPayload = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf8")) : {};
    const cleaned = sanitizePayload({ ...existingPayload, patchNotes: sanitizedExisting });
    writeJson(outFile, cleaned);
    console.log(`Sanitized ${cleaned.patchNotes.length} existing patch notes in ${path.relative(ROOT, outFile)}.`);
    return;
  }

  const existingById = new Map(sanitizedExisting.map((note) => [Number(note.id), note]));
  const firstPageHtml = await fetchPage(1);
  const inertiaData = parseInertiaData(firstPageHtml);

  let total = 0;
  let lastPage = 1;
  let pagesToFetch = [1];
  const allNotes = [];

  if (inertiaData?.props?.notes) {
    const notesProp = inertiaData.props.notes;
    total = notesProp.total || 0;
    lastPage = notesProp.last_page || 1;
    pagesToFetch = latestOnly ? [1] : Array.from({ length: lastPage }, (_, index) => index + 1);

    for (const page of pagesToFetch) {
      const html = page === 1 ? firstPageHtml : await fetchPage(page);
      const pageData = page === 1 ? inertiaData : parseInertiaData(html);
      const pageItems = pageData?.props?.notes?.data || [];
      if (pageItems.length > 0) {
        const parsedPageNotes = await processInertiaBatch(pageItems, page, existingById, { forceDetails });
        allNotes.push(...parsedPageNotes);
      }
      if (page !== pagesToFetch.at(-1)) await sleep(PAGE_DELAY_MS);
    }
  } else {
    total = parseTotalResults(firstPageHtml) || 0;
    lastPage = parseLastPage(firstPageHtml, total);
    pagesToFetch = latestOnly ? [1] : Array.from({ length: lastPage }, (_, index) => index + 1);

    for (const page of pagesToFetch) {
      const html = page === 1 ? firstPageHtml : await fetchPage(page);
      allNotes.push(...parseLegacyPatchNotesPage(html, page));
      if (page !== pagesToFetch.at(-1)) await sleep(PAGE_DELAY_MS);
    }
  }

  const merged = mergeNotes(sanitizedExisting, allNotes);
  const payload = buildPayload(merged, {
    source: BASE_URL,
    mode: latestOnly ? "latest-page-merge" : "full-refresh",
    totalAvailable: total || merged.length,
    fetchedPages: pagesToFetch,
  });

  writeJson(outFile, payload);
  console.log(`Wrote ${path.relative(ROOT, outFile)} with ${merged.length} patch notes.`);
  console.log(`Latest: ${payload.meta.latestVersion ?? "n/a"} (#${payload.meta.latestPatchId ?? "n/a"})`);
  console.log(`Oldest: ${payload.meta.oldestVersion ?? "n/a"} (#${payload.meta.oldestPatchId ?? "n/a"})`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
