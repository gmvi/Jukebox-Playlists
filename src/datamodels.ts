import { createId } from './util'
import { getProviderUserId, userProfileFromOAuth } from './auth/providers'

export interface Session {
  session_id: string;
  user_id: number;
  expiry: Date|null;
  expiry_ms: number|undefined;
}

export interface User {
  user_id: string;
  display_name: string;
}

const SELECT_OAUTH_LINK = `
  SELECT user.*
  FROM oauth_link INNER JOIN user ON oauth_link.user_id = user.user_id
  WHERE provider = ? and provider_user_id = ?
  LIMIT 1;`
export async function lookupOAuthLink(c, provider: string, claims) {
  let providerUserId
  switch (provider) {
    case 'google':
      providerUserId = claims.sub
      break
    case 'spotify':
      providerUserId = claims.id
      break
    default:
      return null
  }
  return c.env.DB.prepare(SELECT_OAUTH_LINK)
    .bind(provider, providerUserId)
    .first<User>()
}

const INSERT_OAUTH_LINK = `
  INSERT INTO oauth_link
    (user_id, provider, provider_user_id)
    VALUES (?, ?, ?);`
export async function registerOAuthLink(c, userId: string, provider: string, claims: any) {
  console.log(userId, provider, claims.id)
  return c.env.DB.prepare(INSERT_OAUTH_LINK)
    .bind(userId, provider, getProviderUserId(provider, claims))
    .run()
}

const DELETE_OAUTH_LINK = `DELETE FROM oauth_link WHERE user_id = ? and provider = ?;`
export async function unregisterOAuthLink(c, userId: string, provider: string) {
  return c.env.DB.prepare(DELETE_OAUTH_LINK)
    .bind(userId, provider)
    .run()
}

export async function registerUserFromOAuthLink(c, provider: string, claims: any) {
  let user = await createUser(c, await userProfileFromOAuth(provider, claims))
  await registerOAuthLink(c, user.user_id, provider, claims)
  return user
}

const INSERT_USER_OAUTH = `INSERT INTO user (user_id, display_name) VALUES (?, ?);`
const CHECK_USER_EXISTS = `SELECT user_id FROM user WHERE user_id = ? LIMIT 1;`
export async function createUser(c, profile: User) {
  profile.user_id = await createId(6, async (candidate) => {
    if (checkBadWords(candidate)) return false
    return null == await c.env.DB.prepare(CHECK_USER_EXISTS).bind(candidate).first()
  })
  let result = await c.env.DB.prepare(INSERT_USER_OAUTH)
    .bind(profile.user_id, profile.display_name)
    .run()
  return result.meta.changes == 1 ? profile : null
}

export interface Playlist {
  id: number
  title: string
}

export interface PlaylistTrack {
  position: number
  song: string
  override_title: string
}

export interface PlaylistFallback {
  position: number
  song: string
  priority: number
}

export async function getPlaylistTitle(c, id: number) {
  return c.env.DB
    .prepare('SELECT title FROM playlist where id = ? LIMIT 1;')
    .bind(id)
    .first('title')
}

export async function getPlaylist(ctx, id: number) {
  let db = ctx.env.DB
  const tracks = db.prepare('SELECT * FROM playlist_track where playlist_id = ?;')
      .bind(id)
      .all<PlaylistTrackData>()
  const fallbacks = db.prepare('SELECT * FROM playlist_fallback where playlist_id = ?;')
      .bind(id)
      .all<PlaylistFallbackData>()
  return tracks

  //let tracks = results.reduce((acc, song) => {
  //  if (!acc.length || song.position != acc[acc.length-1][0].position) {
  //    acc.push([song])
  //  } else {
  //    acc[acc.length-1].push(song)
  //  }
  //  return acc
  //}, [])
}

export async function add_tracks_to_playlist(ctx, id, index, tracks) {
  let db = ctx.env.DB
  let results = []
  // insert the new tracks
  stmt = await db.prepare('INSERT INTO PlaylistTracks \
      (playlist_id, position, song, override_title) \
      VALUES (?, ?, ?, ?) ;')
  for (let i = 0; i < tracks.length; i++) {
    result = await stmt.bind(id, index+i, tracks[i].song, tracks[i].title).run()
    results.push(result)
  }
  return results
}
        

