import { Hono } from 'hono'
import playlists from './playlists'
import devtools from './devtools'
import login from './login'

export function attachRoutes(app: Hono) {
  app.route(playlists.mountpoint, playlists)
  app.route(login.mountpoint, login)
}

export function attachDevRoutes(app: Hono) {
  app.route(devtools.mountpoint, devtools)
}
