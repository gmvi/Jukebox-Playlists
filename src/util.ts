import { Buffer } from "node:buffer";
export function memoize_ctx(fn) { let res; return (c) => res ?? (res = fn(c)) }

const VALID_DEPLOY = ["jukebox-playlists.george-matter-vi.workers.dev"]
export const ORIGIN = memoize_ctx((c) => {
  if (isProd(c)) {
    if (!VALID_DEPLOY.includes(c.env.DEPLOY_HOSTNAME)) {
      return `https://${VALID_DEPLOY[0]}`
    }
    return `https://${c.env.DEPLOY_HOSTNAME}`
  }
  return `http://localhost:${c.env.DEV_PORT ?? 8787}`
})

export function isProd(c) {
  return c.env.ENVIRONMENT == 'production'
}

export function createId(length: number, validatorFn: (candidate: string) => boolean) {
  while (1) {
    const bytes = new Uint8Array(Math.ceil(length/4)*3)
    crypto.getRandomValues(bytes)
    let id = Buffer.from(bytes).toString('base64').substring(0, length)
    id = id.replace(/\//g, '_').replace(/\+/g, '-')
    if (!validatorFn || validatorFn(id)) {
      return id
    }
  }
}
