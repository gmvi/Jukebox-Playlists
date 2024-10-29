import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import {
  generateState, generateCodeVerifier, decodeIdToken,
  type OAuth2Tokens
} from "arctic"

import { _google, _spotify } from '../auth/providers'
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
  const google = _google(c)
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
  const google = _google(c)
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

router.get('/spotify', async (c) => {
  const spotify = _spotify(c)
  const state = generateState()
  const codeVerifier = generateCodeVerifier()
  const url = await spotify.createAuthorizationURL(state, ['user-read-email'])
  setCookie(c, 'spotify_oauth_state', state, {
    httpOnly: true,
    secure: isProd(c),
    maxAge: 60 * 10,
    sameSite: 'lax',
  })
  setCookie(c, 'spotify_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: isProd(c),
    maxAge: 60 * 10,
    sameSite: 'lax',
  })
  return c.redirect(url)
})

router.get('/spotify/callback', async (c) => {
  const spotify = _spotify(c)
  const { code, state } = c.req.query()
  const storedState = getCookie(c, "spotify_oauth_state")
  const verifier = getCookie(c, "spotify_code_verifier")
  if (state != storedState || [code, state, verifier].includes(undefined)) {
    console.log("Bad cookie?")
    return new Response(null, { status: 400 })
  }
  let accessToken, accessTokenExpiry, refreshToken
  try {
    let tokens: OAuth2Tokens = await spotify.validateAuthorizationCode(code)
    accessToken = tokens.accessToken()
    accessTokenExpiry = tokens.accessTokenExpiresAt()
    refreshToken = tokens.refreshToken()
  } catch (e) {
    return new Response(null, { status: 400 })
  }
  // TODO: validate that this isn't a copy of someone else's valid auth code
  if (await logIn(c, "spotify", {accessToken, accessTokenExpiry, refreshToken}))
    return c.redirect('/')
  else
    return c.redirect('/login?error=spotify')
})

async function logIn(c, provider, claims) {
  if (provider == 'spotify') {
    let { accessToken, accessTokenExpiry, refreshToken } = claims
    let profile = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    if (!profile.ok) return false
    claims = await profile.json()
  }
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
