-- Personalización de cada galería: color de botones, foto de perfil y foto de cabecera.
ALTER TABLE events ADD COLUMN accent    TEXT;                        -- #rrggbb o NULL (color de Picfy)
ALTER TABLE events ADD COLUMN cover_v   INTEGER NOT NULL DEFAULT 0;  -- 0 = sin foto; si no, marca de versión
ALTER TABLE events ADD COLUMN avatar_v  INTEGER NOT NULL DEFAULT 0;
