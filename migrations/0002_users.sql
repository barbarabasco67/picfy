-- Picfy: cuentas de usuario. Cada galería (evento) puede tener un dueño.

CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,                -- siempre en minúsculas
  name        TEXT NOT NULL DEFAULT '',
  pass_salt   TEXT NOT NULL,
  pass_hash   TEXT NOT NULL,                       -- PBKDF2-SHA256 (nunca la contraseña)
  created_at  INTEGER NOT NULL
);

CREATE TABLE sessions (
  token_hash  TEXT PRIMARY KEY,                    -- SHA-256 del token de la cookie
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  INTEGER NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions (user_id);

ALTER TABLE events ADD COLUMN owner_id TEXT REFERENCES users(id);
CREATE INDEX idx_events_owner ON events (owner_id);
