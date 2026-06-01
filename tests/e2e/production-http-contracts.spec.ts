import { expect, type APIRequestContext, type APIResponse, test } from "@playwright/test";

type HeaderExpectation = {
  contains?: Record<string, string[]>;
  missing?: string[];
  security?: boolean;
};

type HttpContract = {
  body?: unknown;
  expect: HeaderExpectation;
  method?: "GET" | "HEAD" | "POST";
  name: string;
  path: string;
  status?: number;
  statusOneOf?: number[];
};

const securityHeaderFragments: Record<string, string[]> = {
  "content-security-policy": ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'"],
  "referrer-policy": ["strict-origin-when-cross-origin"],
  "x-content-type-options": ["nosniff"],
  "x-frame-options": ["DENY"],
};

const noPoweredBy = ["x-powered-by"];
const publicDataCache = ["public", "max-age=3600", "s-maxage=86400", "stale-while-revalidate=604800"];
const publicApiBrowserCache = ["public", "max-age=3600"];
const publicApiCdnCache = ["public", "max-age=86400", "stale-while-revalidate=604800"];
const marketCache = ["public", "max-age=60", "s-maxage=300", "must-revalidate"];
const noStore = ["no-store"];
const noCache = ["no-cache", "max-age=0", "must-revalidate"];
const noIndex = ["noindex", "nofollow"];

const commonSecurity: HeaderExpectation = {
  security: true,
  missing: noPoweredBy,
};

const publicJsonSecurity = (cacheControl: string[]): HeaderExpectation => ({
  ...commonSecurity,
  contains: {
    "cache-control": cacheControl,
    "x-robots-tag": noIndex,
  },
});

const contracts: HttpContract[] = [
  {
    name: "app shell sends baseline security headers",
    path: "/",
    status: 200,
    expect: commonSecurity,
  },
  {
    name: "long-lived static data is cached and not indexed",
    path: "/static-data.json",
    status: 200,
    expect: publicJsonSecurity(publicDataCache),
  },
  {
    name: "large item database is cached and not indexed",
    path: "/all-items-db.json",
    status: 200,
    expect: publicJsonSecurity(publicDataCache),
  },
  {
    name: "pet database is cached and not indexed",
    path: "/pet-database.json",
    status: 200,
    expect: publicJsonSecurity(publicDataCache),
  },
  {
    name: "guild list is cached and not indexed",
    path: "/guild-list.json",
    status: 200,
    expect: publicJsonSecurity(publicDataCache),
  },
  {
    name: "guild detail shards are cached and not indexed",
    path: "/guild-details/1.json",
    status: 200,
    expect: publicJsonSecurity(publicDataCache),
  },
  {
    name: "market data has short browser cache",
    path: "/market-data.json",
    status: 200,
    expect: publicJsonSecurity(marketCache),
  },
  {
    name: "scraper status is never cached",
    path: "/scraper-status.json",
    status: 200,
    expect: publicJsonSecurity(noStore),
  },
  {
    name: "offline cache manifest revalidates",
    path: "/offline-cache-manifest.json",
    status: 200,
    expect: publicJsonSecurity(noCache),
  },
  {
    name: "service worker revalidates",
    path: "/sw.js",
    status: 200,
    expect: publicJsonSecurity(noCache),
  },
  {
    name: "web app manifest is cached",
    path: "/manifest.webmanifest",
    status: 200,
    expect: {
      ...commonSecurity,
      contains: {
        "cache-control": publicDataCache,
      },
    },
  },
  {
    name: "raw item map stays blocked",
    path: "/items-map.json",
    status: 404,
    expect: publicJsonSecurity(noStore),
  },
  {
    name: "raw guild database stays blocked",
    path: "/guild-database.json",
    status: 404,
    expect: publicJsonSecurity(noStore),
  },
  {
    name: "guild refresh plan stays blocked",
    path: "/guild-refresh-plan.json",
    status: 404,
    expect: publicJsonSecurity(noStore),
  },
  {
    name: "public item detail API is cached with CDN policy",
    path: "/api/items/Rv5g4z1dQnqlLqy32jpG",
    status: 200,
    expect: {
      ...commonSecurity,
      contains: {
        "cache-control": publicApiBrowserCache,
        "cdn-cache-control": publicApiCdnCache,
        "x-robots-tag": noIndex,
      },
    },
  },
  {
    name: "admin page gate does not expose cacheable content",
    path: "/admin/import-health",
    statusOneOf: [401, 404],
    expect: {
      ...commonSecurity,
      contains: {
        "cache-control": noStore,
      },
    },
  },
  {
    name: "admin API gate does not expose cacheable content",
    path: "/api/admin/import-health",
    statusOneOf: [401, 404],
    expect: {
      ...commonSecurity,
      contains: {
        "cache-control": noStore,
      },
    },
  },
  {
    name: "invalid profile import status is no-store",
    path: "/api/profile-import/status/not-a-job",
    status: 400,
    expect: {
      ...commonSecurity,
      contains: {
        "cache-control": noStore,
      },
    },
  },
  {
    body: {},
    method: "POST",
    name: "profile import start validation is no-store",
    path: "/api/profile-import/start",
    statusOneOf: [400, 413],
    expect: {
      ...commonSecurity,
      contains: {
        "cache-control": noStore,
      },
    },
  },
  {
    body: {},
    method: "POST",
    name: "usage ping is no-store",
    path: "/api/usage/ping",
    statusOneOf: [200, 204, 400, 401, 403, 413, 429],
    expect: {
      ...commonSecurity,
      contains: {
        "cache-control": noStore,
      },
    },
  },
  {
    body: {},
    method: "POST",
    name: "web vitals is no-store",
    path: "/api/usage/vitals",
    statusOneOf: [200, 204, 400, 401, 403, 413, 429],
    expect: {
      ...commonSecurity,
      contains: {
        "cache-control": noStore,
      },
    },
  },
  {
    body: {},
    method: "POST",
    name: "error reports are no-store",
    path: "/api/error/report",
    statusOneOf: [200, 204, 400, 401, 403, 413, 429],
    expect: {
      ...commonSecurity,
      contains: {
        "cache-control": noStore,
      },
    },
  },
];

async function fetchContract(request: APIRequestContext, contract: HttpContract) {
  const method = contract.method ?? "HEAD";
  const response = await request.fetch(contract.path, {
    data: contract.body,
    failOnStatusCode: false,
    headers: {
      "user-agent": "Zenith-Production-Contract-Test/1.0",
      ...(contract.body ? { "content-type": "application/json" } : {}),
    },
    method,
  });

  if (!contract.method && (response.status() === 405 || response.status() === 501)) {
    return request.get(contract.path, {
      failOnStatusCode: false,
      headers: { "user-agent": "Zenith-Production-Contract-Test/1.0" },
    });
  }

  return response;
}

function lowerHeader(response: APIResponse, header: string) {
  return response.headers()[header.toLowerCase()]?.toLowerCase() ?? "";
}

function expectedStatuses(contract: HttpContract) {
  return contract.statusOneOf ?? (typeof contract.status === "number" ? [contract.status] : []);
}

function expectHeaderContains(response: APIResponse, header: string, fragments: string[], contractName: string) {
  const value = lowerHeader(response, header);
  expect(value, `${contractName}: ${header} should be present`).not.toBe("");

  for (const fragment of fragments) {
    expect(value, `${contractName}: ${header} should include ${fragment}`).toContain(fragment.toLowerCase());
  }
}

function expectHeaders(response: APIResponse, contract: HttpContract) {
  if (contract.expect.security) {
    for (const [header, fragments] of Object.entries(securityHeaderFragments)) {
      expectHeaderContains(response, header, fragments, contract.name);
    }
  }

  for (const [header, fragments] of Object.entries(contract.expect.contains ?? {})) {
    expectHeaderContains(response, header, fragments, contract.name);
  }

  for (const header of contract.expect.missing ?? []) {
    expect(response.headers()[header], `${contract.name}: ${header} should not be exposed`).toBeUndefined();
  }
}

test.describe("production HTTP contracts", () => {
  for (const contract of contracts) {
    test(contract.name, async ({ request }) => {
      const response = await fetchContract(request, contract);

      expect(
        expectedStatuses(contract),
        `${contract.name}: unexpected status ${response.status()} for ${contract.path}`,
      ).toContain(response.status());
      expectHeaders(response, contract);
    });
  }
});
