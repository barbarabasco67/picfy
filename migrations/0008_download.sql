-- Permite a los invitados descargar fotos (una a una, selección o ZIP).
ALTER TABLE events ADD COLUMN allow_download INTEGER NOT NULL DEFAULT 0;
