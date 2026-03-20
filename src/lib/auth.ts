const COOKIE_NAME = 'ol_collab_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function validatePassword(input: string, expected: string): boolean {
  // Constant-time comparison to prevent timing attacks
  if (input.length !== expected.length) return false;
  let result = 0;
  for (let i = 0; i < input.length; i++) {
    result |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return result === 0;
}

export async function createSessionCookie(password: string): Promise<string> { // allow-secret
  const expiry = Date.now() + SESSION_DURATION_MS;
  const payload = `${expiry}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const sigHex = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${COOKIE_NAME}=${payload}.${sigHex}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION_MS / 1000}`;
}

export async function checkSession( // allow-secret
  cookieHeader: string | null,
  password: string // allow-secret
): Promise<boolean> {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;
  const dotIdx = match[1].indexOf('.');
  if (dotIdx === -1) return false;
  const payload = match[1].slice(0, dotIdx);
  const sigHex = match[1].slice(dotIdx + 1);
  if (!payload || !sigHex) return false;
  const expiry = parseInt(payload, 10);
  if (Date.now() > expiry) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const sigBytes = new Uint8Array(sigHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload));
}
