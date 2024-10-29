import type { FC } from 'hono/jsx'

import AccountMenu from '../components/account-menu'
import Playlist from '../components/playlist'
import Player from '../components/player'

export type PlaylistLayoutProps = {
  data_id: string
  title: string
  tracks: PlaylistTrack[]
  position: number
}
export const PlaylistLayout: FC<PlaylistLayoutProps> =
  (props: PlaylistLayoutProps) => <>
    <div class="m-4" style="margin-bottom: 360px">
      <nav class="flex text-2xl font-bold mb-4">
        <div class="flex flex-1">
          <a href="/"></a>
        </div>
        <div class="flex gap-x-12">
          <a href="/">Cross-platform Playlist Demo</a>
        </div>
        <div class="flex flex-1 justify-end">
          <AccountMenu />
        </div>
      </nav>
      <Playlist data_id={props.data_id} title={props.title} tracks={props.tracks} />
    </div>
    <footer class="w-full bg-slate-300 fixed inset-x-0 bottom-0">
      <Player title={props.title} song={props.tracks[props.position]} />
    </footer>
  </>
export default PlaylistLayout
