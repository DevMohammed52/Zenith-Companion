import { NextResponse } from "next/server";
import { fetchProfileImportJson, readProfileImportStartBody } from "@/lib/profile-import-proxy";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = await readProfileImportStartBody(request);
  if (!parsed.ok) {
    return NextResponse.json(parsed.payload, {
      status: parsed.status,
      headers: { "cache-control": "no-store" },
    });
  }

  const result = await fetchProfileImportJson("/profile-import/start", {
    method: "POST",
    headers: { "content-type": "application/json", ...parsed.originHeaders },
    body: parsed.body,
  }, "Profile import service returned an unreadable response.");

  return NextResponse.json(result.payload, {
    status: result.status,
    headers: { "cache-control": "no-store" },
  });
}
