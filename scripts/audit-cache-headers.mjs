import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_OUTPUT_DIR = path.join("test-artifacts", "cache-headers");
const baseUrl = normalizeBaseUrl(
  process.env.CACHE_AUDIT_BASE_URL
    || process.env.HEADER_AUDIT_BASE_URL
    || process.env.LH_BASE_URL
    || process.argv[2]
    || DEFAULT_BASE_URL,
);
const outputDir = process.env.CACHE_AUDIT_OUTPUT_DIR || DEFAULT_OUTPUT_DIR;
const includePostChecks = process.env.HEADER_AUDIT_INCLUDE_POST === "1" || isLocalBaseUrl(baseUrl);

const SECURITY_EXPECTATIONS = [
  ["x-content-type-options", ["nosniff"]],
  ["referrer-policy", ["strict-origin-when-cross-origin"]],
  ["x-frame-options", ["DENY"]],
  ["content-security-policy", ["default-src 'self'", "frame-ancestors 'none'"]],
];

const COMMON_HEADER_EXPECTATIONS = {
  mustNotHave: ["x-powered-by"],
};

const publicDataCache = ["public", "max-age=3600", "s-maxage=86400", "stale-while-revalidate=604800"];
const marketCache = ["public", "max-age=60", "s-maxage=300", "must-revalidate"];
const noStore = ["no-store"];
const noCache = ["no-cache", "max-age=0", "must-revalidate"];
const noIndex = ["noindex", "nofollow"];

const audits = [
  {
    name: "App shell",
    path: "/",
    status: 200,
    expect: {
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Long-lived generated data",
    path: "/static-data.json",
    status: 200,
    expect: {
      cacheControl: publicDataCache,
      headerContains: [["x-robots-tag", noIndex]],
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Large item database",
    path: "/all-items-db.json",
    status: 200,
    expect: {
      cacheControl: publicDataCache,
      headerContains: [["x-robots-tag", noIndex]],
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Pet database",
    path: "/pet-database.json",
    status: 200,
    expect: {
      cacheControl: publicDataCache,
      headerContains: [["x-robots-tag", noIndex]],
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Guild list",
    path: "/guild-list.json",
    status: 200,
    expect: {
      cacheControl: publicDataCache,
      headerContains: [["x-robots-tag", noIndex]],
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Guild detail shard",
    path: "/guild-details/1.json",
    status: 200,
    expect: {
      cacheControl: publicDataCache,
      headerContains: [["x-robots-tag", noIndex]],
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Market data",
    path: "/market-data.json",
    status: 200,
    expect: {
      cacheControl: marketCache,
      headerContains: [["x-robots-tag", noIndex]],
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Scraper status",
    path: "/scraper-status.json",
    status: 200,
    expect: {
      cacheControl: noStore,
      headerContains: [["x-robots-tag", noIndex]],
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Offline cache manifest",
    path: "/offline-cache-manifest.json",
    status: 200,
    expect: {
      cacheControl: noCache,
      headerContains: [["x-robots-tag", noIndex]],
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Service worker",
    path: "/sw.js",
    status: 200,
    expect: {
      cacheControl: noCache,
      headerContains: [["x-robots-tag", noIndex]],
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Web app manifest",
    path: "/manifest.webmanifest",
    status: 200,
    expect: {
      cacheControl: publicDataCache,
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Blocked raw items map",
    path: "/items-map.json",
    status: 404,
    expect: {
      cacheControl: noStore,
      headerContains: [["x-robots-tag", noIndex]],
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Blocked raw guild database",
    path: "/guild-database.json",
    status: 404,
    expect: {
      cacheControl: noStore,
      headerContains: [["x-robots-tag", noIndex]],
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Blocked guild refresh plan",
    path: "/guild-refresh-plan.json",
    status: 404,
    expect: {
      cacheControl: noStore,
      headerContains: [["x-robots-tag", noIndex]],
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Public item detail API",
    path: "/api/items/Rv5g4z1dQnqlLqy32jpG",
    status: 200,
    expect: {
      cacheControl: publicDataCache,
      headerContains: [["x-robots-tag", noIndex]],
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Admin page gate",
    path: "/admin/import-health",
    statusOneOf: [401, 404],
    expect: {
      cacheControl: noStore,
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Admin API gate",
    path: "/api/admin/import-health",
    statusOneOf: [401, 404],
    expect: {
      cacheControl: noStore,
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Invalid profile import status",
    path: "/api/profile-import/status/not-a-job",
    status: 400,
    expect: {
      cacheControl: noStore,
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
];

const postAudits = [
  {
    name: "Profile import start validation",
    path: "/api/profile-import/start",
    method: "POST",
    body: "{}",
    statusOneOf: [400, 413],
    expect: {
      cacheControl: noStore,
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Usage ping no-store",
    path: "/api/usage/ping",
    method: "POST",
    body: "{}",
    statusOneOf: [200, 204, 400, 401, 403, 413, 429],
    expect: {
      cacheControl: noStore,
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Web vitals no-store",
    path: "/api/usage/vitals",
    method: "POST",
    body: "{}",
    statusOneOf: [200, 204, 400, 401, 403, 413, 429],
    expect: {
      cacheControl: noStore,
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
  {
    name: "Error report no-store",
    path: "/api/error/report",
    method: "POST",
    body: "{}",
    statusOneOf: [200, 204, 400, 401, 403, 413, 429],
    expect: {
      cacheControl: noStore,
      security: true,
      ...COMMON_HEADER_EXPECTATIONS,
    },
  },
];

function normalizeBaseUrl(value) {
  const url = new URL(value);
  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function isLocalBaseUrl(value) {
  const hostname = new URL(value).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function urlFor(pathname) {
  return new URL(pathname, `${baseUrl}/`).toString();
}

function lowerHeader(headers, key) {
  return headers.get(key)?.toLowerCase() || "";
}

function hasExpectedStatus(response, audit) {
  if (Array.isArray(audit.statusOneOf)) return audit.statusOneOf.includes(response.status);
  return response.status === audit.status;
}

function expectedStatusText(audit) {
  if (Array.isArray(audit.statusOneOf)) return audit.statusOneOf.join("/");
  return String(audit.status);
}

async function requestAudit(audit) {
  const method = audit.method || "HEAD";
  const init = {
    method,
    redirect: "manual",
    headers: {
      "user-agent": "Zenith-Header-Audit/1.0",
      ...(audit.body ? { "content-type": "application/json" } : {}),
    },
    body: audit.body,
  };
  const response = await fetch(urlFor(audit.path), init);

  if (!audit.method && (response.status === 405 || response.status === 501)) {
    return fetch(urlFor(audit.path), {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "Zenith-Header-Audit/1.0" },
    });
  }

  return response;
}

async function discoverNextStaticAudit() {
  const response = await fetch(urlFor("/"), { headers: { "user-agent": "Zenith-Header-Audit/1.0" } });
  const html = await response.text();
  const match = html.match(/\/_next\/static\/[^"'<>?\s]+\.(?:js|css)/);
  if (!match) return null;

  return {
    name: "Hashed Next static asset",
    path: match[0],
    status: 200,
    expect: {
      cacheControl: ["public", "max-age=31536000", "immutable"],
      ...COMMON_HEADER_EXPECTATIONS,
    },
  };
}

function evaluate(audit, response) {
  const failures = [];
  const expect = audit.expect || {};

  if (!hasExpectedStatus(response, audit)) {
    failures.push(`status ${response.status} did not match expected ${expectedStatusText(audit)}`);
  }

  if (expect.security) {
    for (const [header, fragments] of SECURITY_EXPECTATIONS) {
      assertHeaderContains(failures, response, header, fragments);
    }
  }

  if (expect.cacheControl) {
    assertHeaderContains(failures, response, "cache-control", expect.cacheControl);
  }

  for (const [header, fragments] of expect.headerContains || []) {
    assertHeaderContains(failures, response, header, fragments);
  }

  for (const header of expect.mustNotHave || []) {
    if (response.headers.has(header)) {
      failures.push(`${header} should not be present`);
    }
  }

  return failures;
}

function assertHeaderContains(failures, response, header, fragments) {
  const value = lowerHeader(response.headers, header);
  if (!value) {
    failures.push(`${header} is missing`);
    return;
  }

  for (const fragment of fragments) {
    if (!value.includes(fragment.toLowerCase())) {
      failures.push(`${header} missing ${fragment}`);
    }
  }
}

function renderHeader(response, header) {
  return response.headers.get(header) || "-";
}

async function main() {
  const allAudits = [...audits];
  const staticAudit = await discoverNextStaticAudit();
  if (staticAudit) allAudits.push(staticAudit);
  if (includePostChecks) allAudits.push(...postAudits);

  console.log(`Cache/header audit: ${baseUrl}`);
  if (!includePostChecks) {
    console.log("Skipping POST route checks for non-local base URL. Set HEADER_AUDIT_INCLUDE_POST=1 to include them.");
  }

  const results = [];
  for (const audit of allAudits) {
    const response = await requestAudit(audit);
    const failures = evaluate(audit, response);
    results.push({ audit, response, failures });
  }

  const width = Math.max(...results.map((result) => result.audit.name.length));
  for (const { audit, response, failures } of results) {
    const marker = failures.length ? "FAIL" : "PASS";
    console.log(
      `${marker} ${audit.name.padEnd(width)} ${String(response.status).padEnd(3)} ${renderHeader(response, "cache-control")}`,
    );
    for (const failure of failures) {
      console.log(`  - ${failure}`);
    }
  }

  const failed = results.filter((result) => result.failures.length > 0);
  await writeSummary(results, failed);

  if (failed.length > 0) {
    throw new Error(`${failed.length} cache/header audit checks failed.`);
  }
}

async function writeSummary(results, failed) {
  await mkdir(outputDir, { recursive: true });
  const summary = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    includePostChecks,
    passed: failed.length === 0,
    totals: {
      checks: results.length,
      failed: failed.length,
    },
    results: results.map(({ audit, response, failures }) => ({
      name: audit.name,
      path: audit.path,
      method: audit.method || "HEAD",
      status: response.status,
      expectedStatus: Array.isArray(audit.statusOneOf) ? audit.statusOneOf : [audit.status],
      passed: failures.length === 0,
      failures,
      headers: {
        "cache-control": response.headers.get("cache-control") || "",
        "content-security-policy": response.headers.get("content-security-policy") || "",
        "referrer-policy": response.headers.get("referrer-policy") || "",
        "x-content-type-options": response.headers.get("x-content-type-options") || "",
        "x-frame-options": response.headers.get("x-frame-options") || "",
        "x-powered-by": response.headers.get("x-powered-by") || "",
        "x-robots-tag": response.headers.get("x-robots-tag") || "",
      },
    })),
  };
  const outputPath = path.join(outputDir, "summary.json");
  await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
