import { getCookie } from "hono/cookie"

import { validateSessionToken } from "."

/*** Hono Auth Middleware ***/

const Unauthorized = () => new Response(null, { status: 401 })

export async function AuthMiddleware(c: Context<AppContext>, next: () => Promise<void>) {
  // TODO: skip this Middleware if the request is to certain endpoints
  //if (c.req.path.startsWith("/auth")) {
  //  await next()
  //  return
  //}
  let token = getCookie(c, 'session')
  console.log(token)
  let { session, user } = await validateSessionToken(c, token)
  if (session) {
    c.set("session", session)
    c.set("user", user)
  } else {
    if (c.req.method == 'POST' && !POST_NOLOGIN_EXCEPTION.includes(c.req.path)) {
      return Unauthorized()
    }
    if (c.req.method == 'PUT' || c.req.method == 'PATCH' || c.req.method == 'DELETE') {
      console.log("aborting delete")
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
