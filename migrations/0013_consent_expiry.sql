-- Consentimiento al subir fotos y caducidad de galerías.
ALTER TABLE events ADD COLUMN consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN consent_text TEXT NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN expires_at INTEGER;
ALTER TABLE events ADD COLUMN expire_delete INTEGER NOT NULL DEFAULT 0;
ALTER TABLE guests ADD COLUMN consent_at INTEGER;
