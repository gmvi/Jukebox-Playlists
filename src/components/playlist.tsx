import type { FC } from 'hono/jsx'

export type PlaylistProps = {
  id: number,
  title: string,
  tracks: string[],
}
export const Playlist: FC<PlaylistProps> = (props: PlaylistProps) => (
  <div>
    {props.tracks.results.map(track => {
      let i = track.song.indexOf(':')
      let platform = track.song.substring(0, i)
      let slug = track.song.substring(i + 1)
      let dangerousTitle = { __html: track.override_title }
      let get_url = `/player/${platform}:${encodeURIComponent(slug)}`
      get_url += `?playlist_title=${props.title}`
      return (
        <p class="flex row items-center justify-between py-1 px-4 my-1 rounded-lg
                  text-sm border bg-gray-100 text-gray-600 mb-2" >
          <button class="font-medium"
                  hx-get={get_url} hx-target="#player" hx-swap="outerHTML"
            /* TODO: hack for testing; remove it
             * >{track.override_title}</button>
             */
            dangerouslySetInnerHTML={dangerousTitle}
          ></button>
          <button class="font-medium"
                  hx-delete={`/playlist/${props.id}/${track.position}`}
                  hx-target="closest p" hx-swap="outerHTML" >
            Delete
          </button>
        </p>
      )
    })}
  </div>
)
export default Playlist
