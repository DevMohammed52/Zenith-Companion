import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const DEFAULT_CONFIG_PATH = path.join("scripts", "lighthouse-budgets.json");
const baseUrl = process.env.LH_BASE_URL || "http://localhost:3000";
const configPath = process.env.LH_CONFIG_PATH || DEFAULT_CONFIG_PATH;
const lighthouseCli = path.join("node_modules", "lighthouse", "cli", "index.js");

const metricDefinitions = {
  performanceScore: {
    label: "Perf",
    pass: (value, budget) => value >= budget,
    read: (report) => report.categories?.performance?.score,
    render: (value) => value === null ? "n/a" : Math.round(value * 100).toString(),
    renderBudget: (value) => `>=${Math.round(value * 100)}`,
  },
  largestContentfulPaintMs: {
    auditId: "largest-contentful-paint",
    label: "LCP",
    pass: (value, budget) => value <= budget,
    render: (value) => value === null ? "n/a" : `${Math.round(value)}ms`,
    renderBudget: (value) => `<=${Math.round(value)}ms`,
  },
  cumulativeLayoutShift: {
    auditId: "cumulative-layout-shift",
    label: "CLS",
    pass: (value, budget) => value <= budget,
    render: (value) => value === null ? "n/a" : value.toFixed(3),
    renderBudget: (value) => `<=${value}`,
  },
  totalBlockingTimeMs: {
    auditId: "total-blocking-time",
    label: "TBT",
    pass: (value, budget) => value <= budget,
    render: (value) => value === null ? "n/a" : `${Math.round(value)}ms`,
    renderBudget: (value) => `<=${Math.round(value)}ms`,
  },
  speedIndexMs: {
    auditId: "speed-index",
    label: "SI",
    pass: (value, budget) => value <= budget,
    render: (value) => value === null ? "n/a" : `${Math.round(value)}ms`,
    renderBudget: (value) => `<=${Math.round(value)}ms`,
  },
  totalByteWeightBytes: {
    auditId: "total-byte-weight",
    label: "Bytes",
    pass: (value, budget) => value <= budget,
    render: (value) => value === null ? "n/a" : formatBytes(value),
    renderBudget: (value) => `<=${formatBytes(value)}`,
  },
};

function slugify(route) {
  return route.replace(/^\/$/, "dashboard").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

function formatBytes(value) {
  if (!Number.isFinite(value)) return "n/a";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)}${units[unitIndex]}`;
}

function routeFromUrl(value) {
  try {
    const pathname = new URL(value).pathname;
    return pathname || "/";
  } catch {
    return value;
  }
}

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function assertServer() {
  try {
    const response = await fetch(baseUrl, { method: "HEAD" });
    if (response.ok || response.status < 500) return;
  } catch {}
  throw new Error(`No running app found at ${baseUrl}. Start one first, for example: npm run dev`);
}

function routesFromConfig(config) {
  const configuredRoutes = Array.isArray(config.routes) ? config.routes : [];
  return configuredRoutes
    .map((route) => {
      if (typeof route === "string") return { path: route, name: route };
      return { path: route.path, name: route.name || route.path };
    })
    .filter((route) => typeof route.path === "string" && route.path.startsWith("/"));
}

function routesFromEnv(config) {
  if (!process.env.LH_ROUTES) return routesFromConfig(config);
  return process.env.LH_ROUTES
    .split(",")
    .map((route) => route.trim())
    .filter(Boolean)
    .map((route) => ({ path: route, name: route }));
}

function budgetForRoute(config, routePath) {
  return {
    ...(config.defaultBudgets || {}),
    ...((config.routeBudgets || {})[routePath] || {}),
  };
}

function readMetric(report, key) {
  const definition = metricDefinitions[key];
  if (!definition) return null;
  if (typeof definition.read === "function") {
    const value = definition.read(report);
    return Number.isFinite(value) ? value : null;
  }
  const value = report.audits?.[definition.auditId]?.numericValue;
  return Number.isFinite(value) ? value : null;
}

function evaluateReport(report, route, budgets, outputPath) {
  const failures = [];
  const metrics = {};

  if (report.runtimeError) {
    failures.push({
      label: "Runtime",
      message: `${route.path} Lighthouse runtime error: ${report.runtimeError.code || "unknown"} ${report.runtimeError.message || ""}`.trim(),
    });
  }

  for (const [key, budget] of Object.entries(budgets)) {
    const definition = metricDefinitions[key];
    if (!definition || !Number.isFinite(budget)) continue;

    const value = readMetric(report, key);
    metrics[key] = { budget, label: definition.label, value };

    if (value === null) {
      failures.push({
        label: definition.label,
        message: `${route.path} ${definition.label} was unavailable in ${outputPath}`,
      });
      continue;
    }

    if (!definition.pass(value, budget)) {
      failures.push({
        label: definition.label,
        message: `${route.path} ${definition.label} ${definition.render(value)} missed budget ${definition.renderBudget(budget)}`,
      });
    }
  }

  return {
    failures,
    metrics,
    outputPath,
    route,
    url: report.finalDisplayedUrl || report.finalUrl,
  };
}

function renderMetric(result, key) {
  const metric = result.metrics[key];
  const definition = metricDefinitions[key];
  return metric ? definition.render(metric.value) : "n/a";
}

function renderSummary(results) {
  const headers = ["Route", "Perf", "LCP", "CLS", "TBT", "SI", "Bytes"];
  const rows = results.map((result) => [
    result.route.path,
    renderMetric(result, "performanceScore"),
    renderMetric(result, "largestContentfulPaintMs"),
    renderMetric(result, "cumulativeLayoutShift"),
    renderMetric(result, "totalBlockingTimeMs"),
    renderMetric(result, "speedIndexMs"),
    renderMetric(result, "totalByteWeightBytes"),
  ]);
  const widths = headers.map((header, index) => Math.max(header.length, ...rows.map((row) => row[index].length)));
  const formatRow = (row) => row.map((cell, index) => cell.padEnd(widths[index])).join("  ");
  return [formatRow(headers), formatRow(headers.map((header) => "-".repeat(header.length))), ...rows.map(formatRow)].join("\n");
}

function runLighthouse(url, outputPath) {
  return spawnSync(process.execPath, [
    lighthouseCli,
    url,
    "--quiet",
    "--preset=desktop",
    "--chrome-flags=--headless=new",
    "--only-categories=performance",
    "--output=json",
    `--output-path=${outputPath}`,
  ], {
    encoding: "utf8",
    shell: false,
  });
}

async function runRoute(route, config, outputDir) {
  const url = new URL(route.path, baseUrl).toString();
  const outputPath = path.join(outputDir, `${slugify(route.path)}.json`);
  const retries = Math.max(0, Number(process.env.LH_RETRIES ?? config.retries ?? 1));
  let lastResult = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const attemptLabel = attempt === 0 ? "" : ` retry ${attempt}/${retries}`;
    console.log(`Running Lighthouse for ${url}${attemptLabel}`);
    const result = runLighthouse(url, outputPath);
    lastResult = result;

    if (result.status !== 0) {
      const outputExists = await fileExists(outputPath);
      const stderr = result.stderr || "";
      const isWindowsTempCleanupError = process.platform === "win32"
        && outputExists
        && stderr.includes("EPERM")
        && stderr.includes("lighthouse.");

      if (!isWindowsTempCleanupError) {
        if (attempt < retries) {
          const message = (result.stderr || result.stdout || "").split("\n").find(Boolean) || `exit code ${result.status ?? 1}`;
          console.warn(`${route.path} Lighthouse process failed (${message}); retrying.`);
          continue;
        }
        if (result.stdout) process.stdout.write(result.stdout);
        if (result.stderr) process.stderr.write(result.stderr);
        throw new Error(`Lighthouse failed for ${route.path} with exit code ${result.status ?? 1}`);
      }

      console.warn(`Lighthouse wrote ${outputPath}, but Chrome temp cleanup hit a Windows EPERM lock.`);
    }

    if (!(await fileExists(outputPath))) {
      if (attempt < retries) continue;
      throw new Error(`Lighthouse did not write ${outputPath}`);
    }

    const report = await readJson(outputPath);
    if (!report.runtimeError || attempt >= retries) return report;

    console.warn(`${route.path} hit ${report.runtimeError.code || "a runtime error"}; retrying once.`);
  }

  if (lastResult?.stderr) process.stderr.write(lastResult.stderr);
  throw new Error(`Lighthouse failed for ${route.path}`);
}

const config = await readJson(configPath);
const routes = routesFromEnv(config);
const outputDir = process.env.LH_OUTPUT_DIR || config.outputDir || "test-artifacts/lighthouse";

if (routes.length === 0) {
  throw new Error(`No Lighthouse routes configured in ${configPath}`);
}

await mkdir(outputDir, { recursive: true });
await assertServer();

const results = [];
const failures = [];

for (const route of routes) {
  const report = await runRoute(route, config, outputDir);
  const normalizedRoute = { ...route, path: routeFromUrl(report.finalDisplayedUrl || report.finalUrl || route.path) };
  const routeBudget = budgetForRoute(config, normalizedRoute.path);
  const result = evaluateReport(report, normalizedRoute, routeBudget, path.join(outputDir, `${slugify(route.path)}.json`));
  results.push(result);
  failures.push(...result.failures.map((failure) => failure.message));
}

const summary = {
  baseUrl,
  configPath,
  generatedAt: new Date().toISOString(),
  note: "Lighthouse does not provide a stable lab INP budget here; total blocking time is used as the local interaction-risk proxy while real INP is collected through Web Vitals telemetry.",
  results: results.map((result) => ({
    route: result.route.path,
    url: result.url,
    outputPath: result.outputPath,
    metrics: Object.fromEntries(Object.entries(result.metrics).map(([key, metric]) => [key, metric.value])),
    budgets: Object.fromEntries(Object.entries(result.metrics).map(([key, metric]) => [key, metric.budget])),
    passed: result.failures.length === 0,
  })),
};

await writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

console.log("");
console.log(renderSummary(results));
console.log("");
console.log(`Lighthouse reports written to ${outputDir}`);

if (failures.length > 0) {
  console.error("");
  console.error("Lighthouse budget failures:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Lighthouse budgets passed.");
