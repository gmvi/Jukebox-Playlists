import { Hono } from 'hono'
import { html } from 'hono/html'
import { jsxRenderer } from 'hono/jsx-renderer'
import { logger } from 'hono/logger'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

import Playlist from './components/playlist'
import Player from './components/player'

import { attachRoutes, attachDevRoutes } from './routes'
import { getPlaylistTitle, getPlaylist } from './datamodels'
import type { AppContext, Bindings } from './types'
import { AuthMiddleware, InitializeLucia } from './auth'


/* Hono app and middleware */

const app = new Hono<AppContext>()

app.use(logger())
//   .use(cors())
   .use(InitializeLucia)
   .get('/health', c => c.json({ status: 'ok' }))
   .use(AuthMiddleware)

//app.use('*', async (c, next) => {
//  let lucia = initializeLucia(c.env.DB)
//  let sessionID = getCookie(c, lucia.sessionCookieName) ?? null;
//})


// jsxRenderer? or layout?
app.use('*', jsxRenderer(({ children }) => {
  let { title, player, playlist } = children
  return html`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://unpkg.com/htmx.org@1.9.3"></script>
        <script src="https://unpkg.com/hyperscript.org@0.9.9"></script>
        <!-- TODO: build tailwind with vite or something -->
        <script src="https://cdn.tailwindcss.com"></script>
        <!-- iFrame APIs for embed providers -->
        <script src="https://www.youtube.com/iframe_api"></script>
        <!--<script src="https://player.vimeo.com/api/player.js"></script>-->
        <!--<script src="https://w.soundcloud.com/player/api.js"></script>-->
        <!-- TODO: does this api only work with podcasts or also with music? -->
        <!--<script src="https://open.spotify.com/embed/iframe-api/v1"></script>-->

        <title>Jukebox Playlists</title>
      </head>
      <body style="height: 100%;">
        <div class="m-4" style="margin-bottom: 360px">
          <h1 class="text-2xl font-bold mb-4">
            <a href="/">Cross-platform Playlist Demo</a>
          </h1>
          ${playlist}
        </div>
        <footer class="w-full bg-slate-300 fixed inset-x-0 bottom-0">
          ${player}
        </footer>
      </body>
    </html>`
}))

app.get('/', c => c.redirect('/playlist/1'))

attachRoutes(app)
attachDevRoutes(app)

export default app

// TODO: re-eval if this is the right way to declare the module
declare module 'hono' {
  interface ContextRenderer {
    ( content: string | Promise<string>,
      props: { title: string, }
    ): Response | Promise<Response>
  }
}

