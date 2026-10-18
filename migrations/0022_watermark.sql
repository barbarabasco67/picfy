-- Marca de agua: ajustes por galería principal (las sedes los heredan) y diseño aplicado a cada foto.
CREATE TABLE IF NOT EXISTS event_wm (
  event_id TEXT PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  enabled  INTEGER NOT NULL DEFAULT 0,
  text     TEXT,
  pos      TEXT NOT NULL DEFAULT 'diag',
  opacity  INTEGER NOT NULL DEFAULT 35,
  logo     INTEGER NOT NULL DEFAULT 0,
  rev      INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS photo_wm (
  photo_id TEXT PRIMARY KEY REFERENCES photos(id) ON DELETE CASCADE,
  rev      INTEGER NOT NULL DEFAULT 0
);
