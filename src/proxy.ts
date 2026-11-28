import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_REALM,
  verifyAdminBasicAuth,
} from "@/lib/admin-auth";

const ERROR_PREVIEW_PATH = "/error-preview";
const LOADING_PREVIEW_PATH = "/loading-preview";
const UI_PREVIEW_PATH = "/ui-preview";
const BLOCKED_PUBLIC_DATA_PATHS = new Set([
  "/guild-members.json",
  "/guild-database.json",
  "/guild-details.json",
  "/guild-refresh-plan.json",
  "/items-map.json",
  "/scraper-priority.json",
]);

function applyPrivateSecurityHeaders(headers: Headers) {
  headers.set("cache-control", "no-store");
  headers.set("x-robots-tag", "noindex, nofollow");
  headers.set("referrer-policy", "no-referrer");
  headers.set("x-content-type-options", "nosniff");
}

export async function proxy(request: NextRequest) {
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

  if (request.nextUrl.pathname === UI_PREVIEW_PATH) {
    if (process.env.NODE_ENV !== "production" || process.env.ENABLE_UI_PREVIEW === "1") {
      return NextResponse.next();
    }

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
    const res = new NextResponse("Not found", { status: 404 });
    applyPrivateSecurityHeaders(res.headers);
    return res;
  }

  const authorized = await verifyAdminBasicAuth(
    request.headers.get("authorization"),
    adminSecret,
  );
  if (!authorized) {
    const res = new NextResponse("Authentication required", { status: 401 });
    applyPrivateSecurityHeaders(res.headers);
    res.headers.set("www-authenticate", `Basic realm="${ADMIN_REALM}", charset="UTF-8"`);
    return res;
  }

  const response = NextResponse.next();
  applyPrivateSecurityHeaders(response.headers);
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
    "/ui-preview",
  ],
};
