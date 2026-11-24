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
                  COALESCE(SUM(CASE WHEN approved_at IS NULL THEN 1 ELSE 0 END), 0) AS pending,
                  COALESCE(SUM(CASE WHEN approved_at IS NOT NULL AND email_sent_at IS NULL THEN 1 ELSE 0 END), 0) AS emailsNotSent,
                  MAX(created_at) AS lastClaimAt
           FROM alpha_claims WHERE revoked_at IS NULL`,
        )
        .first<{ claims: number; downloads: number; android: number; windows: number; pending: number; emailsNotSent: number; lastClaimAt: string | null }>(),
    ]);
    // Kept separate so the hub still loads before the feedback migration is applied.
    const feedback = await db
      .prepare(
        `SELECT COUNT(*) AS reports,
                COALESCE(SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END), 0) AS unread,
                COALESCE(SUM(CASE WHEN kind = 'bug' THEN 1 ELSE 0 END), 0) AS bugs,
                COALESCE(SUM(CASE WHEN kind = 'bug' AND severity = 'blocker' AND status NOT IN ('fixed', 'wont_fix', 'duplicate') THEN 1 ELSE 0 END), 0) AS openBlockers,
                MAX(created_at) AS lastReportAt
         FROM feedback_reports`,
      )
      .first<{ reports: number; unread: number; bugs: number; openBlockers: number; lastReportAt: string | null }>()
      .catch((error: unknown) => {
        console.error("feedback overview failed", error);
        return null;
      });
    return json({ genesisAlpha: { slots, ...totals }, genesisFeedback: feedback });
  } catch (error) {
    console.error("admin overview failed", error);
    return json({ error: "Could not load the overview." }, 500);
  }
}
