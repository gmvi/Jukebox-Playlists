import { html } from 'hono/html'
import type { FC } from 'hono/jsx'

export type PlayerIFrameProps = {
  platfrom: string,
  slug: string,
}
export const PlayerIFrame: FC<PlayerIFrameProps> = (props: PlayerIFrameProps) => {
  // Minimum size recommended by youtube
  let width = "480px"
  let height = "270px"
  let mid_height = "170px" // soundcloud gets a larger artwork at this height
  let low_height = "54px" // chrome <audio> height
  // TODO: User toggle for seeing video vs album art thumbnails
  let src
  let audio_src
  let i
  //TODO: Add more platforms
  //TODO: double check terms and rules related to using these iframes
  switch (props.platform) {
    case 'youtube':
      src = `https://www.youtube.com/embed/${props.slug}?'`
      src += new URLSearchParams({
        enablejsapi: 1,
        autoplay: 1,
        if_load_policy: 3, // hide annotations
        //origin: 'https://example.com',
        rel: 0, // suggest videos only from same channel
        playsinline: 1, // required for non-fullscreen playback in iOS
      }).toString()
      return (
        <div id="player" class="mx-2">
          <iframe id={`player-iframe-${props.platform}`}
              src={src} width={width} height={height} frameborder="0"
              allow="autoplay; clipboard-write; fullscreen;"
              allowfullscreen //fallback
              type="text/html" 
              >
          </iframe>
        </div>
      )
    case 'spotify':
      src = `https://open.spotify.com/embed/track/${props.slug}`
      src += '?utm_source=generator'
      return (
        <div id="player" class="mx-4">
          <iframe id={`player-iframe-${props.platform}`}
              src={src} width="100%" height={mid_height} frameborder="0"
              style="border-radius: 12px" allowfullscreen="" 
              allow="autoplay; clipboard-write; encrypted-media;
                     fullscreen; picture-in-picture;"
              loading="lazy"
              >
          </iframe>
        </div>
      )
    case 'apple':
      src=`https://embed.music.apple.com/us/${props.slug}`
      return (
        <div id="player" class="mx-4">
          <iframe id={`player-iframe-${props.platform}`}
              src={src} height={mid_height} frameborder="0"
              style="width: 100%; overflow: hidden; border-radius: 10px;"
              allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
              sandbox="allow-forms allow-popups allow-same-origin allow-scripts
                       allow-storage-access-by-user-activation
                       allow-top-navigation-by-user-activation"
              >
          </iframe>
        </div>
      )
    case 'deezer':
      src=`https://widget.deezer.com/widget/auto/track/${props.slug}?autoplay=1`
      return (
          <div id="player" class="mx-4">
            <iframe id={`player-iframe-${props.platform}`} title="deezer-widget"
                src={src} width={mid_height} height={mid_height} frameborder="0"
                allowtransparency="true" allow="encrypted-media; clipboard-write; autoplay;"
                >
            </iframe>
          </div>
        )
    case 'bandcamp':
      // Doesn't allow autoplay, but I might be able to simulate a play-triggering
      // keyboard event, or ultimately public bandcamp track urls can be web-scraped,
      // and purchased tracks can be uploaded to dropbox
      src='https://bandcamp.com/EmbeddedPlayer/' + [
        'size=large',
        'bgcol=181a1b',
        'linkcol=056cc4',
        'tracklist=false',
        'minimal=true',
        `track=${props.slug}`,
        'transparent=false'
      ].join('/')
      return (
        <div id="player" class="mx-4">
          <iframe id={`player-iframe-${props.platform}`}
                  src={src} style={`width: ${mid_height}; height: ${mid_height}; border: 0;`}
                  seamless
                  allow="autoplay"
                  >
          </iframe>
        </div>
      )
    case 'soundcloud':
      // max height 174px
      src = 'https://w.soundcloud.com/player/?'
      src += new URLSearchParams({
        url: `https://api.soundcloud.com/tracks/${props.slug}`,
        color: '#ff5500',
        auto_play: true,
        hide_related: true,
        show_comments: true,
        show_user: true,
        show_reposts: false,
        show_teaser: false,
        //visual: true // check out what this is (copilot suggestion)
      }).toString()
      return (
        <iframe id={`player-iframe-${props.platform}`}
            src={src} width="100%" height={mid_height} frameborder="no"
            allow="autoplay"
            >
        </iframe>
      )
    case 'archive':
      // the archive.org iframe automatically mutes itself on my chrome (not ff)
      // The player should probably unmute a certain number of miliseconds after
      // starting playback :TODO:
      return (
        <iframe id={`player-iframe-${props.platform}`}
                src={`https://archive.org/embed/${props.slug}&autoplay=1`}
                width="100%" height={low_height} frameborder="0"
                webkitallowfullscreen="true" mozallowfullscreen="true"
                allowfullscreen
                allow="autoplay"
                >
        </iframe>
      )
    case 'vimeo':
      src=`https://player.vimeo.com/video/${props.slug}?autoplay=1&byline=0&portrait=0`
      return <>
        <iframe id={`player-iframe-${props.platform}`}
            src={src} frameborder="0"
            style={`width:${width}; height:${height};`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen
            >
        </iframe>
      </>
    case 'drive':
      src = `https://drive.google.com/file/d/${props.slug}`
      return <>
        <iframe id={`player-iframe-${props.platform}`}
            src={src} frameborder="0"
            width={width} height={low_height}
            allow="autoplay">
        </iframe>
      </>
    case 'mixcloud':
      let feed = encodeURIComponent(`/${props.slug}/`)
      src = `https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&light=1&autoplay=1&feed=${feed}`
      return <>
        <iframe id={`player-iframe-${props.platform}`}
          src={src} frameborder="0" 
          width="100%" height="120"
          allow="autoplay">
        </iframe>
      </>
  }
  // link-based platforms require a flag to know if it's video or audio
  if (![ 'dropbox', 'link' ].includes(props.platform)) {
    return (
      <div style={`width: 100%; height: ${mid_height};`} >
        Unknown platform: {props.platform}
      </div>
    )
  }
  i = props.slug.indexOf(':')
  let av = props.slug.substring(0, i)
  av = 'audio'
  let slug = props.slug.substring(i + 1)
  switch (props.platform) {
    case 'dropbox':
      src = `https://dl.dropbox.com/scl/fi/${slug}&raw=1`
      break
    case 'link':
      src = slug
      break
  }
  if (av[0] == 'a') {
    return <>
      <audio id="player-audio-link" style={`height: ${low_height}`}
          controls autoplay
          >
        <source src={src} />
        Your browser does not support the audio element.
      </audio>
      {html`
      <!-- <script>
        audio = document.getElementById('player-audio-link')
        console.log(audio)
        audio.addEventListener('load', e => console.log('load'))
        audio.addEventListener('waiting', e => console.log('waiting'))
        audio.pause()
        audio.play()
      </script> -->
      `}
    </>
  } else { // av[0] == 'v'
    return <>
      <video id="player-video-link" style={`height: ${height}`}
          controls autoplay
          >
        <source src={src} />
        Your browser does not support the video element.
      </video>
    </>
  }
  /* TODO: Add more platforms
   * jellyfin
   * audiomack
   * mixcloud
   * tidal
   * qobuz
   * amazon
   * plex?
   * twitch vods?
   * box.com does not allow direct links or embedding
   *    can we stick the whole page in a frame and simulate spacebar?
   */
}
export default PlayerIFrame
