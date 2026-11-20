import { alphaEnv, PLATFORMS } from "@/src/lib/alpha/env";
import { createDownloadToken, json, normaliseEmail, safeEqual } from "@/src/lib/alpha/server";

type Row = { id: number; platform: "android" | "windows"; code: string; revoked_at: string | null; failed_redeems: number };
const MAX_FAILED = 10;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Please enter your email and redeem code." }, 400);
  }
  const email = normaliseEmail(body.email);
  const code = String(body.code ?? "").trim();
  const wrong = json({ error: "That email and redeem code do not match a claim." }, 400);
  if (!email || !code || code.length > 128) return wrong;

  try {
    const { db, linkHours } = alphaEnv();
    const claim = await db.prepare("SELECT id, platform, code, revoked_at, failed_redeems FROM alpha_claims WHERE email = ?1").bind(email).first<Row>();
    if (!claim) return wrong;
    if (claim.failed_redeems >= MAX_FAILED) {
      return json({ error: "Too many wrong attempts for this email. Contact admin@kenyalangku.my to unlock it." }, 429);
    }
    if (!(await safeEqual(code.toUpperCase(), claim.code.toUpperCase()))) {
      await db.prepare("UPDATE alpha_claims SET failed_redeems = failed_redeems + 1 WHERE id = ?1").bind(claim.id).run();
      return wrong;
    }
    if (claim.revoked_at) return json({ error: "This redeem code has been cancelled." }, 403);
    if (claim.failed_redeems > 0) await db.prepare("UPDATE alpha_claims SET failed_redeems = 0 WHERE id = ?1").bind(claim.id).run();

    const expiresAt = Math.floor(Date.now() / 1000) + linkHours * 3600;
    const token = await createDownloadToken(claim.id, claim.platform, expiresAt);
    return json({
      url: `/api/alpha/download?t=${encodeURIComponent(token)}`,
      expiresAt: expiresAt * 1000,
      platform: claim.platform,
      label: PLATFORMS[claim.platform].label,
      size: PLATFORMS[claim.platform].size,
    });
  } catch (error) {
    console.error("alpha redeem failed", error);
    return json({ error: "Something went wrong on our side. Please try again in a moment." }, 500);
  }
}
