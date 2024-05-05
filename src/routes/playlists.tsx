import { Hono } from 'hono'

import type {
  PlaylistData, PlaylistTrackData, PlaylistFallbackData,
} from '../datamodels'
import {
  getPlaylistTitle, getPlaylist, add_tracks_to_playlist,
} from '../datamodels'

import Playlist from '../components/playlist'
import Player from '../components/player'


export const router = new Hono()
export default router
router.mountpoint = '/'

router.get('/player/:song', async (c) => {
  const song = decodeURIComponent(c.req.param('song'))
  const title = c.req.query('playlist_title')
  console.log(song)
  return c.html(<Player song={song} title={title} />)
})


// Create a new playlist
router.post('/playlist', async (c) => {
  const { title, tracks, fallbacks } = await c.parseBody()
  const stmt = await db.prepare('INSERT INTO Playlists (title) VALUES (?);')
  const result = await stmt.bind(title).run()
  add_tracks_to_playlist(c, result.lastInsertRowid, 0, tracks)
  //TODO: add tracks and fallbacks
  console.log(result)
  
  c.status(200)
  return c.body(null)
})


router.get('/playlist/:id', async (c) => {
  const id = c.req.param('id')
  const title = await getPlaylistTitle(c, id)
  const tracks = await getPlaylist(c, id)
  const song = tracks[0]?.song

  return c.render({
      title: title,
      playlist: <Playlist data_id={id} title={title} tracks={tracks} />,
      player: <Player title={title} song={song} />
  })
})


// Delete a playlist
router.delete('/playlist/:id', async (c) => {
  const id = c.req.param('id')
  //TODO:
  const result = await deletePlaylist(c, id)
  console.log(result)

  c.status(200)
  return c.body(null)
})

// Update a playlist
router.patch('/playlist/:id', async (c) => {
  const id = c.req.param('id')
  const { title } = await c.parseBody()
  // { title }
  if (title) {
    const result = await db.prepare('UPDATE Playlists SET title = ? WHERE id = ?;')
        .bind(patch.title, id)
        .run()
    console.log(result)
  }
})


// Add item(s) to a playlist
router.post('/playlist/:id', async (c) => {
  const id = c.req.param('id')
  let { position, song, title, tracks } = await c.parseBody()
  if (position == undefined || position == null) {
    position = -1
  }
  if (song && !(tracks && tracks.length)) {
    tracks = [{ song, title }]
  } else if (song || !(tracks && tracks.length)) {
    // exactly one of song or tracks must be provided
    c.status(422)
    return c.body(null)
  }
  //TODO: should this be a transaction?
  if (position == -1) {
    // find the correct value for position
    let stmt = db.prepare('SELECT (position) from PlaylistTracks \
        WHERE playlist_id = ? \
        ORDER BY position DESC LIMIT 1 ;')
    position = await stmt.bind(id).first('position')
    console.log('last position: '+position)
    position++
  } else {
    // not an append; increment all tracks positions at or after the
    // insertion position by the length of tracks to insert
    stmt = db.prepare('UPDATE PlaylistTracks \
        SET position = position + ? \
        WHERE playlist_id = ? AND position >= ? ;')
    let result = await stmt.bind(tracks.length, id, position).run()
    console.log(result)
    stmt = db.prepare('UPDATE PlaylistFallbacks \
        SET position = position + ? \
        WHERE playlist_id = ? AND position >= ? ;')
    result = await stmt.bind(tracks.length, id, position).run()
    console.log(result)
  }
  add_tracks_to_playlist(c, id, position, tracks)
})

// Delete item(s) from a playlist
router.delete('/playlist/:id/:position', async (c) => {
  const id = c.req.param('id')
  const positions = c.req.param('position').split(',')
  for (let i = 0; i < positions.length; i++) {
    //TODO:
    const result = await deletePlaylistItem(c, id, positions[i])
    console.log(result)
  }

  c.status(200)
  return c.body(null)
})

// Update an item in a playlist
router.patch('/playlist/:id/:position', async (c) => {
  const id = c.req.param('id')
  const position = c.req.param('position')
  const { title } = await c.parseBody()
  stmt = db.prepare('UPDATE PlaylistTracks (override_title) \
      VALUES (?) WHERE playlist_id = ? AND position = ? ;')
  result = await stmt.bind(title, id, position).run()
  console.log(result)

  c.status(200)
  return c.body(null)
})
