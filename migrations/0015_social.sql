-- Me gusta y comentarios en las fotos.
ALTER TABLE events ADD COLUMN social INTEGER NOT NULL DEFAULT 1;
CREATE TABLE photo_likes (
  photo_id   TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  voter      TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (photo_id, voter)
);
CREATE TABLE photo_comments (
  id         TEXT PRIMARY KEY,
  photo_id   TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  voter      TEXT NOT NULL,
  author     TEXT NOT NULL DEFAULT '',
  body       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_comments_photo ON photo_comments(photo_id, created_at);
CREATE INDEX idx_comments_voter ON photo_comments(voter, created_at);
