export const ADMIN_USERNAME = "zenith";
export const ADMIN_REALM = "Zenith Import Health";

export function parseBasicAuth(header: string | null): { username: string; password: string } | null {
  if (!header?.startsWith("Basic ")) return null;

  try {
    const decoded = atob(header.slice("Basic ".length).trim());
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

/**
 * Constant-time string comparison via fixed-length SHA-256 digests so
 * secret length cannot be inferred from timing differences.
 */
export async function sameSecret(input: string, expected: string): Promise<boolean> {
  if (!input || !expected) return false;
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const encoder = new TextEncoder();
    const [digestA, digestB] = await Promise.all([
      subtle.digest("SHA-256", encoder.encode(input)),
      subtle.digest("SHA-256", encoder.encode(expected)),
    ]);
    const bufA = new Uint8Array(digestA);
    const bufB = new Uint8Array(digestB);
    let mismatch = bufA.length ^ bufB.length;
    for (let i = 0; i < bufA.length; i += 1) {
      mismatch |= bufA[i] ^ bufB[i];
    }
    return mismatch === 0;
  }

  // Fallback constant-work comparison without early return on length mismatch
  const maxLen = Math.max(input.length, expected.length);
  let mismatch = input.length ^ expected.length;
  for (let i = 0; i < maxLen; i += 1) {
    const a = i < input.length ? input.charCodeAt(i) : 0;
    const b = i < expected.length ? expected.charCodeAt(i) : 0;
    mismatch |= a ^ b;
  }
  return mismatch === 0;
}

export async function verifyAdminBasicAuth(
  authorizationHeader: string | null,
  adminSecret: string,
): Promise<boolean> {
  const expectedSecret = adminSecret.trim();
  if (!expectedSecret) return false;
  const credentials = parseBasicAuth(authorizationHeader);
  if (!credentials) return false;

  const [userOk, passOk] = await Promise.all([
    sameSecret(credentials.username, ADMIN_USERNAME),
    sameSecret(credentials.password, expectedSecret),
  ]);
  return userOk && passOk;
}
