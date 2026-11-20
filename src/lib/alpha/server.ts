import { alphaEnv, PLATFORMS, type AlphaDatabase, type Platform } from "./env";

export const noStore = { "Cache-Control": "no-store" };

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: noStore });
}

export function isPlatform(value: unknown): value is Platform {
  return value === "android" || value === "windows";
}

export function normaliseEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function clientIp(request: Request) {
  return request.headers.get("CF-Connecting-IP") ?? undefined;
}

/* ---------- Slots ---------- */

export async function slotSummary(db: AlphaDatabase, cap: number) {
  const row = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM alpha_claims WHERE revoked_at IS NULL) AS active,
         (SELECT COUNT(*) FROM alpha_codes c WHERE NOT EXISTS (SELECT 1 FROM alpha_claims a WHERE a.code = c.code)) AS unusedCodes`,
    )
    .first<{ active: number; unusedCodes: number }>();
  const active = row?.active ?? 0;
  const unusedCodes = row?.unusedCodes ?? 0;
  // The slots on offer are limited by the cap and by how many codes the game list still has.
  const total = Math.min(cap, active + unusedCodes);
  const remaining = Math.max(0, total - active);
  return { total, claimed: active, remaining, unusedCodes };
}

/* ---------- Turnstile ---------- */

export async function verifyTurnstile(token: unknown, request: Request) {
  const { env } = alphaEnv();
  if (!env.TURNSTILE_SECRET_KEY) throw new Error("TURNSTILE_SECRET_KEY is not set");
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET_KEY);
  form.append("response", token);
  const ip = clientIp(request);
  if (ip) form.append("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    if (!res.ok) return false;
    const outcome = (await res.json()) as { success?: boolean };
    return outcome.success === true;
  } catch (error) {
    console.error("turnstile verification failed", error);
    return false;
  }
}

/* ---------- Email ---------- */

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export async function sendCodeEmail(claim: { name: string; email: string; platform: Platform; code: string }) {
  const { env, siteUrl } = alphaEnv();
  if (!env.RESEND_API_KEY) return { ok: false as const, error: "RESEND_API_KEY is not set" };
  const downloadUrl = `${siteUrl}/projects/genesis-roulette/download`;
  const platform = PLATFORMS[claim.platform];
  const name = escapeHtml(claim.name);
  const code = escapeHtml(claim.code);
  const text = [
    `Hello ${claim.name},`,
    "",
    "Thank you for joining the Genesis Roulette closed alpha.",
    "",
    `Your redeem code: ${claim.code}`,
    `Platform: ${platform.label}`,
    "",
    `1. Open ${downloadUrl}`,
    "2. Enter this email address and your redeem code to get your download link.",
    "3. Install the game and type the same redeem code when the game asks for it.",
    "",
    "The download link expires after a few hours. You can come back to the page for a new one at any time.",
    "Please keep the build and your code to yourself. Each code belongs to one tester.",
    "",
    "KenyalangKu",
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1b2226;line-height:1.55">
<p>Hello ${name},</p>
<p>Thank you for joining the <strong>Genesis Roulette closed alpha</strong>.</p>
<p style="margin:24px 0;padding:18px;border:1px solid #eaa124;border-radius:10px;text-align:center">
<span style="display:block;font-size:12px;letter-spacing:.14em;color:#6b5a32">YOUR REDEEM CODE</span>
<strong style="display:block;font-size:24px;letter-spacing:.08em;margin-top:6px">${code}</strong>
<span style="display:block;font-size:13px;margin-top:6px">${escapeHtml(platform.label)}</span></p>
<ol><li>Open the <a href="${downloadUrl}">Genesis Roulette download page</a>.</li>
<li>Enter this email address and your redeem code to get your download link.</li>
<li>Install the game and type the same redeem code when the game asks for it.</li></ol>
<p>The download link expires after a few hours. You can come back to the page for a new one at any time.</p>
<p>Please keep the build and your code to yourself. Each code belongs to one tester.</p>
<p>KenyalangKu</p></div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.ALPHA_EMAIL_FROM ?? "KenyalangKu <admin@kenyalangku.my>",
        to: [claim.email],
        subject: "Your Genesis Roulette closed alpha code",
        text,
        html,
      }),
    });
    if (!res.ok) return { ok: false as const, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: String(error).slice(0, 200) };
  }
}

export async function recordEmail(db: AlphaDatabase, id: number, result: { ok: boolean; error?: string }) {
  await db
    .prepare(
      result.ok
        ? "UPDATE alpha_claims SET email_sent_at = datetime('now'), email_error = NULL WHERE id = ?1"
        : "UPDATE alpha_claims SET email_error = ?2 WHERE id = ?1",
    )
    .bind(...(result.ok ? [id] : [id, result.error ?? "unknown error"]))
    .run();
}

/* ---------- Signed download tokens ---------- */

const encoder = new TextEncoder();
const b64url = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function signingKey() {
  const { env } = alphaEnv();
  if (!env.ALPHA_SIGNING_SECRET || env.ALPHA_SIGNING_SECRET.length < 32) {
    throw new Error("ALPHA_SIGNING_SECRET must be set (at least 32 characters)");
  }
  return crypto.subtle.importKey("raw", encoder.encode(env.ALPHA_SIGNING_SECRET), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function createDownloadToken(claimId: number, platform: Platform, expiresAt: number) {
  const payload = `${claimId}.${platform}.${expiresAt}`;
  const sig = await crypto.subtle.sign("HMAC", await signingKey(), encoder.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

export async function readDownloadToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [id, platform, exp, sig] = parts;
  if (!/^\d+$/.test(id) || !isPlatform(platform) || !/^\d+$/.test(exp)) return null;
  let sigBytes: Uint8Array;
  try {
    sigBytes = fromB64url(sig);
  } catch {
    return null;
  }
  const valid = await crypto.subtle.verify("HMAC", await signingKey(), sigBytes as BufferSource, encoder.encode(`${id}.${platform}.${exp}`));
  if (!valid) return null;
  return { claimId: Number(id), platform, expiresAt: Number(exp) };
}

/* ---------- Comparisons and admin auth ---------- */

async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

/** Compares two strings without leaking where they differ. */
export async function safeEqual(a: string, b: string) {
  const [x, y] = await Promise.all([digest(a), digest(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function isAdmin(request: Request) {
  const { env } = alphaEnv();
  const expected = env.ALPHA_ADMIN_TOKEN;
  if (!expected || expected.length < 16) return false;
  const header = request.headers.get("Authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  return safeEqual(header.slice(7), expected);
}
