import type { FC } from 'hono/jsx'
import PlayerIFrame from './player-iframe'

type PlayerProps = {
  title?: string,
  song?: string,
}
// Singleton #player component, should only have one on the page.
export const Player: FC<PlayerProps> = (props: PlayerProps) => {
  let title = props.title || "<Unable to determine title>"
  if (!props.song) {
    return (
      <div id="player" class="p-2">
        <h2 class="text-xl pb-2">
          {"<ERROR: Failed to load song>"}
        </h2>
      </div>
    )
  }
  let i = props.song.indexOf(':')
  let platform = props.song.substring(0, i)
  let slug = props.song.substring(i + 1)
  let video_iframes = ["youtube", "vimeo"]
  let small_widgets = ["archive", "link", "docs", "dropbox"]
  // TODO: what about archive.org videos and video links?
  // and what about the ability to hide video?
  return (
    <div id="player" class="p-2">
      { // ternary if-else
      !platform ? <>
        <h2 class="text-xl pb-2">
          No song selected
        </h2>
      </> : video_iframes.includes(platform) ? <>
          <h2 class="text-l px-1 pb-1">
            Playing from: <span class="font-bold">{props.title}</span>
          </h2>
          <PlayerIFrame platform={platform} slug={slug} />
      </> : small_widgets.includes(platform) ? <>
          <h2 class="text-xl pb-2">
            Playing from: <span class="font-bold">{props.title}</span>
          </h2>
          <PlayerIFrame platform={platform} slug={slug} />
      </> : /* medium iframes */ <>
          <h2 class="text-xl pb-2">
            Playing from: <span class="font-bold">{props.title}</span>
          </h2>
          <PlayerIFrame platform={platform} slug={slug} />
      </> }
    </div>
  )
}
export default Player


