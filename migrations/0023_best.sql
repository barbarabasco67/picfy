-- Destacadas: las fotos con corazón del organizador pueden salir primero y tener su pestaña «Lo mejor».
CREATE TABLE IF NOT EXISTS event_best (
  event_id   TEXT PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  show_first INTEGER NOT NULL DEFAULT 0,
  show_tab   INTEGER NOT NULL DEFAULT 0,
  title      TEXT
);
