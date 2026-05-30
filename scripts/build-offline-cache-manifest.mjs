import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const OUTPUT_NAME = "offline-cache-manifest.json";
const OUTPUT_PATH = path.join(PUBLIC_DIR, OUTPUT_NAME);

const DATA_EXTENSIONS = new Set([".json", ".webmanifest"]);
const ASSET_EXTENSIONS = new Set([".png", ".svg", ".ico"]);
const BLOCKED_PUBLIC_PATHS = new Set([
  "/guild-members.json",
  "/guild-database.json",
  "/guild-details.json",
  "/guild-refresh-plan.json",
  "/items-map.json",
  "/scraper-status.json",
  "/scraper-priority.json",
]);

async function main() {
  const entries = await collectEntries(PUBLIC_DIR);
  const urls = [];
  let totalBytes = 0;
  const versionHash = crypto.createHash("sha256");

  for (const entry of entries.sort((a, b) => a.url.localeCompare(b.url))) {
    urls.push(entry.url);
    totalBytes += entry.size;
    versionHash.update(`${entry.url}:${entry.size}:${entry.hash}\n`);
  }

  const version = versionHash.digest("hex").slice(0, 16);
  const existingManifest = await readExistingManifest();
  const generatedAt =
    isSameCacheContents(existingManifest, { version, count: urls.length, totalBytes, urls }) &&
    typeof existingManifest.generatedAt === "string"
      ? existingManifest.generatedAt
      : new Date().toISOString();

  const manifest = {
    generatedAt,
    version,
    count: urls.length,
    totalBytes,
    urls,
  };

  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  const existingOutput = await readExistingOutput();

  if (existingOutput !== serialized) {
    await fs.writeFile(OUTPUT_PATH, serialized, "utf8");
  }

  console.log(
    `Offline cache manifest generated: ${manifest.count} urls, ${(manifest.totalBytes / 1024 / 1024).toFixed(2)} MiB.`,
  );
}

async function readExistingManifest() {
  try {
    return JSON.parse(await fs.readFile(OUTPUT_PATH, "utf8"));
  } catch {
    return null;
  }
}

async function readExistingOutput() {
  try {
    return await fs.readFile(OUTPUT_PATH, "utf8");
  } catch {
    return null;
  }
}

function isSameCacheContents(existing, next) {
  if (!existing) return false;
  if (
    existing.version !== next.version ||
    existing.count !== next.count ||
    existing.totalBytes !== next.totalBytes ||
    !Array.isArray(existing.urls) ||
    existing.urls.length !== next.urls.length
  ) {
    return false;
  }

  return existing.urls.every((url, index) => url === next.urls[index]);
}

async function collectEntries(directory) {
  const entries = [];
  const dirents = await fs.readdir(directory, { withFileTypes: true });

  for (const dirent of dirents) {
    const filePath = path.join(directory, dirent.name);

    if (dirent.isDirectory()) {
      entries.push(...(await collectEntries(filePath)));
      continue;
    }

    if (!dirent.isFile()) continue;
    if (dirent.name === OUTPUT_NAME) continue;

    const extension = path.extname(dirent.name).toLowerCase();
    if (!DATA_EXTENSIONS.has(extension) && !ASSET_EXTENSIONS.has(extension)) continue;

    const relativePath = path.relative(PUBLIC_DIR, filePath).split(path.sep).join("/");
    const url = `/${relativePath}`;
    if (BLOCKED_PUBLIC_PATHS.has(url)) continue;

    const bytes = await fs.readFile(filePath);
    entries.push({
      url,
      size: bytes.byteLength,
      hash: crypto.createHash("sha256").update(bytes).digest("hex"),
    });
  }

  return entries;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
