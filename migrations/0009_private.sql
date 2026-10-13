-- Subgalerías privadas (no salen en la galería general) y contraseña opcional de acceso.
ALTER TABLE events ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN access_hash TEXT;   -- "sal:hash" PBKDF2, o NULL si no hay contraseña
