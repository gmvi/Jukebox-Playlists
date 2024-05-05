import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { generateState, generateCodeVerifier } from "arctic";
import { decodeIdToken, type OAuth2Tokens } from "arctic";
import { _google, _spotify } from '../auth'
import { isProd } from "../util"

export const router = new Hono()
export default router
router.mountpoint = '/login'

router.get('/', async (c) => {
  return c.html(<div>
    <h1>Login</h1>
    <p>TODO: Add login form here</p>
  </div>)
})

router.get('/google', async (c) => {
  const google = _google(c)
  const state = generateState()
  const codeVerifier = generateCodeVerifier()
  const url = await google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile'])

  setCookie(c, 'google_oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: isProd(),
    maxAge: 60 * 10,
    sameSite: 'lax',
  })
  setCookie(c, 'google_code_verifier', codeVerifier, {
    path: '/',
    httpOnly: true,
    secure: isProd(),
    maxAge: 60 * 10,
    sameSite: 'lax',
  })

  return c.redirect(url)
})

router.get('/google/callback', async (c) => {
  const google = _google(c)
  const { code, state } = c.req.query()
  const storedState = getCookie(c, "google_oauth_state") ?? null;
  const codeVerifier = getCookie(c, "google_code_verifier") ?? null;
  console.log(code, state, storedState, codeVerifier)
  if ([code, state, codeVerifier].includes(null)) {
    return new Response(null, { status: 400 });
  }
  if (state !== storedState) {
    return new Response(null, { status: 400 });
  }
  let tokens: OAuth2Tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch (e) {
    return new Response(null, { status: 400 });
  }
  const claims = decodeIdToken(tokens.idToken());
  const googleUserId = claims.sub;
  const username = claims.name;

  console.log(username)
  return c.redirect('/')
})

