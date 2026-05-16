import { NextResponse, type NextRequest } from "next/server";

const ADMIN_USERNAME = "zenith";
const ADMIN_REALM = "Zenith Import Health";

export function proxy(request: NextRequest) {
  const adminSecret = process.env.ADMIN_DASHBOARD_SECRET;

  if (!adminSecret) {
    return new NextResponse("Not found", {
      status: 404,
      headers: { "cache-control": "no-store" },
    });
  }

  const credentials = parseBasicAuth(request.headers.get("authorization"));

  if (!credentials || credentials.username !== ADMIN_USERNAME || !sameSecret(credentials.password, adminSecret)) {
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
  matcher: ["/admin/import-health/:path*", "/api/admin/import-health/:path*"],
};

function parseBasicAuth(header: string | null) {
  if (!header?.startsWith("Basic ")) return null;

  try {
    const decoded = atob(header.slice("Basic ".length));
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;

    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

function sameSecret(input: string, expected: string) {
  if (input.length !== expected.length) return false;

  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= input.charCodeAt(index) ^ expected.charCodeAt(index);
  }

  return mismatch === 0;
}
