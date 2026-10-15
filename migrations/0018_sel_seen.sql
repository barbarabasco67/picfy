-- Aviso de selecciones nuevas: cuándo las vio el organizador por última vez.
ALTER TABLE events ADD COLUMN sel_seen_at INTEGER NOT NULL DEFAULT 0;
