const COOKIE_NAME = "af_session";

interface TokenPayload {
  sub: string;
  exp: number;
}

function base64UrlEncode(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlEncodeBytes(bytes: ArrayBuffer): string {
  let binary = "";
  const arr = new Uint8Array(bytes);
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(padded);
}

async function signHmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64UrlEncodeBytes(signature);
}

export async function generateToken(username: string, secret: string, ttlSeconds = 60 * 60 * 8): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify({ sub: username, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  const signature = await signHmac(`${header}.${payload}`, secret);
  return `${header}.${payload}.${signature}`;
}

export async function verifyToken(token: string, secret: string): Promise<TokenPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expected = await signHmac(`${header}.${payload}`, secret);
  if (expected !== signature) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as TokenPayload;
    if (!parsed.sub || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readSessionToken(request: Request): string | null {
  const raw = request.headers.get("Cookie");
  if (!raw) return null;
  const cookie = raw.split(";").map((chunk) => chunk.trim()).find((chunk) => chunk.startsWith(`${COOKIE_NAME}=`));
  return cookie ? cookie.slice(COOKIE_NAME.length + 1) : null;
}

export function buildSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function isSha256Hex(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

export async function authenticateUser(
  db: D1Database,
  username: string,
  password: string
): Promise<{ username: string; nomeCompleto: string } | null> {
  const row = await db
    .prepare("SELECT username, nome_completo, password_hash FROM usuarios WHERE username = ? LIMIT 1")
    .bind(username)
    .first<{ username: string; nome_completo: string; password_hash: string }>();

  const passwordHash = await sha256Hex(password);

  if (row) {
    if (isSha256Hex(row.password_hash)) {
      if (timingSafeEqual(row.password_hash, passwordHash)) {
        return { username: row.username, nomeCompleto: row.nome_completo };
      }
    } else if (timingSafeEqual(row.password_hash, password)) {
      await db
        .prepare("UPDATE usuarios SET password_hash = ? WHERE username = ? AND password_hash = ?")
        .bind(passwordHash, row.username, row.password_hash)
        .run();
      return { username: row.username, nomeCompleto: row.nome_completo };
    }
  }

  return null;
}
