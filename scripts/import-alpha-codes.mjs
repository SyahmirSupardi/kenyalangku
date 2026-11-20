#!/usr/bin/env node
// Imports the Genesis Roulette redeem codes that the game accepts into D1.
//
//   node scripts/import-alpha-codes.mjs codes.txt [--platform android|windows] [--local]
//
// The file holds one code per line, or a CSV with a "code" column (and optionally
// a "status" column). Blank lines and lines starting with # are skipped.
// Codes already in the database are left as they are, so re-running is safe.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--platform");
const platformIndex = args.indexOf("--platform");
const platform = platformIndex >= 0 ? args[platformIndex + 1] : null;
const local = args.includes("--local");

if (!file) {
  console.error("Usage: node scripts/import-alpha-codes.mjs <codes.txt> [--platform android|windows] [--local]");
  process.exit(1);
}
if (platform && !["android", "windows"].includes(platform)) {
  console.error("--platform must be android or windows");
  process.exit(1);
}

// Reads the codes. A CSV with a header row is supported: the "code" column is used,
// and when a "status" column exists only rows marked "unused" are imported, so codes
// already handed out by hand are never given to a second tester.
const rows = readFileSync(file, "utf8")
  .replace(/^\uFEFF/, "")
  .split(/\r?\n/)
  .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")))
  .filter((cells) => cells[0] && !cells[0].startsWith("#"));
const header = rows[0]?.map((cell) => cell.toLowerCase()) ?? [];
const hasHeader = header.includes("code");
const codeCol = hasHeader ? header.indexOf("code") : 0;
const statusCol = hasHeader ? header.indexOf("status") : -1;
const dataRows = hasHeader ? rows.slice(1) : rows;
const skipped = statusCol >= 0 ? dataRows.filter((cells) => (cells[statusCol] ?? "").toLowerCase() !== "unused") : [];
const codes = [
  ...new Set(
    dataRows
      .filter((cells) => statusCol < 0 || (cells[statusCol] ?? "").toLowerCase() === "unused")
      .map((cells) => cells[codeCol])
      .filter(Boolean),
  ),
];
if (skipped.length) console.log(`Skipping ${skipped.length} code(s) not marked unused: ${skipped.map((c) => c[codeCol]).join(", ")}`);
const bad = codes.filter((code) => code.length > 128 || /[\s']/.test(code));
if (bad.length) {
  console.error(`These codes contain spaces, quotes or are too long: ${bad.slice(0, 5).join(", ")}`);
  process.exit(1);
}
if (!codes.length) {
  console.error("No codes found in the file.");
  process.exit(1);
}

const platformSql = platform ? `'${platform}'` : "NULL";
const sql = codes.map((code) => `INSERT OR IGNORE INTO alpha_codes (code, platform) VALUES ('${code}', ${platformSql});`).join("\n");
const dir = mkdtempSync(join(tmpdir(), "alpha-codes-"));
const sqlFile = join(dir, "codes.sql");
writeFileSync(sqlFile, sql);
try {
  execFileSync("npx", ["wrangler", "d1", "execute", "kenyalangku-alpha", local ? "--local" : "--remote", `--file=${sqlFile}`], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  console.log(`Imported ${codes.length} codes${platform ? ` for ${platform}` : ""} (existing codes were skipped).`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
