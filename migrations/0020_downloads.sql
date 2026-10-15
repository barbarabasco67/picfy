-- Descargas de invitados: fotos descargadas por galería y día.
CREATE TABLE gallery_downloads (
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  day      TEXT NOT NULL,
  n        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (event_id, day)
);
