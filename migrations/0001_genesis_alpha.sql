-- Genesis Roulette closed alpha claims.
-- alpha_codes holds the redeem codes that the game itself accepts. Import them
-- with `node scripts/import-alpha-codes.mjs <file>`; the site never invents codes.
CREATE TABLE IF NOT EXISTS alpha_codes (
  code TEXT PRIMARY KEY,
  -- NULL means the code works on either platform.
  platform TEXT CHECK (platform IN ('android', 'windows')),
  added_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alpha_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'windows')),
  code TEXT NOT NULL UNIQUE REFERENCES alpha_codes (code),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  email_sent_at TEXT,
  email_error TEXT,
  revoked_at TEXT,
  downloads INTEGER NOT NULL DEFAULT 0,
  last_download_at TEXT,
  failed_redeems INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS alpha_claims_active ON alpha_claims (revoked_at);
