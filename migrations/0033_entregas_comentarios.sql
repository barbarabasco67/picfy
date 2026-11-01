ALTER TABLE entregas_torneo ADD COLUMN review TEXT;
ALTER TABLE entregas_torneo ADD COLUMN replaces TEXT;
CREATE TABLE IF NOT EXISTS entrega_comentarios (id TEXT PRIMARY KEY, entrega_id TEXT NOT NULL, sede_id TEXT NOT NULL, role TEXT NOT NULL, author TEXT NOT NULL, body TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_ecom_entrega ON entrega_comentarios(entrega_id, created_at);
