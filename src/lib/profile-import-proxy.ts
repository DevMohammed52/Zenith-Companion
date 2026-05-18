const PROFILE_IMPORT_PROXY_TIMEOUT_MS = 15_000;
const PROFILE_IMPORT_START_BODY_LIMIT = 8 * 1024;
const CHARACTER_HASH_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;

const PROFILE_IMPORT_API_URL = (
  process.env.PROFILE_IMPORT_API_URL
  || process.env.NEXT_PUBLIC_PROFILE_IMPORT_API_URL
  || "https://zenith-profile-import.devmohammed52.workers.dev"
).replace(/\/$/, "");

type JsonRecord = Record<string, unknown>;

export type ProfileImportProxyResult = {
  payload: unknown;
  status: number;
};

export type ProfileImportBodyResult =
  | { ok: true; body: string; originHeaders: HeadersInit }
  | { ok: false; payload: unknown; status: number };

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function jsonError(code: string, message: string) {
  return { error: { code, message } };
}

function forwardedOriginHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  return origin ? { origin } : {};
}

export async function readProfileImportStartBody(request: Request): Promise<ProfileImportBodyResult> {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > PROFILE_IMPORT_START_BODY_LIMIT) {
    return {
      ok: false,
      status: 413,
      payload: jsonError("request_too_large", "Profile import request is too large."),
    };
  }

  let text = "";
  try {
    text = await request.text();
  } catch {
    return {
      ok: false,
      status: 400,
      payload: jsonError("invalid_request", "Profile import request could not be read."),
    };
  }

  if (text.length > PROFILE_IMPORT_START_BODY_LIMIT) {
    return {
      ok: false,
      status: 413,
      payload: jsonError("request_too_large", "Profile import request is too large."),
    };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return {
      ok: false,
      status: 400,
      payload: jsonError("invalid_json", "Profile import request must be valid JSON."),
    };
  }

  if (!isRecord(payload)) {
    return {
      ok: false,
      status: 400,
      payload: jsonError("invalid_request", "Profile import request must be an object."),
    };
  }

  const characterHash = typeof payload.characterHash === "string" ? payload.characterHash.trim() : "";
  if (!CHARACTER_HASH_PATTERN.test(characterHash)) {
    return {
      ok: false,
      status: 400,
      payload: jsonError("invalid_hash", "Paste only the character hashed ID."),
    };
  }

  const body: JsonRecord = {
    characterHash,
    includeVisibleAlts: payload.includeVisibleAlts !== false,
    includeMuseum: payload.includeMuseum !== false,
  };
  if (typeof payload.turnstileToken === "string" && payload.turnstileToken.length <= 4096) {
    body.turnstileToken = payload.turnstileToken;
  }

  return {
    ok: true,
    body: JSON.stringify(body),
    originHeaders: forwardedOriginHeaders(request),
  };
}

export async function fetchProfileImportJson(
  path: string,
  init: RequestInit,
  unreadableMessage: string,
): Promise<ProfileImportProxyResult> {
  try {
    const response = await fetch(`${PROFILE_IMPORT_API_URL}${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(PROFILE_IMPORT_PROXY_TIMEOUT_MS),
    });
    const payload = await response.json().catch(() => (
      jsonError("bad_gateway", unreadableMessage)
    ));

    return { payload, status: response.status };
  } catch {
    return {
      status: 502,
      payload: jsonError("bad_gateway", "Profile import service is temporarily unavailable. Try again later."),
    };
  }
}
