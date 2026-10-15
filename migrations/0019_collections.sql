-- Colecciones: agrupan varias galerías de un mismo cliente bajo un enlace.
CREATE TABLE collections (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT NOT NULL,
  name       TEXT NOT NULL,
  lead       TEXT NOT NULL DEFAULT '',
  token      TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);
CREATE TABLE collection_items (
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  event_id      TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, event_id)
);
CREATE INDEX idx_collections_owner ON collections(owner_id, created_at);
