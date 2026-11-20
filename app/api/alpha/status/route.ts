import { alphaEnv } from "@/src/lib/alpha/env";
import { json, slotSummary } from "@/src/lib/alpha/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db, cap, env } = alphaEnv();
    const slots = await slotSummary(db, cap);
    return json({
      total: slots.total,
      claimed: slots.claimed,
      remaining: slots.remaining,
      open: slots.remaining > 0,
      turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? "",
    });
  } catch (error) {
    console.error("alpha status failed", error);
    return json({ error: "The claim service is not available right now." }, 503);
  }
}
