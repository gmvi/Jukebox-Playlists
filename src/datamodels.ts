export interface Session {
  id: string;
  userId: number;
  expiry: Date;
}

export interface User {
  id: number;
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
  let db = c.env.DB
  return db.prepare('SELECT title FROM playlist where id = ?;')
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
        

