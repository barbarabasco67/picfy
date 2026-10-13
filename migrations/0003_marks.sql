-- Marcas por foto: bandera de color y corazón (favorita).
ALTER TABLE photos ADD COLUMN flag TEXT;                         -- red | orange | green | black | NULL
ALTER TABLE photos ADD COLUMN fav  INTEGER NOT NULL DEFAULT 0;
