-- Papelera: borrado suave de fotos y galerías (30 días).
ALTER TABLE events ADD COLUMN deleted_at INTEGER;
ALTER TABLE photos ADD COLUMN prev_state TEXT;
ALTER TABLE photos ADD COLUMN deleted_at INTEGER;
CREATE INDEX idx_photos_trash ON photos(deleted_at) WHERE deleted_at IS NOT NULL;
