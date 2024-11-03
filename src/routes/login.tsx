import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import {
  generateState, generateCodeVerifier, decodeIdToken,
  type OAuth2Tokens
} from "arctic"

import { getProvider } from '../auth/providers'
import {
  generateSessionToken, createSession, deleteSession, invalidateSession,
  validateSessionToken
} from '../auth'
import { isProd } from "../util"
import {
  lookupOAuthLink, registerUserFromOAuthLink, 
} from '../datamodels'
import { LoginLayout } from '../layouts/login-layout'

export const router = new Hono()
export default router
router.mountpoint = '/login'



router.get('/', async (c) => {
  return c.render(<LoginLayout />)
})

router.delete('/', async (c) => {
  let token = getCookie(c, 'session')
  console.log('Token:', token)
  if (token) {
    await invalidateSession(c, token)
    console.log('Deleted session:', await validateSessionToken(c, token))
  }
  deleteCookie(c, 'session')
  return c.body(null)
})

router.get('/google', async (c) => {
  const google = getProvider(c, 'google')
  const state = generateState()
  const codeVerifier = generateCodeVerifier()
  const url = await google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile'])

  setCookie(c, 'google_oauth_state', state, {
    httpOnly: true,
    secure: isProd(c),
    maxAge: 60 * 10,
    sameSite: 'lax',
  })
  setCookie(c, 'google_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: isProd(c),
    maxAge: 60 * 10,
    sameSite: 'lax',
  })

  return c.redirect(url)
})

router.get('/google/callback', async (c) => {
  const google = getProvider(c, 'google');
  const { code, state } = c.req.query()
  const storedState = getCookie(c, "google_oauth_state")
  const verifier = getCookie(c, "google_code_verifier")
  if (state != storedState || [code, state, verifier].includes(undefined)) {
    return new Response(null, { status: 400 })
  }
  let claims
  try {
    let tokens: OAuth2Tokens = await google.validateAuthorizationCode(code, verifier)
    claims = decodeIdToken(tokens.idToken())
  } catch (e) {
    return new Response(null, { status: 400 })
  }
  if (claims.aud != google.clientId) {
    return new Response(null, { status: 400 })
  }
  await logIn(c, 'google', claims)
  return c.redirect('/')
})

const spotifyScopes = [/*'user-read-email'*/]
router.get('/spotify', async (c) => {
  const spotify = getProvider(c, 'spotify')
  const state = generateState()
  //const codeVerifier = generateCodeVerifier()
  const url = await spotify.createAuthorizationURL(state, [])
  setCookie(c, 'spotify_oauth_state', state, {
    httpOnly: true,
    secure: isProd(c),
    maxAge: 60 * 10,
    sameSite: 'lax',
  })
  /*setCookie(c, 'spotify_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: isProd(c),
    maxAge: 60 * 10,
    sameSite: 'lax',
  })*/
  return c.redirect(url)
})

router.get('/spotify/callback', async (c) => {
  const spotify = getProvider(c, 'spotify')
  const { code, state } = c.req.query()
  const storedState = getCookie(c, "spotify_oauth_state")
  //const verifier = getCookie(c, "spotify_code_verifier")
  if (state != storedState || [code, state/*, verifier*/].includes(undefined)) {
    console.log("Bad cookie?")
    return new Response(null, { status: 400 })
  }
  let claims = {}
  try {
    let tokens: OAuth2Tokens = await spotify.validateAuthorizationCode(code)
    claims.accessToken = tokens.accessToken()
    claims.accessTokenExpiry = tokens.accessTokenExpiresAt()
    claims.refreshToken = tokens.refreshToken()
  } catch (e) {
    return new Response(null, { status: 400 })
  }
  // TODO: validate that this accessToken is meant for this app
  let profile = await fetch('https://api.spotify.com/v1/me', {
    headers: { 'Authorization': `Bearer ${claims.accessToken}` }
  })
  if (!profile.ok) return new Response(null, { status: 400 })
  claims.profile = await profile.json()
  if (await logIn(c, "spotify", claims))
    return c.redirect('/')
  else
    return c.redirect('/login?error=spotify')
})

const dropboxScopes = [
  'account_info.read',
  'openid', 'profile',
  'files.metadata.read',
  'sharing.read'
]
router.get('/dropbox', async (c) => {
  const dropbox = getProvider(c, 'dropbox')
  const state = generateState()
  const url = await dropbox.createAuthorizationURL(state, dropboxScopes)
  setCookie(c, 'dropbox_oauth_state', state, {
    httpOnly: true,
    secure: isProd(c),
    maxAge: 60 * 10,
    sameSite: 'lax',
  })
  return c.redirect(url)
})

router.get('/dropbox/callback', async (c) => {
  const dropbox = getProvider(c, 'dropbox')
  const { code, state } = c.req.query()
  const storedState = getCookie(c, "dropbox_oauth_state")
  if (state != storedState || [code, state].includes(undefined)) {
    return new Response(null, { status: 400 })
  }
  let claims, accessToken, accessTokenExpiry
  try {
    let tokens: OAuth2Tokens = await dropbox.validateAuthorizationCode(code)
    claims = decodeIdToken(tokens.idToken())
    claims.accessToken = tokens.accessToken()
    claims.accessTokenExpiry = tokens.accessTokenExpiresAt()
  } catch (e) {
    return new Response(null, { status: 400 })
  }
  if (claims.aud != dropbox.clientId) {
   return new Response(null, { status: 400 })
  }
  await logIn(c, 'dropbox', claims)
  return c.redirect('/')
})


async function logIn(c, provider, claims) {
  let user = await lookupOAuthLink(c, provider, claims)
  if (user == null) {
    user = await registerUserFromOAuthLink(c, provider, claims)
  }
  console.log('establishing session for user:', user.user_id)
  const token = generateSessionToken()
  const session = await createSession(c, token, user.user_id)
  setCookie(c, 'session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd(c),
    expires: new Date(session.expiry * 1000),
    path: '/',
  })
  return true
}
