import { NextResponse, type NextRequest } from "next/server";
import { fetchProfileImportJson } from "@/lib/profile-import-proxy";

const JOB_ID_PATTERN = /^imp_[A-Za-z0-9_-]{20,80}$/;

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  if (!JOB_ID_PATTERN.test(jobId)) {
    return NextResponse.json(
      { error: { code: "invalid_job", message: "Invalid import job reference." } },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  const result = await fetchProfileImportJson(
    `/profile-import/status/${encodeURIComponent(jobId)}`,
    { method: "GET" },
    "Profile import service returned an unreadable response.",
  );

  return NextResponse.json(result.payload, {
    status: result.status,
    headers: { "cache-control": "no-store" },
  });
}
