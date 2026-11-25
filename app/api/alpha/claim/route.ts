import { alphaEnv } from "@/src/lib/alpha/env";
import { isAndroidBrand } from "@/src/lib/alpha/devices";
import {
  isPlatform,
  json,
  normaliseEmail,
  recordEmail,
  sendCodeEmail,
  slotSummary,
  verifyTurnstile,
} from "@/src/lib/alpha/server";

type ClaimRow = {
  id: number;
  name: string;
  email: string;
  platform: "android" | "windows";
  code: string;
  revoked_at: string | null;
  email_sent_at: string | null;
  approved_at: string | null;
};

const RESEND_COOLDOWN_MINUTES = 10;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Please fill in the form again." }, 400);
  }

  // Hidden field that people never see. Bots that fill it get a normal-looking reply and no code.
  if (String(body.website ?? "")) return json({ ok: true, message: "Check your inbox for your redeem code." });

  const name = String(body.name ?? "").trim().replace(/\s+/g, " ");
  const email = normaliseEmail(body.email);
  const platform = body.platform;
  if (name.length < 2 || name.length > 80) return json({ error: "Please enter your name (2 to 80 characters)." }, 400);
  if (!email) return json({ error: "Please enter a valid email address." }, 400);
  if (!isPlatform(platform)) return json({ error: "Please choose Android or Windows." }, 400);
  let deviceBrand: string | null = null;
  let deviceModel: string | null = null;
  if (platform === "android") {
    deviceBrand = isAndroidBrand(body.deviceBrand) ? body.deviceBrand : null;
    deviceModel = String(body.deviceModel ?? "").trim().replace(/\s+/g, " ");
    if (!deviceBrand) return json({ error: "Please choose your device brand." }, 400);
    if (deviceModel.length < 1 || deviceModel.length > 60) return json({ error: "Please enter your device model (up to 60 characters)." }, 400);
  }
  if (body.agree !== true) return json({ error: "Please accept the closed alpha terms to continue." }, 400);

  try {
    if (!(await verifyTurnstile(body.turnstileToken, request))) {
      return json({ error: "The security check did not pass. Please try again." }, 400);
    }

    const { db, cap } = alphaEnv();
    const sent = { ok: true, message: `Your redeem code is on its way to ${email}. Check your inbox, and your spam folder if it is not there in a few minutes.` };

    // One claim per email. A repeat request re-sends the same code, at most every few minutes.
    const existing = await db.prepare("SELECT * FROM alpha_claims WHERE email = ?1").bind(email).first<ClaimRow>();
    if (existing) {
      if (existing.revoked_at) return json({ error: "This email can no longer claim alpha access. Contact admin@kenyalangku.my if you think this is a mistake." }, 403);
      // A request still waiting from the old approval flow is approved now and its code sent.
      if (!existing.approved_at) {
        await db.prepare("UPDATE alpha_claims SET approved_at = datetime('now') WHERE id = ?1").bind(existing.id).run();
        const result = await sendCodeEmail(existing);
        await recordEmail(db, existing.id, result);
        if (!result.ok) console.error("alpha email failed", result.error);
        return json(result.ok ? { ...sent, alreadyClaimed: true } : { ok: true, message: "Your slot is saved, but the email could not be sent just now. We will send your code to you shortly." });
      }
      const recent = await db
        .prepare("SELECT 1 AS recent FROM alpha_claims WHERE id = ?1 AND email_sent_at > datetime('now', ?2)")
        .bind(existing.id, `-${RESEND_COOLDOWN_MINUTES} minutes`)
        .first();
      if (!recent) await recordEmail(db, existing.id, await sendCodeEmail(existing));
      return json({ ...sent, alreadyClaimed: true });
    }

    const rejected = await db.prepare("SELECT 1 AS rejected FROM alpha_rejections WHERE email = ?1").bind(email).first();
    if (rejected) return json({ error: "We could not approve a closed alpha slot for this email. Contact admin@kenyalangku.my if you think this is a mistake." }, 403);

    // Takes the next unused code from the game's list and emails it straight away. The count check
    // and the insert are one statement, so concurrent requests can never pass the cap.
    const claimed = await db
      .prepare(
        `INSERT INTO alpha_claims (name, email, platform, code, device_brand, device_model, approved_at)
         SELECT ?1, ?2, ?3, c.code, ?5, ?6, datetime('now') FROM alpha_codes c
         WHERE (c.platform IS NULL OR c.platform = ?3)
           AND NOT EXISTS (SELECT 1 FROM alpha_claims a WHERE a.code = c.code)
           AND (SELECT COUNT(*) FROM alpha_claims WHERE revoked_at IS NULL) < ?4
         ORDER BY c.added_at, c.code
         LIMIT 1
         RETURNING id, code`,
      )
      .bind(name, email, platform, cap, deviceBrand, deviceModel)
      .first<{ id: number; code: string }>()
      .catch((error: unknown) => {
        // A second request for the same email that raced past the check above.
        if (String(error).includes("UNIQUE constraint failed: alpha_claims.email")) return "duplicate" as const;
        throw error;
      });

    if (claimed === "duplicate") return json({ ...sent, alreadyClaimed: true });
    if (!claimed) {
      const slots = await slotSummary(db, cap);
      return json(
        { error: slots.remaining > 0 ? `No ${platform === "android" ? "Android" : "Windows"} slots are left. Please try the other platform.` : "The closed alpha is full. Thank you for your interest.", full: slots.remaining === 0 },
        409,
      );
    }

    const result = await sendCodeEmail({ name, email, platform, code: claimed.code });
    await recordEmail(db, claimed.id, result);
    if (!result.ok) console.error("alpha email failed", result.error);
    return json(result.ok ? sent : { ok: true, message: "Your slot is saved, but the email could not be sent just now. We will send your code to you shortly." });
  } catch (error) {
    console.error("alpha claim failed", error);
    return json({ error: "Something went wrong on our side. Please try again in a moment." }, 500);
  }
}
