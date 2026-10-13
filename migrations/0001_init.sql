-- Picfy: esquema inicial

CREATE TABLE events (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  lead          TEXT NOT NULL DEFAULT '',
  event_date    TEXT,
  guest_token   TEXT NOT NULL UNIQUE,
  manage_hash   TEXT NOT NULL,
  auto_approve  INTEGER NOT NULL DEFAULT 1,
  photo_limit   INTEGER NOT NULL DEFAULT 0,        -- 0 = sin limite por invitado
  sort_mode     TEXT NOT NULL DEFAULT 'time',      -- time | time_desc | manual
  upload_open   INTEGER NOT NULL DEFAULT 1,
  gallery_open  INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL
);

CREATE TABLE guests (
  id          TEXT PRIMARY KEY,
  event_id    TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  key_hash    TEXT NOT NULL,                       -- SHA-256 de la clave personal (nunca la clave)
  name        TEXT NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL,
  UNIQUE (event_id, key_hash)
);

CREATE TABLE photos (
  id           TEXT PRIMARY KEY,                   -- 32 hex aleatorios: es parte de la URL
  event_id     TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id     TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL DEFAULT '',
  mime         TEXT NOT NULL DEFAULT 'image/jpeg',
  size         INTEGER NOT NULL DEFAULT 0,
  crc32        INTEGER,                            -- para el ZIP sin recalcular
  w            INTEGER,
  h            INTEGER,
  taken_at     INTEGER,                            -- hora de captura (ms), si la foto la trae
  uploaded_at  INTEGER NOT NULL,
  state        TEXT NOT NULL DEFAULT 'uploading',  -- uploading | pending | approved | rejected
  sort_order   INTEGER NOT NULL DEFAULT 0,
  caption      TEXT NOT NULL DEFAULT ''
);

CREATE UNIQUE INDEX idx_events_manage ON events (manage_hash);
CREATE INDEX idx_photos_event_state ON photos (event_id, state);
CREATE INDEX idx_photos_guest ON photos (guest_id);
CREATE INDEX idx_guests_event ON guests (event_id);
