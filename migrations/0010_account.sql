-- Datos de la cuenta: apellidos y valores predeterminados para galerías nuevas (JSON).
ALTER TABLE users ADD COLUMN surname TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN defaults TEXT NOT NULL DEFAULT '';
