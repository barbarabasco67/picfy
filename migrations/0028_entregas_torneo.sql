CREATE TABLE entregas_torneo (id TEXT PRIMARY KEY, tarea_id TEXT NOT NULL, sede_id TEXT NOT NULL, creador_id TEXT, filename TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, upload_id TEXT, state TEXT NOT NULL DEFAULT 'uploading', created_at INTEGER NOT NULL);
CREATE INDEX idx_entregas_tarea ON entregas_torneo(tarea_id);
