import { Buffer } from "node:buffer";

import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity'

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

export async function createId(length: number, validatorFn: (candidate: string) => Promise<boolean>) {
  while (1) {
    const bytes = new Uint8Array(Math.ceil(length/4)*3)
    crypto.getRandomValues(bytes)
    let id = Buffer.from(bytes).toString('base64').substring(0, length)
    id = id.replace(/\//g, '_').replace(/\+/g, '-')
    if (checkBadWords(id)) continue
    if (!validatorFn || await validatorFn(id)) return id
  }
}

const dataset = englishDataset
const matcher = new RegExpMatcher({ ...dataset.build(), ...englishRecommendedTransformers })
const checkBadWords = (s: string) => matcher.hasMatch(s)
