import { alphaEnv } from "@/src/lib/alpha/env";
import { isAdmin, json, noStore } from "@/src/lib/alpha/server";
import type { AdminClaim } from "../claims/route";

export const dynamic = "force-dynamic";

const columns: (keyof AdminClaim)[] = ["id", "name", "email", "platform", "device_brand", "device_model", "code", "created_at", "approved_at", "email_sent_at", "revoked_at", "downloads", "last_download_at"];

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
    const { results } = await db.prepare("SELECT * FROM alpha_claims ORDER BY id").all<AdminClaim>();
    const csv = [columns.join(","), ...results.map((row) => columns.map((c) => cell(row[c])).join(","))].join("\r\n");
    const date = new Date().toISOString().slice(0, 10);
    return new Response(`﻿${csv}\r\n`, {
      headers: { ...noStore, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="genesis-roulette-alpha-claims-${date}.csv"` },
    });
  } catch (error) {
    console.error("alpha export failed", error);
    return json({ error: "Could not export claims." }, 500);
  }
}
