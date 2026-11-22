import { alphaEnv } from "@/src/lib/alpha/env";
import { isAdmin, json, slotSummary } from "@/src/lib/alpha/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!(await isAdmin(request))) return json({ error: "Not authorised." }, 401);
    const { db, cap } = alphaEnv();
    const [slots, totals] = await Promise.all([
      slotSummary(db, cap),
      db
        .prepare(
          `SELECT COUNT(*) AS claims,
                  COALESCE(SUM(downloads), 0) AS downloads,
                  COALESCE(SUM(CASE WHEN platform = 'android' THEN 1 ELSE 0 END), 0) AS android,
                  COALESCE(SUM(CASE WHEN platform = 'windows' THEN 1 ELSE 0 END), 0) AS windows,
                  COALESCE(SUM(CASE WHEN email_sent_at IS NULL THEN 1 ELSE 0 END), 0) AS emailsNotSent,
                  MAX(created_at) AS lastClaimAt
           FROM alpha_claims WHERE revoked_at IS NULL`,
        )
        .first<{ claims: number; downloads: number; android: number; windows: number; emailsNotSent: number; lastClaimAt: string | null }>(),
    ]);
    return json({ genesisAlpha: { slots, ...totals } });
  } catch (error) {
    console.error("admin overview failed", error);
    return json({ error: "Could not load the overview." }, 500);
  }
}
