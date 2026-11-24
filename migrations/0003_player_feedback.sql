-- Genesis Roulette player feedback: bug reports and playtest feedback from testers.
CREATE TABLE IF NOT EXISTS feedback_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('bug', 'playtest')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  name TEXT,
  email TEXT NOT NULL,
  -- Set when the email belongs to an alpha claim; code_verified when the redeem code matched too.
  claim_id INTEGER REFERENCES alpha_claims (id),
  code_verified INTEGER NOT NULL DEFAULT 0,
  platform TEXT CHECK (platform IN ('android', 'windows')),
  device TEXT,
  os_version TEXT,
  build TEXT,
  -- Bug report
  title TEXT,
  area TEXT,
  severity TEXT CHECK (severity IN ('blocker', 'major', 'minor', 'cosmetic')),
  frequency TEXT CHECK (frequency IN ('always', 'often', 'sometimes', 'once')),
  steps TEXT,
  expected TEXT,
  actual TEXT,
  media_link TEXT,
  -- Playtest feedback
  play_time TEXT,
  rating_overall INTEGER CHECK (rating_overall BETWEEN 1 AND 5),
  rating_fun INTEGER CHECK (rating_fun BETWEEN 1 AND 5),
  rating_controls INTEGER CHECK (rating_controls BETWEEN 1 AND 5),
  rating_visuals INTEGER CHECK (rating_visuals BETWEEN 1 AND 5),
  rating_performance INTEGER CHECK (rating_performance BETWEEN 1 AND 5),
  difficulty TEXT CHECK (difficulty IN ('too_easy', 'bit_easy', 'just_right', 'bit_hard', 'too_hard')),
  liked TEXT,
  frustrated TEXT,
  suggestions TEXT,
  keep_playing TEXT CHECK (keep_playing IN ('yes', 'maybe', 'no')),
  recommend INTEGER CHECK (recommend BETWEEN 0 AND 10),
  -- Anything else the tester wants to add (both kinds)
  notes TEXT,
  -- Studio triage
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'fixed', 'wont_fix', 'duplicate', 'read')),
  admin_note TEXT,
  -- Hash of the sender's IP, only for rate limiting.
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS feedback_reports_created ON feedback_reports (created_at);
CREATE INDEX IF NOT EXISTS feedback_reports_email ON feedback_reports (email, created_at);
CREATE INDEX IF NOT EXISTS feedback_reports_ip ON feedback_reports (ip_hash, created_at);

-- Screenshots stored in the private R2 bucket under feedback/.
CREATE TABLE IF NOT EXISTS feedback_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL REFERENCES feedback_reports (id),
  r2_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  original_name TEXT
);

CREATE INDEX IF NOT EXISTS feedback_files_report ON feedback_files (report_id);
