-- Agenda personal: torneos, partidos, publicaciones y tareas.
CREATE TABLE IF NOT EXISTS agenda_items (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT NOT NULL,
  kind       TEXT NOT NULL,
  title      TEXT NOT NULL,
  date       TEXT NOT NULL,
  end_date   TEXT,
  time       TEXT,
  status     TEXT NOT NULL,
  client     TEXT,
  detail     TEXT,
  url        TEXT,
  notes      TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agenda_owner_date ON agenda_items(owner_id, date);
