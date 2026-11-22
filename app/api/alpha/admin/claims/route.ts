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
  email_sent_at: string | null;
  email_error: string | null;
  revoked_at: string | null;
  downloads: number;
  last_download_at: string | null;
  failed_redeems: number;
};

export async function GET(request: Request) {
  try {
    if (!(await isAdmin(request))) return json({ error: "Not authorised." }, 401);
    const { db, cap } = alphaEnv();
    const [claims, slots] = await Promise.all([
      db.prepare("SELECT * FROM alpha_claims ORDER BY id").all<AdminClaim>(),
      slotSummary(db, cap),
    ]);
    return json({ claims: claims.results, slots });
  } catch (error) {
    console.error("alpha admin list failed", error);
    return json({ error: "Could not load claims." }, 500);
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdmin(request))) return json({ error: "Not authorised." }, 401);
    const { action, id } = (await request.json()) as { action?: string; id?: unknown };
    if (typeof id !== "number" || !Number.isInteger(id)) return json({ error: "Missing claim id." }, 400);
    const { db } = alphaEnv();
    if (action === "revoke") {
      await db.prepare("UPDATE alpha_claims SET revoked_at = datetime('now') WHERE id = ?1 AND revoked_at IS NULL").bind(id).run();
    } else if (action === "restore") {
      await db.prepare("UPDATE alpha_claims SET revoked_at = NULL, failed_redeems = 0 WHERE id = ?1").bind(id).run();
    } else if (action === "resend") {
      const claim = await db.prepare("SELECT * FROM alpha_claims WHERE id = ?1").bind(id).first<AdminClaim>();
      if (!claim) return json({ error: "Claim not found." }, 404);
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
