import { NextResponse, type NextRequest } from "next/server";

const PROFILE_IMPORT_API_URL = (process.env.PROFILE_IMPORT_API_URL || process.env.NEXT_PUBLIC_PROFILE_IMPORT_API_URL || "https://zenith-profile-import.devmohammed52.workers.dev").replace(/\/$/, "");
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

  const response = await fetch(`${PROFILE_IMPORT_API_URL}/profile-import/status/${encodeURIComponent(jobId)}`, {
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({
    error: { code: "bad_gateway", message: "Profile import service returned an unreadable response." },
  }));

  return NextResponse.json(payload, {
    status: response.status,
    headers: { "cache-control": "no-store" },
  });
}
