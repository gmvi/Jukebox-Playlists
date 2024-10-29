DROP TABLE IF EXISTS TrackMetadata;
DROP TABLE IF EXISTS UserTrackMetadata; -- depends on User
DROP TABLE IF EXISTS FallbacksHistory; -- depends on User

DROP TABLE IF EXISTS PlaylistExternalSync; -- depends on Playlists
DROP TABLE IF EXISTS PlaylistFallbacks; -- depends on Playlists
DROP TABLE IF EXISTS PlaylistTracks; -- depends on Playlists
DROP TABLE IF EXISTS PlaylistShares; -- depends on Playlists, Users
DROP TABLE IF EXISTS Playlists; -- depends on Users

DROP TABLE IF EXISTS Sessions; -- depends on User
DROP TABLE IF EXISTS OAuthLinks; -- depends on User
DROP TABLE IF EXISTS Users;

DROP TABLE IF EXISTS track_metadata;
DROP TABLE IF EXISTS user_track_metadata; -- depends on user
DROP TABLE IF EXISTS fallback_history; -- depends on user

DROP TABLE IF EXISTS playlist_external_syn; -- typo
DROP TABLE IF EXISTS playlist_external_sync; -- depends on playlists
DROP TABLE IF EXISTS playlist_fallback; -- depends on playlists
DROP TABLE IF EXISTS playlist_track; -- depends on playlists
DROP TABLE IF EXISTS playlist_share; -- depends on playlists, users
DROP TABLE IF EXISTS playlist; -- depends on users

DROP TABLE IF EXISTS session; -- depends on user
DROP TABLE IF EXISTS oauth_link; -- depends on user
DROP TABLE IF EXISTS user;


CREATE TABLE user (
  user_id TEXT NOT NULL PRIMARY KEY,
  display_name TEXT,
  pciture_url TEXT DEFAULT NULL
);
INSERT INTO user (user_id, display_name)
VALUES
  ("test01", 'Test User'),
  ("test02", 'Other User');

-- OAuth tokens for logins and account linking
-- 
-- Providers:
--    google
--    spotify
--    soundcloud
--    apple (costs $99/year)
--  ? deezer
--  ? vimeo
--  ? bandcamp
CREATE TABLE oauth_link (
  user_id TEXT NOT NULL REFERENCES user(user_id),
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,

  auth_token TEXT DEFAULT NULL,
  email TEXT DEFAULT NULL,
  token_expiry TIMESTAMP DEFAULT NULL, -- TODO: change to NOT NULL

  PRIMARY KEY (user_id, provider)
);
INSERT INTO oauth_link (user_id, provider, provider_user_id, auth_token)
VALUES
  ("test01", 'google', 'test-google-id', 'test-google-token');

CREATE TABLE session (
  session_id TEXT NOT NULL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(user_id),
  expiry INTEGER NOT NULL
);



CREATE TABLE playlist (
  id INT NOT NULL PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES user(user_id),
  title TEXT NOT NULL,

  deleted BOOLEAN NOT NULL DEFAULT FALSE
);
INSERT INTO playlist (id, owner_id, title)
VALUES
  (1, "test01", 'Test Playlist'),
  (2, "test01", 'Other Playlist');

CREATE TABLE playlist_external_sync (
  id INT NOT NULL PRIMARY KEY,
  playlist_id INT REFERENCES playlist(id),
  from_playlist_slug TEXT, -- slug in the format [platform]:[playlist_id]
  to_playlist_slug TEXT, --   " "
  bidirectional BOOLEAN NOT NULL DEFAULT FALSE,

  last_sync TIMESTAMP DEFAULT NULL
);

CREATE TABLE playlist_share (
  share_id TEXT NOT NULL PRIMARY KEY, -- url slug
  playlist_id INT NOT NULL REFERENCES playlist(id),
  collaborative BOOLEAN NOT NULL DEFAULT FALSE,
  -- either public
  public BOOLEAN NOT NULL DEFAULT FALSE,
  -- or to a user
  user_id TEXT DEFAULT NULL REFERENCES user(user_id),
  pending_email TEXT DEFAULT NULL,

  CHECK (1 == public + (user_id IS NOT NULL) + (pending_email IS NOT NULL))
);
INSERT INTO playlist_share (share_id, playlist_id, public, user_id)
VALUES
  (1, 1, TRUE, NULL),
  (2, 2, FALSE, 'test02');

CREATE TABLE track_metadata (
  slug TEXT NOT NULL PRIMARY KEY, -- song id prefixed with source platform
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT NOT NULL,

  last_updated TIMESTAMP NOT NULL,
  visible BOOLEAN NOT NULL DEFAULT TRUE -- track if a published song disappears
);
CREATE INDEX idx_track_metadata_last_updated ON track_metadata(last_updated);

-- TODO: re-evaluate this architecture
CREATE TABLE user_track_metadata (
  slug TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(user_id),
  override_title TEXT DEFAULT NULL,
  override_artist TEXT DEFAULT NULL,
  override_album TEXT DEFAULT NULL,

  PRIMARY KEY (slug, user_id),
  CHECK (override_title IS NOT NULL OR override_artist IS NOT NULL OR override_album IS NOT NULL)
);

-- represents a user adding a backup track or changing an automatic one.
-- to be used for refining automatic track backup choices
CREATE TABLE fallback_history (
  id INT NOT NULL PRIMARY KEY,
  user_id TEXT NOT NULL,  -- User who associated the songs, for personalized suggestions
  song1_slug TEXT NOT NULL,
  song2_slug TEXT NOT NULL,
  song3_slug TEXT DEFAULT NULL,
  song4_slug TEXT DEFAULT NULL,

  timestamp TIMESTAMP NOT NULL
);
CREATE INDEX idx_fallback_history_user_id ON fallback_history(user_id);

CREATE TABLE playlist_track (
  playlist_id INT NOT NULL REFERENCES playlist(id),
  position INT NOT NULL,
  song TEXT NOT NULL, -- song slug
  override_title TEXT DEFAULT NULL,

  PRIMARY KEY (playlist_id, position)
  -- leave out for now for easier development testing
  --FOREIGN KEY (song) REFERENCES track_metadata(slug)
);
CREATE INDEX idx_playlist_track_playlist_id ON playlist_track(playlist_id);
INSERT INTO playlist_track (playlist_id, position, song, override_title)
VALUES
  (1, 0, 'youtube:dQw4w9WgXcQ', '<b>[phase 1]</b> Never Gonna Give You Up (<b>Youtube</b>)'),
  (1, 1, 'vimeo:681449396:6b2311bcf9', '<b>[phase 1]</b> Never Gonna Give You Up (<b>Vimeo</b>)'),
  (1, 2, 'soundcloud:1219405522', '<b>[phase 1]</b> Never Gonna Give You Up x Migos (<b>Soundcloud</b>)'),
  (1, 3, 'spotify:4PTG3Z6ehGkBFwjybzWkR8', '<b>[phase 1]</b> Never Gonna Give You Up (<b>Spotify</b>) <u>requires premium subscription</u>'),
  (1, 4, 'dropbox:audio:r1gdw6cssgdyb07nmv5i9/Chung-Antique-Sweater-Weather-01-Former-Farmer.mp3?rlkey=ifflu911fuh56rx3rp6xdc88m <u>requires browser extension</u>',
            '<b>[phase 1]</b> Chung Antique - Former Farmer (<b>Dropbox</b> share link) <u>requires browser extension</u>'),
  (1, 5, 'link:audio:https://files.ceenaija.com/wp-content/uploads/music/2023/07/Rick_Astley_-_Never_Gonna_Give_You_Up_CeeNaija.com_.mp3',
            '<b>[phase 1]</b> Never Gonna Give You Up - Live (<b>generic internet link</b>) <u>requires browser extension</u>'),
  (1, 6, 'deezer:781592622', '[phase 2] Never Gonna Give You Up (<b>Deezer</b>) <u>requires premium subscription + browser extension</u>'),
  (1, 7, 'apple:album/never-gonna-give-you-up/1452434638?i=1452434833', '[phase 2] Never Gonna Give You Up (<b>Apple Music</b>) <u>requires premium subscription + browser extension</u>'),
  (1, 8, 'mixcloud:ed-mash/focus-mix-vol-103-rick-astley-never-gonna-give-you-up', '[phase 3] Never Gonna Give You Up (<b>Mixcloud</b>) <u>requires browser extension</u>'),
  (1, 9, 'bandcamp:4248939073', '[phase 3] Never Gonna Give You Up - Remix (<b>Bandcamp</b>) - <u>requires browser extension;&nbsp;&nbsp;paid tracks require background tab</u>'),
  (1, 10, 'archive:NeverGonnaGiveYouUp', '[phase 3] Never Gonna Give You Up (<b>Archive.org</b>) <u>requires browser extension</u>'),
  (1, 11, '', '[phase 4] <b>Plex</b> - <u>requires browser extension; requires background tab</u>'),
  (1, 12, '', '[phase 4] <b>Tidal</b> - <u>likely requires browser extension and background tab</u>'),
  (1, 13, '', '[phase 4] <b>Amazon</b> - <u>likely requires browser extension and background tab</u>'),
  (1, 14, 'drive:0B-klwLEjaXWcZHR5SmJJWEwtYnc/preview?resourcekey=0-D33DYWMxjVde0g1m7qsoZw', '[phase ??] Never Gonna Give You Up (<b>Google Drive</b>) - <u>may not be feasible</u>'),
  (2, 0, 'youtube:dQw4w9WgXcQ', 'Never Gonna Give You Up (youtube)');

CREATE TABLE playlist_fallback(
  playlist_id INT NOT NULL REFERENCES playlist(id),
  position INT NOT NULL,
  priority INT NOT NULL,
  song TEXT NOT NULL, -- song slug

  PRIMARY KEY (playlist_id, position, priority)
);

SELECT "Initialization Successful!" FROM playlist;
