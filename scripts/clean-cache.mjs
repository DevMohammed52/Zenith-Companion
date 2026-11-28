#!/usr/bin/env node

import { execFile } from "node:child_process";
import { lstat, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const rootDir = process.cwd();
const cleanAll = process.argv.includes("--all");
const forceClean = process.argv.includes("--force");

const CACHE_TARGETS = cleanAll
  ? [".next", "test-results", "playwright-report", "coverage", "tmp-ui-sweep"]
  : [
      ".next/dev",
      ".next/cache",
      ".next/trace",
      "test-results",
      "playwright-report",
      "coverage",
    ];

async function isNextDevRunning() {
  const workspaceName = path.basename(rootDir).toLowerCase();
  const matchesNextDev = (line) => {
    const lower = line.toLowerCase();
    if (!lower.includes(workspaceName)) return false;
    return (
      /\bnext(?:\.js)?["']?\s+dev\b/i.test(line) ||
      /next[\\/]+dist[\\/]+server[\\/]+lib[\\/]+start-server\.js/i.test(line) ||
      /\bnpm-cli\.js["']?\s+run\s+dev\b/i.test(line)
    );
  };

  try {
    if (process.platform === "win32") {
      const { stdout } = await execFileAsync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          "Get-CimInstance Win32_Process -Filter \"name = 'node.exe'\" | Select-Object -ExpandProperty CommandLine",
        ],
        { timeout: 3000 },
      );
      return stdout.split(/\r?\n/).some(matchesNextDev);
    }
    const { stdout } = await execFileAsync("ps", ["-ax", "-o", "command="], { timeout: 3000 });
    return stdout.split(/\r?\n/).some(matchesNextDev);
  } catch {
    return false;
  }
}

async function getDirectoryBytes(targetPath) {
  let stats;
  try {
    stats = await lstat(targetPath);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return 0;
    }
    throw error;
  }

  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    return stats.size;
  }

  const entries = await readdir(targetPath, { withFileTypes: true });
  let total = 0;
  for (const entry of entries) {
    const entryPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      total += await getDirectoryBytes(entryPath);
    } else if (entry.isFile()) {
      const entryStat = await lstat(entryPath);
      total += entryStat.size;
    }
  }
  return total;
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function main() {
  const devRunning = !forceClean && (await isNextDevRunning());
  let totalFreed = 0;
  let removedCount = 0;
  let failedCount = 0;

  for (const relativeTarget of CACHE_TARGETS) {
    if (devRunning && (relativeTarget === ".next/dev" || relativeTarget === ".next")) {
      console.log(`Skipped ${relativeTarget}: active next dev server detected (stop it first or pass --force).`);
      continue;
    }

    const fullPath = path.join(rootDir, relativeTarget);
    const bytes = await getDirectoryBytes(fullPath);

    try {
      await lstat(fullPath);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }

    try {
      await rm(fullPath, { recursive: true, force: true, maxRetries: 2 });
      totalFreed += bytes;
      removedCount += 1;
      console.log(`Removed ${relativeTarget} (${formatSize(bytes)})`);
    } catch (error) {
      failedCount += 1;
      const code = error && typeof error === "object" && "code" in error ? error.code : "";
      if (code === "EBUSY" || code === "EPERM" || code === "ENOTEMPTY") {
        console.error(`Skipped ${relativeTarget}: locked by another process (stop next dev first).`);
      } else {
        console.error(`Failed to remove ${relativeTarget}:`, error);
      }
    }
  }

  if (removedCount === 0 && failedCount === 0) {
    console.log("No removable local build or test caches found.");
    return;
  }

  console.log(`Cleaned ${removedCount} cache folder(s), freed ${formatSize(totalFreed)}.`);
  if (failedCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("clean:cache failed:", error);
  process.exitCode = 1;
});
