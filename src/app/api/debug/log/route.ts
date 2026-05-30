import { NextResponse } from 'next/server';
import { appendFile } from 'fs/promises';
import path from 'path';

const MAX_FIELD_LENGTH = 2000;
const NO_STORE_HEADERS = { "cache-control": "no-store" };

function cleanLogField(value: unknown) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .slice(0, MAX_FIELD_LENGTH);
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ success: false }, { status: 404, headers: NO_STORE_HEADERS });
  }

  try {
    const { error, info, component } = await req.json();
    const logPath = path.join(process.cwd(), 'zenith-debug.log');
    const timestamp = new Date().toISOString();
    const cleanComponent = cleanLogField(component || "unknown");
    const cleanError = cleanLogField(error);
    const cleanInfo = cleanLogField(JSON.stringify(info ?? null));
    const logEntry = `[${timestamp}] [${cleanComponent}] ERROR: ${cleanError}\nINFO: ${cleanInfo}\n-----------------------------------\n`;
    
    await appendFile(logPath, logEntry);
    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch {
    return NextResponse.json({ success: false }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
