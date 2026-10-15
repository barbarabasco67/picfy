-- Enlace con nombre elegido por el organizador: picfy.es/g/<slug>
ALTER TABLE events ADD COLUMN slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events(slug) WHERE slug IS NOT NULL;
