-- PrimeFlowAI Profit Recovery Engine: initial schema.

CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  business_name TEXT,
  industry TEXT,
  currency TEXT NOT NULL,
  inputs_json TEXT NOT NULL,
  results_json TEXT NOT NULL,
  total_leakage REAL NOT NULL,
  grade TEXT NOT NULL,
  diagnosis TEXT,
  ip_hash TEXT,
  website_url TEXT,
  site_scan_json TEXT,
  -- Links the report to the industry_research row used (if any).
  research_key TEXT
);

CREATE TABLE site_scans (
  domain TEXT PRIMARY KEY,
  scanned_at TEXT NOT NULL DEFAULT (datetime('now')),
  scan_json TEXT NOT NULL
);

CREATE TABLE industry_research (
  key TEXT PRIMARY KEY,            -- e.g. "health-wellness|physiotherapy-clinics|AU|newcastle"
  status TEXT NOT NULL,            -- pending | ready | failed
  research_json TEXT,              -- full research INCLUDING sources (internal only)
  input_tokens INTEGER,
  output_tokens INTEGER,
  searches_used INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Fixed-window rate limit counters (key = bucket:ipHash:window).
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Stats dropped by sanity bounds, kept for the owner to review.
CREATE TABLE research_rejections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  research_key TEXT NOT NULL,
  metric TEXT,
  value REAL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created ON leads(created_at);
CREATE INDEX idx_research_created ON industry_research(created_at);
CREATE INDEX idx_rate_limits_expires ON rate_limits(expires_at);
