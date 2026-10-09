import { NextResponse, type NextRequest } from "next/server";
import { fetchProfileImportJson } from "@/lib/profile-import-proxy";

const JOB_ID_PATTERN = /^imp_[A-Za-z0-9_-]{20,80}$/;

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  if (!JOB_ID_PATTERN.test(jobId)) {
    return NextResponse.json(
      { error: { code: "invalid_job", message: "Invalid import job reference." } },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  const forwardHeaders: Record<string, string> = {};
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    forwardHeaders["cf-connecting-ip"] = cfConnectingIp;
  }
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    forwardHeaders["x-forwarded-for"] = xForwardedFor;
  }
  const origin = request.headers.get("origin");
  if (origin) {
    forwardHeaders["origin"] = origin;
  }

  const result = await fetchProfileImportJson(
    `/profile-import/status/${encodeURIComponent(jobId)}`,
    {
      method: "GET",
      headers: forwardHeaders,
    },
    "Profile import service returned an unreadable response.",
  );

  const responseHeaders: Record<string, string> = {
    "cache-control": result.headers?.get("cache-control") || "no-store",
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
