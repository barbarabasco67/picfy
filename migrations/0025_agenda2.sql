DROP TABLE IF EXISTS agenda_items;
CREATE TABLE agenda_items (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  icon TEXT,
  category TEXT,
  color TEXT,
  date TEXT NOT NULL DEFAULT '',
  end_date TEXT,
  time TEXT,
  end_time TEXT,
  done INTEGER NOT NULL DEFAULT 0,
  url TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_agenda_owner_date ON agenda_items(owner_id, date);
