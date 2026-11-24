import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const KNOWLEDGE_DIR = path.join(ROOT, ".agents", "knowledge", "idlemmo");
const WIKI_DIR = path.join(KNOWLEDGE_DIR, "wiki");

const SUPPORT_BASE_URL = "https://support.idle-mmo.com";
const TRELLO_ROADMAP_URL = "https://trello.com/b/CxIn7i5B.json";
const PATCH_NOTES_PATH = path.join(ROOT, "public", "idlemmo-patch-notes.json");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function fetchWithRetry(url, options = {}, retries = 3, delay = 500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "ZenithCompanionKnowledgeIngest/2.0",
          ...(options.headers || {}),
        },
        signal: AbortSignal.timeout(10000),
        ...options,
      });
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(delay * attempt);
    }
  }
}

async function ingestRoadmap() {
  console.log("Fetching IdleMMO Public Roadmap from Trello...");
  try {
    const res = await fetchWithRetry(TRELLO_ROADMAP_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const listsMap = new Map((data.lists || []).map((l) => [l.id, l.name]));

    const cardsByList = new Map();
    for (const card of data.cards || []) {
      if (card.closed) continue;
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

async function discoverAllArticles() {
  console.log("Discovering all official articles from support.idle-mmo.com...");
  const articles = [];
  const sections = ["wiki", "knowledge-base"];

  for (const sec of sections) {
    try {
      const res = await fetchWithRetry(`${SUPPORT_BASE_URL}/${sec}`);
      if (!res.ok) continue;
      const html = await res.text();
      const m = html.match(/data-page="([^"]+)"/);
      if (!m) continue;
      const data = JSON.parse(m[1].replace(/&quot;/g, '"'));
      const categories = data.props?.categories || [];

      for (const cat of categories) {
        const catUrl = `${SUPPORT_BASE_URL}${cat.path}`;
        try {
          const catRes = await fetchWithRetry(catUrl);
          if (!catRes.ok) continue;
          const catHtml = await catRes.text();
          const catM = catHtml.match(/data-page="([^"]+)"/);
          if (!catM) continue;
          const catData = JSON.parse(catM[1].replace(/&quot;/g, '"'));
          const catObj = catData.props?.category || {};
          const catArticles = catObj.articles?.data || catObj.articles || cat.articles || [];

          for (const a of catArticles) {
            const slug = a.slug;
            const categoryFolder = cat.path.replace(/^\/(wiki|knowledge-base)\/?/, "").replace(/^\/|\/$/g, "");
            const title = a.title || (a.title_html ? a.title_html.replace(/<[^>]+>/g, "").trim() : slug);
            articles.push({
              section: sec,
              categoryName: cat.name || categoryFolder,
              categoryFolder,
              slug,
              title,
              url: `${SUPPORT_BASE_URL}${cat.path}/${slug}`,
              mdUrl: `${SUPPORT_BASE_URL}${cat.path}/${slug}.md`,
            });
          }
        } catch (err) {
          console.warn(`Failed to inspect category ${cat.path}: ${err.message}`);
        }
      }
    } catch (err) {
      console.warn(`Failed to inspect section ${sec}: ${err.message}`);
    }
  }

  console.log(`Discovered ${articles.length} total articles across all categories.`);
  return articles;
}

async function ingestWiki() {
  ensureDir(WIKI_DIR);
  const articles = await discoverAllArticles();
  const indexEntries = [];
  const CONCURRENCY = 8;
  let successCount = 0;
  let failCount = 0;

  console.log(`Downloading clean Markdown for ${articles.length} articles...`);

  for (let i = 0; i < articles.length; i += CONCURRENCY) {
    const chunk = articles.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (art) => {
        try {
          const res = await fetchWithRetry(art.mdUrl);
          let body = "";
          if (res.ok) {
            body = await res.text();
          } else {
            // Fallback to HTML
            const htmlRes = await fetchWithRetry(art.url);
            if (!htmlRes.ok) throw new Error(`HTTP ${res.status}`);
            const html = await htmlRes.text();
            body = stripHtmlFallback(html);
          }

          // Use H1 from body if available
          const h1Match = body.match(/^#\s+(.+)$/m);
          const finalTitle = h1Match ? h1Match[1].trim() : art.title;

          // Build clean file with metadata frontmatter
          const frontmatter = [
            "---",
            `title: ${JSON.stringify(finalTitle)}`,
            `category: ${JSON.stringify(art.categoryName)}`,
            `section: ${JSON.stringify(art.section)}`,
            `source: ${JSON.stringify(art.url)}`,
            `last_ingested: ${JSON.stringify(new Date().toISOString())}`,
            "---",
            "",
            "",
          ].join("\n");

          const targetDir = path.join(WIKI_DIR, art.categoryFolder);
          ensureDir(targetDir);
          const targetFile = path.join(targetDir, `${art.slug}.md`);

          fs.writeFileSync(targetFile, frontmatter + body.trim() + "\n", "utf-8");
          successCount++;

          const relPath = `wiki/${art.categoryFolder}/${art.slug}.md`;
          indexEntries.push({
            title: finalTitle,
            category: art.categoryName,
            categoryFolder: art.categoryFolder,
            path: relPath,
          });

          process.stdout.write(".");
        } catch (err) {
          failCount++;
          console.warn(`\nFailed to download ${art.url}: ${err.message}`);
        }
      })
    );
    await sleep(50);
  }

  console.log(`\nFinished: ${successCount} articles saved successfully (${failCount} failures).`);

  // Build master index
  indexEntries.sort((a, b) => a.title.localeCompare(b.title));
  let indexMd = `# IdleMMO Game Knowledge Base — Master Index\n\n`;
  indexMd += `> Source: Official IdleMMO Support & Knowledge Base (https://support.idle-mmo.com)\n`;
  indexMd += `> Last Ingested: ${new Date().toISOString()}\n`;
  indexMd += `> Total Articles: ${indexEntries.length}\n\n`;
  indexMd += `## Quick Reference by System\n\n`;

  const groups = new Map();
  for (const entry of indexEntries) {
    if (!groups.has(entry.category)) groups.set(entry.category, []);
    groups.get(entry.category).push(entry);
  }

  for (const [groupName, items] of Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    indexMd += `### ${groupName} (${items.length})\n\n`;
    for (const item of items) {
      indexMd += `* [${item.title}](${item.path})\n`;
    }
    indexMd += "\n";
  }

  const indexFilePath = path.join(KNOWLEDGE_DIR, "INDEX.md");
  fs.writeFileSync(indexFilePath, indexMd, "utf-8");
  console.log(`Saved master index to ${indexFilePath}.`);
}

function stripHtmlFallback(html) {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "");
  const main = text.match(/<main[\s\S]*?<\/main>/i)?.[0] || text;
  return main.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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
