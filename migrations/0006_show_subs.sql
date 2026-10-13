-- Permite mostrar las subgalerías (sedes, secciones...) en la página de invitados.
ALTER TABLE events ADD COLUMN show_subs INTEGER NOT NULL DEFAULT 0;
