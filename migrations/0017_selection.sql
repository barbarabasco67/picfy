-- Selección de favoritas del cliente y envío por email.
ALTER TABLE events ADD COLUMN selection INTEGER NOT NULL DEFAULT 0;
CREATE TABLE selections (
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  voter      TEXT NOT NULL,
  photo_id   TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (event_id, voter, photo_id)
);
CREATE TABLE selection_sends (
  id         TEXT PRIMARY KEY,
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  voter      TEXT NOT NULL,
  name       TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  note       TEXT NOT NULL DEFAULT '',
  ids        TEXT NOT NULL,
  n          INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_selsends_event ON selection_sends(event_id, created_at);
