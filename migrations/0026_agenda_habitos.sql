DROP TABLE IF EXISTS agenda_items;
CREATE TABLE agenda_items (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  icon TEXT,
  category TEXT,
  date TEXT NOT NULL DEFAULT '',
  end_date TEXT,
  time TEXT,
  end_time TEXT,
  done INTEGER NOT NULL DEFAULT 0,
  important INTEGER NOT NULL DEFAULT 0,
  url TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_agenda_owner_date ON agenda_items(owner_id, date);
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT NOT NULL,
  unit TEXT,
  goal INTEGER NOT NULL DEFAULT 1,
  step INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_habits_owner ON habits(owner_id);
CREATE TABLE IF NOT EXISTS habit_logs (
  habit_id TEXT NOT NULL,
  date TEXT NOT NULL,
  value INTEGER NOT NULL,
  PRIMARY KEY (habit_id, date)
);
