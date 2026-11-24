-- Genesis Roulette closed alpha: the studio approves each claim before its code is emailed.
-- A new claim reserves a code and a slot straight away, with approved_at left empty (pending).
-- Approving sets approved_at and sends the email. Rejecting deletes the pending claim, which
-- frees its code and slot, and keeps the email in alpha_rejections so it cannot apply again.
ALTER TABLE alpha_claims ADD COLUMN approved_at TEXT;

-- Claims made before this change already had their code emailed, so they count as approved.
UPDATE alpha_claims SET approved_at = COALESCE(email_sent_at, created_at) WHERE approved_at IS NULL;

CREATE INDEX IF NOT EXISTS alpha_claims_pending ON alpha_claims (approved_at);

CREATE TABLE IF NOT EXISTS alpha_rejections (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT,
  device TEXT,
  requested_at TEXT,
  rejected_at TEXT NOT NULL DEFAULT (datetime('now'))
);
