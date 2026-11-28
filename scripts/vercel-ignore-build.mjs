import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);

export const NON_BUILD_PATHSPECS = Object.freeze([
  ":!docs/",
  ":!tests/",
  ":!.github/",
  ":!.agents/",
  ":!ROADMAP.md",
  ":!README.md",
  ":!DESIGN.md",
  ":!AGENTS.md",
]);

/** @param {{ commitMessage?: string; previousSha?: string; currentSha?: string; runGitDiff?: (fromRef: string, toRef: string) => number | null }} [opts] */
export function shouldSkipVercelBuild({
  commitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || "",
  previousSha = process.env.VERCEL_GIT_PREVIOUS_SHA || "",
  currentSha = process.env.VERCEL_GIT_COMMIT_SHA || "HEAD",
  runGitDiff = undefined,
} = {}) {
  if (/\[(vercel\s+skip|skip\s+vercel)\]/i.test(commitMessage)) {
    return { skip: true, reason: "commit message requested vercel skip" };
  }

  const baseRef = previousSha || "HEAD^";
  const targetRef = currentSha || "HEAD";
  const diffExecutor =
    runGitDiff ||
    ((fromRef, toRef) =>
      spawnSync("git", ["diff", "--quiet", fromRef, toRef, "--", ".", ...NON_BUILD_PATHSPECS], {
        stdio: "ignore",
      }).status);

  const status = diffExecutor(baseRef, targetRef);
  if (status === 0) {
    return { skip: true, reason: `no runtime changes between ${baseRef} and ${targetRef}` };
  }
  return { skip: false, reason: "runtime files or git history changed" };
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
  const decision = shouldSkipVercelBuild();
  console.log(`[vercel-ignore] ${decision.skip ? "Skipping build" : "Proceeding with build"}: ${decision.reason}`);
  process.exit(decision.skip ? 0 : 1);
}
