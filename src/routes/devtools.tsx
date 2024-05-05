import { Hono } from 'hono'

import { RequireLogin } from '../auth'

export const router = new Hono()
export default router
router.mountpoint = '/dev'

router.get('/', async (c) => {
  return c.html(<div>
    <h1>Devtools</h1>
    <p>TODO: Add devtools here</p>
  </div>)
})

router.get('/test', RequireLogin, async (c) => {
  return c.html(<div> <h1>Test</h1> </div>)
})
