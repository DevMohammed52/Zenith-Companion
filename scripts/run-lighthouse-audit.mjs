import { mkdir, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const baseUrl = process.env.LH_BASE_URL || "http://localhost:3000";
const routes = (process.env.LH_ROUTES || "/,/items,/profiles,/settings")
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);
const outputDir = process.env.LH_OUTPUT_DIR || "test-artifacts/lighthouse";
const lighthouseCli = path.join("node_modules", "lighthouse", "cli", "index.js");

function slugify(route) {
  return route.replace(/^\/$/, "dashboard").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

async function assertServer() {
  try {
    const response = await fetch(baseUrl, { method: "HEAD" });
    if (response.ok || response.status < 500) return;
  } catch {}
  throw new Error(`No running app found at ${baseUrl}. Start one first, for example: npm run dev`);
}

await mkdir(outputDir, { recursive: true });
await assertServer();

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

for (const route of routes) {
  const url = new URL(route, baseUrl).toString();
  const outputPath = path.join(outputDir, `${slugify(route)}.json`);
  console.log(`Running Lighthouse for ${url}`);
  const result = spawnSync(process.execPath, [
    lighthouseCli,
    url,
    "--quiet",
    "--preset=desktop",
    "--chrome-flags=--headless=new",
    "--output=json",
    `--output-path=${outputPath}`,
  ], {
    encoding: "utf8",
    shell: false,
  });

  if (result.status !== 0) {
    const outputExists = await fileExists(outputPath);
    const stderr = result.stderr || "";
    const isWindowsTempCleanupError = process.platform === "win32"
      && outputExists
      && stderr.includes("EPERM")
      && stderr.includes("lighthouse.");

    if (isWindowsTempCleanupError) {
      console.warn(`Lighthouse wrote ${outputPath}, but Chrome temp cleanup hit a Windows EPERM lock.`);
      continue;
    }

    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
}

console.log(`Lighthouse reports written to ${outputDir}`);
