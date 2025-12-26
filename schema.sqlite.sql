PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  locale TEXT,
  timezone TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  last_login_at TEXT,
  CONSTRAINT uq_users_username UNIQUE (username),
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE users
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS artists (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  external_id TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  CONSTRAINT uq_artists_external_id UNIQUE (external_id)
);

CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);

CREATE TABLE IF NOT EXISTS albums (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  primary_artist_id INTEGER,
  release_date TEXT,
  cover_url TEXT,
  external_id TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (primary_artist_id) REFERENCES artists(id) ON DELETE RESTRICT,
  CONSTRAINT uq_albums_external_id UNIQUE (external_id)
);

CREATE INDEX IF NOT EXISTS idx_albums_primary_artist_id ON albums(primary_artist_id);
CREATE INDEX IF NOT EXISTS idx_albums_title ON albums(title);

CREATE TABLE IF NOT EXISTS tracks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  album_id INTEGER,
  primary_artist_id INTEGER,
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  track_number INTEGER CHECK (track_number IS NULL OR track_number >= 1),
  disc_number INTEGER CHECK (disc_number IS NULL OR disc_number >= 1),
  explicit INTEGER NOT NULL DEFAULT 0 CHECK (explicit IN (0, 1)),
  preview_url TEXT,
  audio_url TEXT,
  isrc TEXT,
  external_id TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL,
  FOREIGN KEY (primary_artist_id) REFERENCES artists(id) ON DELETE RESTRICT,
  CONSTRAINT uq_tracks_external_id UNIQUE (external_id)
);

CREATE INDEX IF NOT EXISTS idx_tracks_album_id ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_tracks_primary_artist_id ON tracks(primary_artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks(title);

CREATE TABLE IF NOT EXISTS genres (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  CONSTRAINT uq_genres_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS track_genres (
  track_id INTEGER NOT NULL,
  genre_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (track_id, genre_id),
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_track_genres_genre_id ON track_genres(genre_id);

CREATE TABLE IF NOT EXISTS user_favorite_tracks (
  user_id INTEGER NOT NULL,
  track_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (user_id, track_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_tracks_track_id ON user_favorite_tracks(track_id);

CREATE TABLE IF NOT EXISTS user_saved_albums (
  user_id INTEGER NOT NULL,
  album_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (user_id, album_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_saved_albums_album_id ON user_saved_albums(album_id);

CREATE TABLE IF NOT EXISTS playlists (
  id INTEGER PRIMARY KEY,
  owner_user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_playlists_owner_user_id ON playlists(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_name ON playlists(name);

CREATE TRIGGER IF NOT EXISTS trg_playlists_updated_at
AFTER UPDATE ON playlists
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE playlists
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS playlist_collaborators (
  playlist_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('collaborator', 'admin')),
  added_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (playlist_id, user_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_playlist_collaborators_user_id ON playlist_collaborators(user_id);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  id INTEGER PRIMARY KEY,
  playlist_id INTEGER NOT NULL,
  track_id INTEGER NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 1),
  added_by_user_id INTEGER,
  added_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE RESTRICT,
  FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT uq_playlist_tracks_position UNIQUE (playlist_id, position)
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks(track_id);

CREATE TABLE IF NOT EXISTS friendships (
  user_low_id INTEGER NOT NULL,
  user_high_id INTEGER NOT NULL,
  requested_by_user_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  requested_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  responded_at TEXT,
  PRIMARY KEY (user_low_id, user_high_id),
  FOREIGN KEY (user_low_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_high_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT ck_friendships_distinct CHECK (user_low_id <> user_high_id),
  CONSTRAINT ck_friendships_order CHECK (user_low_id < user_high_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY,
  created_by_user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  is_private INTEGER NOT NULL DEFAULT 1 CHECK (is_private IN (0, 1)),
  join_code TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_rooms_join_code UNIQUE (join_code)
);

CREATE INDEX IF NOT EXISTS idx_rooms_created_by_user_id ON rooms(created_by_user_id);

CREATE TABLE IF NOT EXISTS room_members (
  room_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('host', 'member')),
  joined_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  left_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  PRIMARY KEY (room_id, user_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_room_active ON room_members(room_id, is_active);

CREATE TABLE IF NOT EXISTS room_queue_items (
  id INTEGER PRIMARY KEY,
  room_id INTEGER NOT NULL,
  track_id INTEGER NOT NULL,
  added_by_user_id INTEGER,
  position INTEGER NOT NULL CHECK (position >= 1),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'playing', 'played', 'skipped')),
  added_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  started_at TEXT,
  ended_at TEXT,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE RESTRICT,
  FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT uq_room_queue_position UNIQUE (room_id, position)
);

CREATE INDEX IF NOT EXISTS idx_room_queue_items_room_id ON room_queue_items(room_id);
CREATE INDEX IF NOT EXISTS idx_room_queue_items_status ON room_queue_items(status);

CREATE TABLE IF NOT EXISTS room_playback_state (
  room_id INTEGER PRIMARY KEY,
  current_queue_item_id INTEGER,
  position_ms INTEGER NOT NULL DEFAULT 0 CHECK (position_ms >= 0),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (current_queue_item_id) REFERENCES room_queue_items(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria_json TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  CONSTRAINT uq_badges_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id INTEGER NOT NULL,
  badge_id INTEGER NOT NULL,
  earned_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  context_json TEXT,
  PRIMARY KEY (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

CREATE TABLE IF NOT EXISTS user_xp (
  user_id INTEGER PRIMARY KEY,
  xp_total INTEGER NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS xp_events (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  metadata_json TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user_id ON xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created_at ON xp_events(created_at);

CREATE TABLE IF NOT EXISTS user_ai_profile (
  user_id INTEGER PRIMARY KEY,
  personality_json TEXT,
  taste_profile_json TEXT,
  embedding_version TEXT,
  last_computed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS listening_history (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  track_id INTEGER NOT NULL,
  played_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  source TEXT NOT NULL CHECK (source IN ('manual', 'ai', 'room', 'playlist')),
  room_id INTEGER,
  playlist_id INTEGER,
  context_json TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE RESTRICT,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_listening_history_user_played_at ON listening_history(user_id, played_at);
CREATE INDEX IF NOT EXISTS idx_listening_history_track_id ON listening_history(track_id);

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  generated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  model_version TEXT,
  context_json TEXT,
  personality_snapshot_json TEXT,
  explanation_text TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_generated_at ON ai_recommendations(user_id, generated_at);

CREATE TABLE IF NOT EXISTS ai_recommendation_tracks (
  recommendation_id INTEGER NOT NULL,
  track_id INTEGER NOT NULL,
  rank INTEGER NOT NULL CHECK (rank >= 1),
  score REAL,
  reason_text TEXT,
  PRIMARY KEY (recommendation_id, track_id),
  FOREIGN KEY (recommendation_id) REFERENCES ai_recommendations(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendation_tracks_track_id ON ai_recommendation_tracks(track_id);

CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  recommendation_id INTEGER NOT NULL,
  track_id INTEGER,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike', 'skip', 'save', 'hide')),
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recommendation_id) REFERENCES ai_recommendations(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_created_at ON recommendation_feedback(user_id, created_at);

COMMIT;
