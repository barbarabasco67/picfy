-- Subgalerías: una galería puede colgar de otra (p. ej. una sede dentro de un torneo).
ALTER TABLE events ADD COLUMN parent_id TEXT REFERENCES events(id);
CREATE INDEX idx_events_parent ON events (parent_id);
