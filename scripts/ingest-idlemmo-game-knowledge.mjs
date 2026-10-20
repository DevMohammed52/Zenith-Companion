import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const KNOWLEDGE_DIR = path.join(ROOT, ".agents", "knowledge", "idlemmo");
const WIKI_DIR = path.join(KNOWLEDGE_DIR, "wiki");

const WIKI_SITEMAP_URL = "https://wiki.idle-mmo.com/sitemap.xml";
const TRELLO_ROADMAP_URL = "https://trello.com/b/CxIn7i5B.json";
const PATCH_NOTES_PATH = path.join(ROOT, "public", "idlemmo-patch-notes.json");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanHtmlToMarkdown(html, pageTitle = "", pageUrl = "") {
  // Extract main element if present
  let content = html;
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
  if (mainMatch) {
    content = mainMatch[0];
  }

  // Remove scripts, styles, SVGs, and nav bars
  content = content.replace(/<script[\s\S]*?<\/script>/gi, "");
  content = content.replace(/<style[\s\S]*?<\/style>/gi, "");
  content = content.replace(/<svg[\s\S]*?<\/svg>/gi, "");
  content = content.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  content = content.replace(/<button[\s\S]*?<\/button>/gi, "");

  // Convert tables to Markdown
  content = content.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => {
    const rows = [];
    const trMatches = [...tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)];
    for (const trMatch of trMatches) {
      const tr = trMatch[0];
      const cells = [];
      const cellMatches = [...tr.matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi)];
      for (const cm of cellMatches) {
        const text = cm[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        cells.push(text);
      }
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
    if (rows.length === 0) return "";
    const colCount = Math.max(...rows.map((r) => r.length));
    const header = rows[0].map((c) => c || "-");
    while (header.length < colCount) header.push("-");
    const divider = Array(colCount).fill("---");
    const bodyRows = rows.slice(1).map((r) => {
      const padded = [...r];
      while (padded.length < colCount) padded.push("");
      return `| ${padded.join(" | ")} |`;
    });
    return `\n| ${header.join(" | ")} |\n| ${divider.join(" | ")} |\n${bodyRows.join("\n")}\n`;
  });

  // Convert headings
  content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, text) => `\n# ${stripTags(text)}\n`);
  content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, text) => `\n## ${stripTags(text)}\n`);
  content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, text) => `\n### ${stripTags(text)}\n`);
  content = content.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, text) => `\n#### ${stripTags(text)}\n`);
  content = content.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_, text) => `\n##### ${stripTags(text)}\n`);
  content = content.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_, text) => `\n###### ${stripTags(text)}\n`);

  // Convert list items
  content = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text) => `\n* ${stripTags(text)}`);

  // Convert bold and italic
  content = content.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, text) => `**${stripTags(text)}**`);
  content = content.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, text) => `*${stripTags(text)}*`);
  content = content.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, text) => `\`${stripTags(text)}\``);

  // Convert paragraphs and linebreaks
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, text) => `\n\n${stripTags(text)}\n\n`);
  content = content.replace(/<br\s*\/?>/gi, "\n");
  content = content.replace(/<hr\s*\/?>/gi, "\n---\n");

  // Strip all remaining HTML tags
  content = stripTags(content);

  // Clean excessive whitespace and zero-width characters
  content = content.replace(/[\u200B-\u200D\uFEFF]/g, "");
  content = content.replace(/[ \t]+/g, " ");
  content = content.replace(/\n\s+\n/g, "\n\n");
  content = content.replace(/\n{3,}/g, "\n\n").trim();

  // Add frontmatter
  const frontmatter = [
    "---",
    `title: ${JSON.stringify(pageTitle)}`,
    `source: ${JSON.stringify(pageUrl)}`,
    `last_ingested: ${JSON.stringify(new Date().toISOString())}`,
    "---",
    "",
  ].join("\n");

  return `${frontmatter}\n${content}\n`;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchWithRetry(url, retries = 3, delay = 500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "ZenithCompanionKnowledgeIngest/1.0" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(delay * attempt);
    }
  }
}

async function ingestRoadmap() {
  console.log("Fetching IdleMMO Public Roadmap from Trello...");
  try {
    const raw = await fetchWithRetry(TRELLO_ROADMAP_URL);
    const data = JSON.parse(raw);
    const listsMap = new Map((data.lists || []).map((l) => [l.id, l.name]));

    const cardsByList = new Map();
    for (const card of data.cards || []) {
      if (card.closed) continue; // skip closed
      const listName = listsMap.get(card.idList) || "Other";
      if (!cardsByList.has(listName)) cardsByList.set(listName, []);
      cardsByList.get(listName).push(card);
    }

    let md = `# IdleMMO Public Roadmap\n\n> Source: https://trello.com/b/CxIn7i5B/idlemmo-public-roadmap\n> Last Updated: ${new Date().toISOString()}\n\n`;

    for (const [listName, cards] of cardsByList.entries()) {
      md += `## ${listName} (${cards.length} items)\n\n`;
      for (const card of cards) {
        md += `### ${card.name}\n\n`;
        if (card.labels && card.labels.length > 0) {
          const labels = card.labels.map((l) => `\`${l.name || l.color}\``).join(" ");
          md += `**Labels**: ${labels}\n\n`;
        }
        if (card.desc && card.desc.trim()) {
          md += `${card.desc.trim()}\n\n`;
        }
        md += `---\n\n`;
      }
    }

    const outPath = path.join(KNOWLEDGE_DIR, "roadmap.md");
    fs.writeFileSync(outPath, md, "utf-8");
    console.log(`Saved roadmap to ${outPath} (${data.cards?.length || 0} cards).`);
  } catch (err) {
    console.error("Failed to ingest roadmap:", err.message);
  }
}

async function ingestPatchNotesSummary() {
  console.log("Summarizing patch notes...");
  if (!fs.existsSync(PATCH_NOTES_PATH)) {
    console.log("No patch notes file found at", PATCH_NOTES_PATH);
    return;
  }
  const raw = fs.readFileSync(PATCH_NOTES_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  const notes = Array.isArray(parsed) ? parsed : (parsed.patchNotes || []);

  // Group notes by category and recent major updates
  const categoryCounts = {};
  for (const note of notes) {
    for (const cat of note.categories || []) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }

  let md = `# IdleMMO Patch Notes Knowledge Base Summary\n\n`;
  md += `> Source: public/idlemmo-patch-notes.json (${notes.length} total patch notes entries)\n\n`;
  md += `## Category Distribution\n\n`;
  md += `| Category | Total Updates |\n| --- | --- |\n`;
  for (const [cat, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
    md += `| ${cat} | ${count} |\n`;
  }
  md += `\n## Recent 30 Patch Updates (High Impact)\n\n`;

  for (const note of notes.slice(0, 30)) {
    md += `### ${note.title} (${note.releaseDateLabel || note.releaseLabel || note.releasedAt || "Unknown Date"})\n\n`;
    if (note.categories?.length > 0) {
      md += `**Categories**: ${note.categories.map((c) => `\`${c}\``).join(", ")}\n\n`;
    }
    const text = (note.bodyText || note.excerpt || "").trim();
    if (text) {
      md += `${text}\n\n`;
    }
    md += `---\n\n`;
  }

  const outPath = path.join(KNOWLEDGE_DIR, "patch-notes-summary.md");
  fs.writeFileSync(outPath, md, "utf-8");
  console.log(`Saved patch notes summary to ${outPath}.`);
}

async function ingestWiki() {
  console.log("Fetching IdleMMO Wiki sitemap...");
  const sitemapXml = await fetchWithRetry(WIKI_SITEMAP_URL);
  const urls = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  console.log(`Discovered ${urls.length} wiki URLs.`);

  ensureDir(WIKI_DIR);

  const indexEntries = [];
  const CONCURRENCY = 6;

  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const chunk = urls.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (url) => {
        try {
          const html = await fetchWithRetry(url);
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          let title = titleMatch ? titleMatch[1].replace(/\s*\|\s*IdleMMO Wiki.*$/i, "").trim() : "";
          if (!title) {
            const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
            title = h1Match ? stripTags(h1Match[1]) : "IdleMMO Wiki Article";
          }

          const u = new URL(url);
          const pathname = u.pathname.replace(/^\/|\/$/g, "");
          const parts = pathname.split("/").filter(Boolean);

          let relativeFilePath;
          if (parts.length === 0) {
            relativeFilePath = "home.md";
          } else if (parts.length === 1) {
            relativeFilePath = `${parts[0]}.md`;
          } else {
            const folder = parts.slice(0, -1).join(path.sep);
            const file = `${parts[parts.length - 1]}.md`;
            relativeFilePath = path.join(folder, file);
          }

          const fullFilePath = path.join(WIKI_DIR, relativeFilePath);
          ensureDir(path.dirname(fullFilePath));

          const mdContent = cleanHtmlToMarkdown(html, title, url);
          fs.writeFileSync(fullFilePath, mdContent, "utf-8");

          indexEntries.push({
            title,
            url,
            path: `wiki/${relativeFilePath.replace(/\\/g, "/")}`,
          });

          process.stdout.write(".");
        } catch (err) {
          console.error(`\nFailed to fetch ${url}:`, err.message);
        }
      })
    );
    await sleep(100);
  }

  console.log("\nFinished downloading all wiki pages.");

  // Generate INDEX.md
  indexEntries.sort((a, b) => a.title.localeCompare(b.title));
  let indexMd = `# IdleMMO Game Knowledge Base — Master Index\n\n`;
  mdIndexSection(indexEntries);
  fs.writeFileSync(path.join(KNOWLEDGE_DIR, "INDEX.md"), indexMd, "utf-8");
  console.log("Generated master knowledge index.");

  function mdIndexSection(entries) {
    indexMd += `Total Articles: ${entries.length}\n\n`;
    indexMd += `## Quick Reference by System\n\n`;
    const groups = new Map();
    for (const entry of entries) {
      const topFolder = entry.path.split("/")[1] || "general";
      if (!groups.has(topFolder)) groups.set(topFolder, []);
      groups.get(topFolder).push(entry);
    }

    for (const [group, items] of groups.entries()) {
      indexMd += `### ${group.toUpperCase().replace(/-/g, " ")}\n\n`;
      for (const item of items) {
        indexMd += `* [${item.title}](${item.path})\n`;
      }
      indexMd += `\n`;
    }
  }
}

async function main() {
  ensureDir(KNOWLEDGE_DIR);
  console.log("=== INGESTING IDLEMMO GAME KNOWLEDGE ===");
  await ingestRoadmap();
  await ingestPatchNotesSummary();
  await ingestWiki();
  console.log("=== INGESTION COMPLETE ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
