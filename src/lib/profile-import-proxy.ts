const PROFILE_IMPORT_PROXY_TIMEOUT_MS = 15_000;
const PROFILE_IMPORT_START_BODY_LIMIT = 8 * 1024;
const CHARACTER_HASH_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,64}$/;

export const JOB_ID_PATTERN = /^imp_[A-Za-z0-9_-]{20,80}$/;
export const NO_STORE_HEADERS: Record<string, string> = { "cache-control": "no-store" };

const PROFILE_IMPORT_API_URL = (
  process.env.PROFILE_IMPORT_API_URL
  || process.env.NEXT_PUBLIC_PROFILE_IMPORT_API_URL
  || "https://zenith-profile-import.devmohammed52.workers.dev"
).replace(/\/$/, "");

type JsonRecord = Record<string, unknown>;

export type ProfileImportProxyResult = {
  payload: unknown;
  status: number;
  headers?: Headers;
  requestId?: string;
};

export type ProfileImportBodyResult =
  | { ok: true; body: string; originHeaders: HeadersInit }
  | { ok: false; payload: unknown; status: number };

export type LimitedJsonBodyOptions = {
  maxBytes: number;
  allowArray?: boolean;
  emptyMessage?: string;
  tooLargeCode?: string;
  tooLargeMessage?: string;
  invalidJsonCode?: string;
  invalidJsonMessage?: string;
  invalidTypeCode?: string;
  invalidTypeMessage?: string;
};

export type LimitedJsonBodyResult<T = JsonRecord> =
  | { ok: true; data: T; rawText: string }
  | { ok: false; status: number; payload: unknown };

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function jsonError(code: string, message: string) {
  return { error: { code, message } };
}

export function utf8ByteLength(value: string): number {
  if (typeof Buffer !== "undefined") {
    return Buffer.byteLength(value, "utf8");
  }
  return new TextEncoder().encode(value).length;
}

export function extractForwardedClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")
    || request.headers.get("x-real-ip")
    || request.headers.get("cf-connecting-ip")
    || ""
  );
}

export function extractClientCountry(request: Request): string {
  return (
    request.headers.get("x-vercel-ip-country")
    || request.headers.get("cf-ipcountry")
    || ""
  ).trim();
}

export function getOrCreateRequestId(request?: Request): string {
  const incoming = request?.headers.get("x-request-id")?.trim() || "";
  if (REQUEST_ID_PATTERN.test(incoming)) {
    return incoming;
  }
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isHttpsRequest(request: Request): boolean {
  const forwardedProto = (request.headers.get("x-forwarded-proto") || "").split(",")[0].trim().toLowerCase();
  if (forwardedProto) {
    return forwardedProto === "https";
  }
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function getProxyAuthSecret(): string {
  return (
    process.env.PROFILE_IMPORT_PROXY_SECRET
    || process.env.USAGE_PING_SECRET
    || ""
  ).trim();
}

export function buildProxyForwardHeaders(
  request: Request,
  options: {
    authSecret?: string;
    contentType?: string;
    includeCountry?: boolean;
    includeUserAgent?: boolean;
    requestId?: string;
    extraHeaders?: Record<string, string>;
  } = {},
): Record<string, string> {
  const origin = request.headers.get("origin");
  const clientIp = extractForwardedClientIp(request);
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const userAgent = options.includeUserAgent === false ? null : request.headers.get("user-agent");
  const country = options.includeCountry === false ? "" : extractClientCountry(request);
  const authSecret = options.authSecret?.trim() || "";

  return {
    ...(options.contentType ? { "content-type": options.contentType } : {}),
    ...(origin ? { origin } : {}),
    ...(clientIp ? { "x-forwarded-for": clientIp } : {}),
    ...(cfConnectingIp ? { "cf-connecting-ip": cfConnectingIp } : {}),
    ...(userAgent ? { "user-agent": userAgent } : {}),
    ...(country ? { "cf-ipcountry": country } : {}),
    ...(authSecret ? { authorization: `Bearer ${authSecret}` } : {}),
    ...(options.requestId ? { "x-request-id": options.requestId } : {}),
    ...options.extraHeaders,
  };
}

export function forwardedOriginHeaders(request: Request): HeadersInit {
  return buildProxyForwardHeaders(request, {
    authSecret: getProxyAuthSecret(),
  });
}

export async function readLimitedJsonBody<T = JsonRecord>(
  request: Request,
  options: LimitedJsonBodyOptions,
): Promise<LimitedJsonBodyResult<T>> {
  const {
    maxBytes,
    allowArray = false,
    emptyMessage = "Request body cannot be empty.",
    tooLargeCode = "request_too_large",
    tooLargeMessage = "Request payload is too large.",
    invalidJsonCode = "invalid_json",
    invalidJsonMessage = "Request body must be valid JSON.",
    invalidTypeCode = "invalid_request",
    invalidTypeMessage = "Request payload has an unsupported shape.",
  } = options;

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      return { ok: false, status: 413, payload: jsonError(tooLargeCode, tooLargeMessage) };
    }
  }

  let rawText = "";
  try {
    rawText = await request.text();
  } catch {
    return { ok: false, status: 400, payload: jsonError(invalidTypeCode, "Request body could not be read.") };
  }

  if (!rawText) {
    return { ok: false, status: 400, payload: jsonError(invalidTypeCode, emptyMessage) };
  }

  if (utf8ByteLength(rawText) > maxBytes) {
    return { ok: false, status: 413, payload: jsonError(tooLargeCode, tooLargeMessage) };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, status: 400, payload: jsonError(invalidJsonCode, invalidJsonMessage) };
  }

  const validShape = allowArray
    ? (isRecord(parsed) || Array.isArray(parsed))
    : isRecord(parsed);

  if (!validShape) {
    return { ok: false, status: 400, payload: jsonError(invalidTypeCode, invalidTypeMessage) };
  }

  return { ok: true, data: parsed as T, rawText };
}

export async function readProfileImportStartBody(request: Request): Promise<ProfileImportBodyResult> {
  const parsed = await readLimitedJsonBody(request, {
    maxBytes: PROFILE_IMPORT_START_BODY_LIMIT,
    tooLargeMessage: "Profile import request is too large.",
    emptyMessage: "Profile import request must be valid JSON.",
    invalidJsonMessage: "Profile import request must be valid JSON.",
    invalidTypeMessage: "Profile import request must be an object.",
  });

  if (!parsed.ok) {
    return { ok: false, status: parsed.status, payload: parsed.payload };
  }

  const payload = parsed.data;
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
    forceRefresh: payload.forceRefresh === true,
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

function toPlainHeaders(headers?: HeadersInit): Record<string, string> {
  const plain: Record<string, string> = {};
  if (!headers) return plain;
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      plain[key] = value;
    });
    return plain;
  }
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      plain[key] = value;
    }
    return plain;
  }
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") {
      plain[key] = value;
    }
  }
  return plain;
}

export async function fetchProfileImportJson(
  path: string,
  init: RequestInit,
  unreadableMessage: string,
): Promise<ProfileImportProxyResult> {
  const { cache = "no-store", headers, ...restInit } = init;
  const plainHeaders = toPlainHeaders(headers);
  const existingRequestIdKey = Object.keys(plainHeaders).find((k) => k.toLowerCase() === "x-request-id");
  const requestId = (existingRequestIdKey ? plainHeaders[existingRequestIdKey] : "") || getOrCreateRequestId();
  if (!existingRequestIdKey) {
    plainHeaders["x-request-id"] = requestId;
  }

  try {
    const response = await fetch(`${PROFILE_IMPORT_API_URL}${path}`, {
      cache,
      ...restInit,
      headers: plainHeaders,
      signal: AbortSignal.timeout(PROFILE_IMPORT_PROXY_TIMEOUT_MS),
    });
    const payload = await response.json().catch(() => (
      jsonError("bad_gateway", unreadableMessage)
    ));

    return { payload, status: response.status, headers: response.headers, requestId };
  } catch (error) {
    const isTimeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      status: isTimeout ? 504 : 502,
      payload: jsonError(
        isTimeout ? "gateway_timeout" : "bad_gateway",
        isTimeout
          ? "Upstream service timed out. Try again shortly."
          : "Profile import service is temporarily unavailable. Try again later.",
      ),
      requestId,
    };
  }
}

const ADMIN_JOB_ID_PATTERN = /^imp_[A-Za-z0-9_-]{3,80}$/;
const ADMIN_SOURCE_PATTERN = /^[A-Za-z0-9:_-]{2,80}$/;
const ADMIN_SCOPE_PATTERN = /^[A-Za-z0-9_-]{2,32}$/;
const ADMIN_FINGERPRINT_PATTERN = /^[A-Za-z0-9:_-]{1,128}$/;

export type AdminActionPayload =
  | { action: "process_queue" }
  | { action: "clear_coordinator"; source?: string }
  | { action: "cancel_job"; jobId: string }
  | { action: "clear_cooldown"; scope: string; keyFingerprint: string };

export type AdminActionValidationResult =
  | { ok: true; payload: AdminActionPayload }
  | { ok: false; status: number; payload: unknown };

export function parseAdminActionPayload(input: unknown): AdminActionValidationResult {
  if (!isRecord(input)) {
    return {
      ok: false,
      status: 400,
      payload: jsonError("invalid_request", "Admin action payload must be an object."),
    };
  }

  const action = typeof input.action === "string" ? input.action.trim() : "";

  if (action === "process_queue") {
    return { ok: true, payload: { action: "process_queue" } };
  }

  if (action === "clear_coordinator") {
    if (input.source === undefined || input.source === null || input.source === "") {
      return { ok: true, payload: { action: "clear_coordinator" } };
    }
    const source = typeof input.source === "string" ? input.source.trim() : "";
    if (!ADMIN_SOURCE_PATTERN.test(source)) {
      return {
        ok: false,
        status: 400,
        payload: jsonError("invalid_source", "Coordinator source identifier is invalid."),
      };
    }
    return { ok: true, payload: { action: "clear_coordinator", source } };
  }

  if (action === "cancel_job") {
    const jobId = typeof input.jobId === "string" ? input.jobId.trim() : "";
    if (!ADMIN_JOB_ID_PATTERN.test(jobId)) {
      return {
        ok: false,
        status: 400,
        payload: jsonError("invalid_job_id", "Job ID must be a valid import job identifier."),
      };
    }
    return { ok: true, payload: { action: "cancel_job", jobId } };
  }

  if (action === "clear_cooldown") {
    const scope = typeof input.scope === "string" ? input.scope.trim() : "";
    const keyFingerprint = typeof input.keyFingerprint === "string" ? input.keyFingerprint.trim() : "";
    if (!ADMIN_SCOPE_PATTERN.test(scope) || !ADMIN_FINGERPRINT_PATTERN.test(keyFingerprint)) {
      return {
        ok: false,
        status: 400,
        payload: jsonError("invalid_cooldown", "Cooldown scope and keyFingerprint are required."),
      };
    }
    return { ok: true, payload: { action: "clear_cooldown", scope, keyFingerprint } };
  }

  return {
    ok: false,
    status: 400,
    payload: jsonError("invalid_action", `Unsupported admin action "${action || "empty"}".`),
  };
}

export async function executeProfileImportAdminAction(
  actionPayload: AdminActionPayload | unknown,
  adminSecret: string,
): Promise<ProfileImportProxyResult> {
  const validated = parseAdminActionPayload(actionPayload);
  if (!validated.ok) {
    return { status: validated.status, payload: validated.payload };
  }

  return fetchProfileImportJson(
    "/admin/actions",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${adminSecret}`,
      },
      body: JSON.stringify(validated.payload),
      cache: "no-store",
    },
    "Cloudflare returned an unreadable response.",
  );
}
