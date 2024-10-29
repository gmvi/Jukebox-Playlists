import { Hono } from 'hono'
import { html } from 'hono/html'
import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'
import { logger } from 'hono/logger'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { serveStatic } from '@hono/node-server/serve-static'

import Playlist from './components/playlist'
import Player from './components/player'
import AccountMenu from './components/account-menu'

import { attachRoutes, attachDevRoutes } from './routes'
import { getPlaylistTitle, getPlaylist } from './datamodels'
import type { AppContext, Bindings } from './types'
import { AuthMiddleware } from './auth'
import { ORIGIN } from './util'
import LandingLayout from './layouts/landing-layout'

const READONLY_METHODS = [ 'GET', 'HEAD', 'OPTIONS' ]
const WRITE_METHODS = [ 'POST', 'PUT', 'PATCH', 'DELETE' ]

/* Hono app and middleware */

const app = new Hono<AppContext>()

const CSRFProtection = (c: AppContext, next: () => Promise) => {
  if (WRITE_METHODS.includes(c.req.method)) {
    console.log('Origin:', c.req.header('Origin'))
    if (c.req.header('Origin') != ORIGIN(c)) {
      return c.status(403).json({ error: 'CSRF protection' })
    }
  }
  return next()
}

app.use(logger())
//   .use(cors())
  .get('/health', c => c.json({ status: 'ok' }))
  .use(CSRFProtection)
  .use(AuthMiddleware)

//app.use('*', async (c, next) => {
//  let lucia = initializeLucia(c.env.DB)
//  let sessionID = getCookie(c, lucia.sessionCookieName) ?? null;
//})


app.use(jsxRenderer(({ children }) => {
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
        <link rel="stylesheet" href="/static/google-signin.css" />
      </head>
      <body style="height: 100%;">
        ${children}
      </body>
    </html>`
}))
  //let accountMenu = <AccountMenu user={user} />
  //console.log('AccountMenu:', accountMenu)
        //<header>
        //  <nav>
        //  </nav>
        //</header>
        //<main>
        //  ${main}
        //</main>
        //<footer id="footer-player">
        //</footer>

app.get('/', (c) => {
  if (c.get('user')) {
    return c.redirect('/playlist/1')
  } else {
    return c.html(<LandingLayout />)
  }
})

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

