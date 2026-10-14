-- Nombre de usuario (opcional, único, en minúsculas).
ALTER TABLE users ADD COLUMN username TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX idx_users_username ON users(username) WHERE username <> '';
