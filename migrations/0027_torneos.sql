CREATE TABLE torneos (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX idx_torneos_owner ON torneos(owner_id);
CREATE TABLE sedes (id TEXT PRIMARY KEY, torneo_id TEXT NOT NULL, name TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX idx_sedes_torneo ON sedes(torneo_id);
CREATE TABLE creadores (id TEXT PRIMARY KEY, sede_id TEXT NOT NULL, name TEXT NOT NULL, token TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL);
CREATE INDEX idx_creadores_sede ON creadores(sede_id);
CREATE TABLE tareas_torneo (id TEXT PRIMARY KEY, sede_id TEXT NOT NULL, creador_id TEXT, kind TEXT NOT NULL, title TEXT NOT NULL, date TEXT NOT NULL DEFAULT '', time TEXT, notes TEXT, done INTEGER NOT NULL DEFAULT 0, done_at INTEGER, done_by TEXT, created_at INTEGER NOT NULL);
CREATE INDEX idx_tareas_sede ON tareas_torneo(sede_id, date);
