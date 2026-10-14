-- Foto de perfil del usuario (versión para romper la caché; 0 = sin foto).
ALTER TABLE users ADD COLUMN avatar_v INTEGER NOT NULL DEFAULT 0;
