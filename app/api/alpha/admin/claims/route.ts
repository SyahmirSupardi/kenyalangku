import { alphaEnv } from "@/src/lib/alpha/env";
import { isAdmin, json, recordEmail, sendCodeEmail, slotSummary } from "@/src/lib/alpha/server";

export const dynamic = "force-dynamic";

export type AdminClaim = {
  id: number;
  name: string;
  email: string;
  platform: "android" | "windows";
  device_brand: string | null;
  device_model: string | null;
  code: string;
  created_at: string;
  approved_at: string | null;
  email_sent_at: string | null;
  email_error: string | null;
  revoked_at: string | null;
  downloads: number;
  last_download_at: string | null;
  failed_redeems: number;
};

export type AdminRejection = { email: string; name: string; platform: string | null; device: string | null; requested_at: string | null; rejected_at: string };

export async function GET(request: Request) {
  try {
    if (!(await isAdmin(request))) return json({ error: "Not authorised." }, 401);
    const { db, cap } = alphaEnv();
    const [claims, rejections, slots] = await Promise.all([
      db.prepare("SELECT * FROM alpha_claims ORDER BY id").all<AdminClaim>(),
      db.prepare("SELECT * FROM alpha_rejections ORDER BY rejected_at DESC").all<AdminRejection>(),
      slotSummary(db, cap),
    ]);
    return json({ claims: claims.results, rejections: rejections.results, slots });
  } catch (error) {
    console.error("alpha admin list failed", error);
    return json({ error: "Could not load claims." }, 500);
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdmin(request))) return json({ error: "Not authorised." }, 401);
    const { action, id, email } = (await request.json()) as { action?: string; id?: unknown; email?: unknown };
    const { db } = alphaEnv();
    if (action === "allow") {
      // Lets a rejected email apply again.
      if (typeof email !== "string" || !email) return json({ error: "Missing email." }, 400);
      await db.prepare("DELETE FROM alpha_rejections WHERE email = ?1").bind(email).run();
      return json({ ok: true });
    }
    if (typeof id !== "number" || !Number.isInteger(id)) return json({ error: "Missing claim id." }, 400);
    if (action === "approve") {
      const claim = await db
        .prepare("UPDATE alpha_claims SET approved_at = datetime('now') WHERE id = ?1 AND approved_at IS NULL AND revoked_at IS NULL RETURNING *")
        .bind(id)
        .first<AdminClaim>();
      if (!claim) return json({ error: "This claim is not waiting for approval." }, 409);
      const result = await sendCodeEmail(claim);
      await recordEmail(db, id, result);
      if (!result.ok) return json({ error: `Approved, but the email failed: ${result.error}. Use Resend to try again.` }, 502);
    } else if (action === "reject") {
      const claim = await db.prepare("SELECT * FROM alpha_claims WHERE id = ?1 AND approved_at IS NULL").bind(id).first<AdminClaim>();
      if (!claim) return json({ error: "Only claims waiting for approval can be rejected. Use Cancel code for approved ones." }, 409);
      // Reports sent with this email stay, unlinked from the claim, so the row can be deleted.
      await db
        .prepare("UPDATE feedback_reports SET claim_id = NULL, code_verified = 0 WHERE claim_id = ?1")
        .bind(id)
        .run()
        .catch(() => undefined);
      // Deleting the pending claim frees its code (never emailed) and its slot.
      const device = claim.device_brand ? `${claim.device_brand} ${claim.device_model ?? ""}`.trim() : null;
      await db.batch([
        db
          .prepare("INSERT OR REPLACE INTO alpha_rejections (email, name, platform, device, requested_at) VALUES (?1, ?2, ?3, ?4, ?5)")
          .bind(claim.email, claim.name, claim.platform, device, claim.created_at),
        db.prepare("DELETE FROM alpha_claims WHERE id = ?1 AND approved_at IS NULL").bind(id),
      ]);
    } else if (action === "revoke") {
      await db.prepare("UPDATE alpha_claims SET revoked_at = datetime('now') WHERE id = ?1 AND revoked_at IS NULL").bind(id).run();
    } else if (action === "restore") {
      await db.prepare("UPDATE alpha_claims SET revoked_at = NULL, failed_redeems = 0 WHERE id = ?1").bind(id).run();
    } else if (action === "resend") {
      const claim = await db.prepare("SELECT * FROM alpha_claims WHERE id = ?1").bind(id).first<AdminClaim>();
      if (!claim) return json({ error: "Claim not found." }, 404);
      if (!claim.approved_at) return json({ error: "Approve this claim first. Approving sends the code." }, 409);
      const result = await sendCodeEmail(claim);
      await recordEmail(db, id, result);
      if (!result.ok) return json({ error: `Email failed: ${result.error}` }, 502);
    } else {
      return json({ error: "Unknown action." }, 400);
    }
    return json({ ok: true });
  } catch (error) {
    console.error("alpha admin action failed", error);
    return json({ error: "The action failed." }, 500);
  }
}
