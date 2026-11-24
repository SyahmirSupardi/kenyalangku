import { alphaEnv } from "@/src/lib/alpha/env";
import { isAdmin, json, noStore } from "@/src/lib/alpha/server";
import type { FeedbackReport } from "@/src/lib/alpha/feedback";

export const dynamic = "force-dynamic";

const columns: (keyof FeedbackReport | "files")[] = [
  "id", "kind", "created_at", "status", "name", "email", "claim_id", "code_verified", "platform", "device", "os_version", "build",
  "title", "area", "severity", "frequency", "steps", "expected", "actual", "media_link",
  "play_time", "rating_overall", "rating_fun", "rating_controls", "rating_visuals", "rating_performance", "difficulty",
  "liked", "frustrated", "suggestions", "keep_playing", "recommend", "notes", "files", "admin_note",
];

/* Quotes every cell and defuses spreadsheet formulas typed into the form. */
function cell(value: unknown) {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  try {
    if (!(await isAdmin(request))) return json({ error: "Not authorised." }, 401);
    const { db } = alphaEnv();
    const { results } = await db
      .prepare("SELECT r.*, (SELECT COUNT(*) FROM feedback_files f WHERE f.report_id = r.id) AS files FROM feedback_reports r ORDER BY r.id")
      .all<FeedbackReport & { files: number }>();
    const csv = [columns.join(","), ...results.map((row) => columns.map((c) => cell(row[c])).join(","))].join("\r\n");
    const date = new Date().toISOString().slice(0, 10);
    return new Response(`﻿${csv}\r\n`, {
      headers: { ...noStore, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="genesis-roulette-feedback-${date}.csv"` },
    });
  } catch (error) {
    console.error("feedback export failed", error);
    return json({ error: "Could not export feedback." }, 500);
  }
}
