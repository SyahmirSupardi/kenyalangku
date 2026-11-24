import { alphaEnv } from "@/src/lib/alpha/env";
import { isAdmin, json } from "@/src/lib/alpha/server";
import { STATUSES, type FeedbackFile, type FeedbackReport } from "@/src/lib/alpha/feedback";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!(await isAdmin(request))) return json({ error: "Not authorised." }, 401);
    const { db } = alphaEnv();
    const fields = "id, kind, created_at, name, email, claim_id, code_verified, platform, device, os_version, build, title, area, severity, frequency, steps, expected, actual, media_link, play_time, rating_overall, rating_fun, rating_controls, rating_visuals, rating_performance, difficulty, liked, frustrated, suggestions, keep_playing, recommend, notes, status, admin_note";
    const [reports, files] = await Promise.all([
      db.prepare(`SELECT ${fields} FROM feedback_reports ORDER BY id DESC LIMIT 1000`).all<FeedbackReport>(),
      db.prepare("SELECT id, report_id, content_type, size, original_name FROM feedback_files ORDER BY id").all<FeedbackFile>(),
    ]);
    return json({ reports: reports.results, files: files.results });
  } catch (error) {
    console.error("feedback admin list failed", error);
    const missing = String(error).includes("no such table");
    return json({ error: missing ? "The feedback tables are not in the database yet. Apply migration 0003_player_feedback.sql." : "Could not load feedback." }, 500);
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdmin(request))) return json({ error: "Not authorised." }, 401);
    const { id, status, adminNote } = (await request.json()) as { id?: unknown; status?: unknown; adminNote?: unknown };
    if (typeof id !== "number" || !Number.isInteger(id)) return json({ error: "Missing report id." }, 400);
    if (typeof status !== "string" || !STATUSES.some((s) => s.value === status)) return json({ error: "Unknown status." }, 400);
    const note = typeof adminNote === "string" ? adminNote.trim().slice(0, 2000) || null : null;
    const { db } = alphaEnv();
    await db.prepare("UPDATE feedback_reports SET status = ?2, admin_note = ?3 WHERE id = ?1").bind(id, status, note).run();
    return json({ ok: true });
  } catch (error) {
    console.error("feedback admin update failed", error);
    return json({ error: "The update failed." }, 500);
  }
}
