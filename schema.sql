CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    discord TEXT,
    instagram TEXT,
    telegram TEXT,
    signal TEXT,
    address TEXT,
    notes TEXT,
    image_url TEXT,
    personal_code_hash TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts (name);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts (created_at);