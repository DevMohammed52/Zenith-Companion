import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { error, info, component } = await req.json();
    const logPath = path.join(process.cwd(), 'zenith-debug.log');
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${component}] ERROR: ${error}\nINFO: ${JSON.stringify(info)}\n-----------------------------------\n`;
    
    fs.appendFileSync(logPath, logEntry);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
