export const ADMIN_USERNAME = "zenith";
export const ADMIN_REALM = "Zenith Import Health";

export function parseBasicAuth(header: string | null): { username: string; password: string } | null {
  if (!header?.startsWith("Basic ")) return null;

  try {
    const decoded = atob(header.slice("Basic ".length));
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

export function sameSecret(input: string, expected: string): boolean {
  if (input.length !== expected.length) return false;

  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= input.charCodeAt(index) ^ expected.charCodeAt(index);
  }

  return mismatch === 0;
}

export function verifyAdminBasicAuth(authorizationHeader: string | null, adminSecret: string): boolean {
  const credentials = parseBasicAuth(authorizationHeader);
  if (!credentials) return false;
  return credentials.username === ADMIN_USERNAME && sameSecret(credentials.password, adminSecret);
}
