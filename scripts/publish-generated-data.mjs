import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, toArray } from "./idlemmo-fetch-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const args = parseArgs();

const pathspecs = toArray(args.path || args.paths).map(String).filter(Boolean);
const commitMessage = String(args["commit-message"] || "").trim();
const emptyMessage = String(args["empty-message"] || "No generated changes to commit");
const retryMessage = String(args["retry-message"] || "Push failed; refreshing generated-data commit onto latest main.");
const maxAttempts = Math.max(1, Number(args["max-attempts"] || 5));
const remote = String(args.remote || "origin");
const branch = String(args.branch || "main");

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: repoRoot,
    env: process.env,
    shell: false,
    stdio: options.capture ? "pipe" : "inherit",
    encoding: "utf8",
  });

  if (options.allowFailure) return result;
  if (result.status !== 0) {
    throw new Error(`${command} ${commandArgs.join(" ")} failed with exit code ${result.status}`);
  }
  return result;
}

function git(commandArgs, options) {
  return run("git", commandArgs, options);
}

function normalizeRelative(relativePath) {
  return relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function patternToRegex(pattern) {
  const escaped = pattern.split("*").map(escapeRegex).join("[^/]*");
  return new RegExp(`^${escaped}$`);
}

function expandPathspec(pathspec) {
  const normalized = normalizeRelative(pathspec);
  if (!normalized.includes("*")) {
    const absolutePath = path.resolve(repoRoot, normalized);
    return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile() ? [normalized] : [];
  }

  const slashIndex = normalized.lastIndexOf("/");
  const directory = slashIndex === -1 ? "." : normalized.slice(0, slashIndex);
  const filePattern = slashIndex === -1 ? normalized : normalized.slice(slashIndex + 1);
  const absoluteDirectory = path.resolve(repoRoot, directory);
  if (!fs.existsSync(absoluteDirectory) || !fs.statSync(absoluteDirectory).isDirectory()) return [];

  const matcher = patternToRegex(filePattern);
  return fs
    .readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && matcher.test(entry.name))
    .map((entry) => normalizeRelative(path.join(directory, entry.name)))
    .sort((a, b) => a.localeCompare(b));
}

function unique(values) {
  return [...new Set(values)];
}

function expandAllPathspecs() {
  const files = unique(pathspecs.flatMap(expandPathspec));
  if (files.length === 0) {
    throw new Error(`No files matched generated-data pathspecs: ${pathspecs.join(", ")}`);
  }
  return files;
}

function hasStagedChanges() {
  return git(["diff", "--cached", "--quiet"], { allowFailure: true }).status !== 0;
}

function copyFiles(files, destinationRoot) {
  for (const relativePath of files) {
    const sourcePath = path.resolve(repoRoot, relativePath);
    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) continue;

    const destinationPath = path.resolve(destinationRoot, relativePath);
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
  }
}

function restoreFiles(files, sourceRoot) {
  for (const relativePath of files) {
    const sourcePath = path.resolve(sourceRoot, relativePath);
    if (!fs.existsSync(sourcePath)) continue;

    const destinationPath = path.resolve(repoRoot, relativePath);
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
  }
}

function addGeneratedFiles() {
  git(["add", "--sparse", "--", ...pathspecs]);
}

function commitGeneratedFiles(message) {
  git(["commit", "-m", message]);
}

function sleepSeconds(seconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, seconds * 1000);
}

function publish() {
  if (pathspecs.length === 0) throw new Error("Pass at least one --path pathspec.");
  if (!commitMessage) throw new Error("Pass --commit-message.");

  git(["config", "--local", "user.email", "action@github.com"]);
  git(["config", "--local", "user.name", "GitHub Action"]);

  addGeneratedFiles();
  if (!hasStagedChanges()) {
    console.log(emptyMessage);
    return;
  }

  const files = expandAllPathspecs();
  const generatedDir = fs.mkdtempSync(path.join(os.tmpdir(), "zenith-generated-data-"));
  copyFiles(files, generatedDir);

  git(["restore", "--staged", "--worktree", "--", ...pathspecs]);
  git(["clean", "-f", "--", ...pathspecs]);
  git(["pull", "--rebase", remote, branch]);

  restoreFiles(files, generatedDir);
  addGeneratedFiles();
  if (!hasStagedChanges()) {
    console.log("Remote already contains the generated data.");
    return;
  }

  commitGeneratedFiles(commitMessage);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const push = git(["push", remote, `HEAD:${branch}`], { allowFailure: true });
    if (push.status === 0) return;
    if (attempt === maxAttempts) break;

    console.log(`Push attempt ${attempt} failed; ${retryMessage}`);
    sleepSeconds(attempt * 10);
    git(["fetch", remote, branch]);
    git(["reset", "--mixed", `${remote}/${branch}`]);
    restoreFiles(files, generatedDir);
    addGeneratedFiles();
    if (!hasStagedChanges()) {
      console.log("Remote already contains the generated data.");
      return;
    }
    commitGeneratedFiles(commitMessage);
  }

  throw new Error(`Unable to push generated data after ${maxAttempts} attempts.`);
}

publish();
