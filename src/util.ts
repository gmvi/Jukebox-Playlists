import { env } from "hono/adapter"

export function isProd() {
  return env.ENVIRONMENT == 'production'
}

