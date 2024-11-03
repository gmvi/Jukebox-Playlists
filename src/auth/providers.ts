import { Google, Spotify, Dropbox } from "arctic"

import { ORIGIN, memoize_ctx } from "../util"


const _google = memoize_ctx((c) => new Google(
  c.env.GOOGLE_OAUTH_CLIENT_ID,
  c.env.GOOGLE_OAUTH_CLIENT_SECRET,
  ORIGIN(c) + "/login/google/callback"
))
const _spotify = memoize_ctx((c) => new Spotify(
  c.env.SPOTIFY_OAUTH_CLIENT_ID,
  c.env.SPOTIFY_OAUTH_CLIENT_SECRET,
  ORIGIN(c) + "/login/spotify/callback"
))
/*const _microsoft = memoize_ctx((c) => new Microsoft(
  c.env.MICROSOFT_OAUTH_TENANT,
  c.env.MICROSOFT_OAUTH_CLIENT_ID,
  c.env.MICROSOFT_OAUTH_CLIENT_SECRET,
  ORIGIN(c) + "/login/microsoft/callback"
))*/
const _dropbox = memoize_ctx((c) => new Dropbox(
  c.env.DROPBOX_OAUTH_APP_KEY,
  c.env.DROPBOX_OAUTH_APP_SECRET,
  ORIGIN(c) + "/login/dropbox/callback"
))
// Costs $99 per year
//let apple_pkcs8_pk = c.env.APPLE_OAUTH_PRIVATE_KEY
//apple_pkcs8_pk = apple_pkcs8_pk.replace(/-+(BEGIN|END) PRIVATE KEY-+/, '')
//apple_pkcs8_pk = decodeBase64IgnorePadding(apple_pkcs8_pk)
//apple_pkcs8_pk = apple_pkcs8_pk.replace(/\n|\r/g, '').trim()
//
//export const apple = new Apple(env.APPLE_OAUTH_CLIENT_ID,
//                               env.APPLE_OAUTH_TEAM_ID,
//                               env.APPLE_OAUTH_KEY_ID,
//                               apple_pkcs8_pk,
//                               ORIGIN + "/login/apple/callback")
//delete apple_pkcs8_pk

export function getProvider(c, provider) {
  switch (provider) {
    case 'google': return _google(c)
    case 'spotify': return _spotify(c)
    //case 'microsoft': return _microsoft(c)
    case 'dropbox': return _dropbox(c)
    default: return null
  }
}

export function getProviderUserId(provider, claims) {
  switch (provider) {
    case 'google': return claims.sub
    case 'spotify': return claims.id
    case 'dropbox': return claims.sub
    default: return null
  }
}

const profileFields = ['display_name', 'picture_url']
export async function userProfileFromOAuth(provider, claims) {
  let profile = (() => {
    switch (provider) {
      case 'google': return {
        display_name: claims.name,
        picture_url: claims.picture
      }
      case 'spotify': return {
        display_name: claims.display_name,
        picture_url: claims.images[0].url
      }
      case 'dropbox': return {
        display_name: claims.given_name + " " + claims.family_name,
      }
      default: return null
    }
  })()
  // don't pass undefineds to D1 API
  // instead of requiring many "?? null" above, simpler to enforce it here
  for (const key of profileFields) {
    profile[key] = profile[key] ?? null
  }
  return profile
}
