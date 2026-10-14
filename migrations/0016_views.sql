-- Estadísticas de visualizaciones.
CREATE TABLE gallery_views (
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  day      TEXT NOT NULL,
  voter    TEXT NOT NULL,
  n        INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (event_id, day, voter)
);
CREATE TABLE photo_views (
  photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  n        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (photo_id)
);
