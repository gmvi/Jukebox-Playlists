import { Context } from "hono"
import { getCookie } from "hono/cookie"
import { decodeBase64IgnorePadding, encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase } from "@oslojs/encoding"
import { sha256 } from "@oslojs/crypto/sha2"

import { isProd } from "./util"
import { AppContext } from "./types"
import { User, Session } from "./datamodels"

export * from "./middleware"
export * from "./providers"

const now_unix = () => Math.floor(Date.now() / 1000)
const DAYS = 60 * 60 * 24

export function generateSessionToken() {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  return encodeBase32LowerCaseNoPadding(bytes)
}

function sessionIdFromToken(token: string) {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
}

const INSERT_SESSION = `INSERT INTO session (session_id, user_id, expiry) VALUES (?, ?, ?)`
export async function createSession(c: AppContext, token: string, user_id: string): Session {
  const session: Session = {
    session_id: sessionIdFromToken(token),
    user_id,
    expiry: now_unix() + 30*DAYS
  }
  await c.env.DB.prepare(INSERT_SESSION)
    .bind(session.session_id, session.user_id, session.expiry)
    .run()
  return session
}

const DELETE_SESSION = `DELETE FROM session WHERE session_id = ?`
export async function invalidateSession(c: AppContext, token: string): void {
  return await c.env.DB.prepare(DELETE_SESSION)
    .bind(sessionIdFromToken(token))
    .run()
}

const SELECT_SESSION = `SELECT * FROM session INNER JOIN user ON user.user_id = session.user_id WHERE session_id = ?`
export async function validateSessionToken(c: AppContext, token: string) : SessionValidationResult {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
  let row = await c.env.DB.prepare(SELECT_SESSION)
    .bind(sessionId)
    .first()
  if (row === null) return { session: null, user: null }
  if (Date.now() >= row.expiry*1000) {
    await c.env.DB.prepare(DELETE_SESSION)
      .bind(sessionId)
      .run()
    return { session: null, user: null }
  }
  // Assign these explicitly because I feel more confident this way.
  // TODO: rewrite this in ReScript?
  let session = {
    session_id: sessionId,
    user_id: row.user_id,
    expiry: row.expiry
  }
  let user = {
    user_id: row.user_id,
    display_name: row.display_name
  }
  const now = now_unix()
  if (now >= session.expiry - 15*DAYS) {
    session.expiry = now + 30*DAYS
    db.execute(
      "UPDATE session SET expiry = ? WHERE id = ?",
      session.expiry,
      session.session_id
    )
  }
  return { session, user }
}

export type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null }
