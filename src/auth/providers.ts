import { Google, Spotify, Apple } from "arctic"

import { ORIGIN, memoize_ctx } from "../util"


export const _google = memoize_ctx((c) => new Google(
  c.env.GOOGLE_OAUTH_CLIENT_ID,
  c.env.GOOGLE_OAUTH_CLIENT_SECRET,
  ORIGIN(c) + "/login/google/callback"
))
export const _spotify = memoize_ctx((c) => new Spotify(
  c.env.SPOTIFY_OAUTH_CLIENT_ID,
  c.env.SPOTIFY_OAUTH_CLIENT_SECRET,
  ORIGIN(c) + "/login/spotify/callback"
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


export function getProviderUserId(provider, claims) {
  switch (provider) {
    case 'google': return claims.sub
    case 'spotify': return claims.id
    default: return null
  }
}

const profileFields = ['displayName', 'pictureUrl']
export async function userProfileFromOAuth(provider, claims) {
  let profile
  if (provider == 'google')
      profile = {
        display_name: claims.name,
        picture_url: claims.picture
      }
  else if (provider == 'spotify')
      profile = {
        display_name: claims.display_name,
        picture_url: claims.images[0].url
      }
  else return null
  // don't pass undefineds to D1 API
  for (const key of profileFields) {
    profile[key] = profile[key] ?? null
  }
  return profile
}
