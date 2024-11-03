import { html } from 'hono/html'
import type { FC } from 'hono/jsx'
import { useRequestContext } from 'hono/jsx-renderer'
import type { User } from '../datamodels'

export const AccountMenu: FC = () => {
  let user = useRequestContext().get('user')
  console.log('User:', user)
  if (user) {
    return (
      <button class="text-md font-semibold text-gray-900"
          hx-delete="/login" hx-swap="none"
          _="on htmx:afterRequest reload() the location"
      >
        Sign Out
      </button>
    )
  }
  return (
    <a class="text-md font-semibold text-gray-900" href="/login">Sign In &rarr;</a>
  )
}
export default AccountMenu;
