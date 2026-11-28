import { NextResponse, type NextRequest } from "next/server";
import {
  buildProxyForwardHeaders,
  fetchProfileImportJson,
  getOrCreateRequestId,
  getProxyAuthSecret,
  JOB_ID_PATTERN,
  NO_STORE_HEADERS,
} from "@/lib/profile-import-proxy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  if (!JOB_ID_PATTERN.test(jobId)) {
    return NextResponse.json(
      { error: { code: "invalid_job", message: "Invalid import job reference." } },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const requestId = getOrCreateRequestId(request);
  const result = await fetchProfileImportJson(
    `/profile-import/status/${encodeURIComponent(jobId)}`,
    {
      method: "GET",
      headers: buildProxyForwardHeaders(request, {
        authSecret: getProxyAuthSecret(),
        requestId,
      }),
    },
    "Profile import service returned an unreadable response.",
  );

  const responseHeaders: Record<string, string> = {
    "cache-control": result.headers?.get("cache-control") || "no-store",
    "x-request-id": requestId,
  };
  const retryAfter = result.headers?.get("retry-after");
  if (retryAfter) {
    responseHeaders["retry-after"] = retryAfter;
  }

  return NextResponse.json(result.payload, {
    status: result.status,
    headers: responseHeaders,
  });
}
