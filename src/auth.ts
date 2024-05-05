import { Context } from "hono"
import { Lucia, TimeSpan } from "lucia"
import { D1Adapter } from "@lucia-auth/adapter-sqlite"
import { Google, Spotify, Apple } from "arctic"
import { decodeBase64IgnorePadding, encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase } from "@oslojs/encoding"
import { sha256 } from "@oslojs/crypto/sha2"

import { isProd } from "./util"
import { AppContext } from "./types"
import { User, Session } from "./datamodels"

export async function InitializeLucia(c, next) {
  let lucia = c.get('lucia')
  if (!lucia) c.set('lucia', new Lucia(
    new D1Adapter(c.env.DB, {
      user: "Users",
      session: "Sessions"
    }),
    {
      sessionExpiresIn: new TimeSpan(1, "w"),
      sessionCookie: {
        name: "session",
        expires: false, // the default
        attributes: {
          secure: isProd(),
          //sameSite: "strict",
          //domain: env.WEB_DOMAIN,
        },
      },
      getUserAttributes: (attributes) => ({
        name: attributes.display_name,
      }),
    }
  ))
  await next()
}

export function generateSessionToken() {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  return encodeBase32LowerCaseNoPadding(bytes)
}

const INSERT_SESSION = `INSERT INTO session (id, user_id, expiry) VALUES (?, ?, ?)`
export async function createSession(c: AppContext, token: string, userId: number): Session {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
  const day_ms = 1000 * 60 * 60 * 24
  const session: Session = {
    id: sessionId,
    userId,
    expiry_ms: new Date(Date.now() + 30 * day_ms)
  }
  exipry_unix = Math.floor(session.expiry_ms.getTime() / 1000)
  await c.env.DB.prepare(INSERT_SESSION)
    .bind(session.id, session.userId, expiry_unix)
    .run()
  return session
}

const SELECT_SESSION = `
    SELECT session.id, session.user_id, session.expiry, user.id
    FROM session INNER JOIN user ON user.id = session.user_id
    WHERE id = ?`
export async function validateSessionToken(token: string) : SessionValidationResult {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
  let row = await c.env.DB.prepare(SELECT_SESSION)
    .bind(sessionId)
    .first()
  if (row === null) return { session: null, user: null }
  console.log(row)
  const session: Session = {
    id: row[0],
    userId: row[1],
    expiresAt: new Date(row[2] * 1000)
  }
  const user: User = {
    id: row[3]
  }
  if (Date.now() >= session.expiresAt.getTime()) {
    db.execute("DELETE FROM session WHERE id = ?", session.id)
    return { session: null, user: null }
  }
  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    db.execute(
      "UPDATE session SET expiry = ? WHERE id = ?",
      Math.floor(session.expiresAt.getTime() / 1000),
      session.id
    )
  }
  return { session, user }
}

export function invalidateSession(sessionId: string): void {
  // TODO
}

export type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null }


const Unauthorized = () => new Response("Unauthorized", { status: 401 })

export async function AuthMiddleware(c: Context<AppContext>, next: () => Promise<void>) {
  // TODO: skip this Middleware if the request is to certain endpoints
  //if (c.req.path.startsWith("/auth")) {
  //  await next()
  //  return
  //}
  const lucia = c.get("lucia")
  // TODO: 403 stuff
  
  const authHeader = c.req.header("Authorization") ?? ''
  const sessionId = lucia.readBearerToken(authHeader)
  let session = null
  if (sessionId) {
    let { session, user } = await lucia.validateSessionToken(sessionId);
    if (session) {
      c.set("session", session);
      c.set("user", user as User & DatabaseUserAttributes);
    }
    if (session?.fresh) {
      c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize())
    }
  }
  if (!session) {
    if (c.req.method == 'POST' && !POST_NOLOGIN_EXCEPTION.includes(c.req.path)) {
      return Unauthorized()
    }
    if (c.req.method == 'PUT' || c.req.method == 'DELETE') {
      return Unauthorized()
    }
  }
  await next()
}

// For GET requests (POST, PUT, and DELETE methods require login by default)
export async function RequireLogin(c: Context<AppContext>, next: () => Promise<void>) {
  if (!c.get("session")) {
    return Unauthorized()
  }
  console.log(c.get("session"))
  await next()
}

const PROD_HOSTNAME = "jukebox-playlists.george-matter-vi.workers.dev"
const DEV_PORT = 8787

const CALLBACK_PREFIX = isProd() ? `https://${PROD_HOSTNAME}/`
                                 : `http://localhost:${DEV_PORT}/`

// Costs $99 per year
//const APPLE_PKCS8_PRIVATE_KEY = decodeBase64IgnorePadding(
//  env.APPLE_OAUTH_PRIVATE_KEY.replace(/-{3,}(BEGIN|END) PRIVATE KEY-{3,}/, '')
//                             .replace(/\n|\r/g, '')
//                             .trim()
//)
//export const apple = new Apple(env.APPLE_OAUTH_CLIENT_ID,
//                               env.APPLE_OAUTH_TEAM_ID,
//                               env.APPLE_OAUTH_KEY_ID,
//                               APPLE_PKCS8_PRIVATE_KEY,
//                               CALLBACK_PREFIX + "login/apple/callback")

var google
export const _google = (c) => {
  return google = google ??
    new Google(c.env.GOOGLE_OAUTH_CLIENT_ID,
               c.env.GOOGLE_OAUTH_CLIENT_SECRET,
               CALLBACK_PREFIX + "login/google/callback")
}

var spotify
export const _spotify = (c) => spotify = spotify ??
    new Spotify(c.env.SPOTIFY_OAUTH_CLIENT_ID,
                c.env.SPOTIFY_OAUTH_CLIENT_SECRET,
                CALLBACK_PREFIX + "login/spotify/callback")

interface DatabaseUserAttributes {
  name: string // SQL: display_name
}

declare module "lucia" {
  interface Register {
    Lucia: ReturnType<typeof initializeLucia>
    DatabaseUserAttributes: DatabaseUserAttributes
  }
}
