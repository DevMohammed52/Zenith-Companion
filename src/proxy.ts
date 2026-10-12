import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_REALM,
  verifyAdminBasicAuth,
} from "@/lib/admin-auth";
const ERROR_PREVIEW_PATH = "/error-preview";
const LOADING_PREVIEW_PATH = "/loading-preview";
const BLOCKED_PUBLIC_DATA_PATHS = new Set([
  "/guild-members.json",
  "/guild-database.json",
  "/guild-details.json",
  "/guild-refresh-plan.json",
  "/items-map.json",
  "/scraper-priority.json",
]);

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === ERROR_PREVIEW_PATH) {
    if (process.env.ENABLE_ERROR_PREVIEW === "1") return NextResponse.next();

    return new NextResponse("Not found", {
      status: 404,
      headers: {
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  }

  if (request.nextUrl.pathname === LOADING_PREVIEW_PATH) {
    if (process.env.ENABLE_LOADING_PREVIEW === "1") return NextResponse.next();

    return new NextResponse("Not found", {
      status: 404,
      headers: {
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  }

  if (BLOCKED_PUBLIC_DATA_PATHS.has(request.nextUrl.pathname)) {
    return new NextResponse("Not found", {
      status: 404,
      headers: {
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  }

  const adminSecret = process.env.ADMIN_DASHBOARD_SECRET?.trim();

  if (!adminSecret) {
    return new NextResponse("Not found", {
      status: 404,
      headers: { "cache-control": "no-store" },
    });
  }

  if (!verifyAdminBasicAuth(request.headers.get("authorization"), adminSecret)) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "cache-control": "no-store",
        "www-authenticate": `Basic realm="${ADMIN_REALM}", charset="UTF-8"`,
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("cache-control", "no-store");
  return response;
}

export const config = {
  matcher: [
    "/admin/import-health/:path*",
    "/api/admin/import-health/:path*",
    "/guild-members.json",
    "/guild-database.json",
    "/guild-details.json",
    "/guild-refresh-plan.json",
    "/items-map.json",
    "/scraper-priority.json",
    "/error-preview",
    "/loading-preview",
  ],
};
