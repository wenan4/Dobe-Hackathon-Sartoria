const VISITOR_COOKIE_NAME = 'sartoria_vid';
const VISITOR_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 year

const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    return null;
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return bytesToHex(new Uint8Array(sig));
}

export async function verifyHmacHex(
  secret: string,
  message: string,
  expectedHex: string
): Promise<boolean> {
  const sigBytes = hexToBytes(expectedHex);
  if (!sigBytes) return false;
  const key = await importHmacKey(secret);
  return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(message));
}

function parseCookies(headerValue: string | null): Record<string, string> {
  if (!headerValue) return {};
  const map: Record<string, string> = {};
  for (const part of headerValue.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) map[key] = val;
  }
  return map;
}

export interface ResolvedVisitorIdentity {
  /** Internal canonical visitor ID (HMAC-hashed before storage/logging). */
  visitorKey: string;
  /** Short non-reversible tag safe for structured logs. */
  visitorTag: string;
  /** HMAC-SHA256 hash of client IP (anti-cookie-clearing dimension; raw IP is never stored). */
  ipHash: string | null;
  /** Set-Cookie header value when a new or refreshed signed cookie should be sent. */
  setCookieHeader: string | null;
}

export async function resolveVisitorIdentity(
  request: Request,
  signingSecret: string
): Promise<ResolvedVisitorIdentity> {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const rawToken = cookies[VISITOR_COOKIE_NAME];

  let verifiedVisitorId: string | null = null;
  if (rawToken) {
    const parts = rawToken.split('.');
    if (parts.length === 2 && /^[a-f0-9-]{16,64}$/i.test(parts[0])) {
      const ok = await verifyHmacHex(signingSecret, `vid:${parts[0]}`, parts[1]);
      if (ok) {
        verifiedVisitorId = parts[0];
      }
    }
  }

  let setCookieHeader: string | null = null;
  if (!verifiedVisitorId) {
    verifiedVisitorId = crypto.randomUUID();
    const sig = await hmacHex(signingSecret, `vid:${verifiedVisitorId}`);
    const isHttps = new URL(request.url).protocol === 'https:';
    const secureFlag = isHttps ? '; Secure' : '';
    setCookieHeader = `${VISITOR_COOKIE_NAME}=${verifiedVisitorId}.${sig}; Path=/; Max-Age=${VISITOR_COOKIE_MAX_AGE_SEC}; HttpOnly; SameSite=Lax${secureFlag}`;
  }

  const visitorKey = await hmacHex(signingSecret, `vkey:${verifiedVisitorId}`);
  const visitorTag = `v_${visitorKey.slice(0, 12)}`;

  const rawIp =
    request.headers.get('CF-Connecting-IP')?.trim() ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    null;

  const ipHash = rawIp ? await hmacHex(signingSecret, `ip:${rawIp}`) : null;

  return {
    visitorKey,
    visitorTag,
    ipHash,
    setCookieHeader,
  };
}
