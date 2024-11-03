import type { FC } from 'hono/jsx'

export type LoginLayoutProps = {
}
export const LoginLayout: FC<LoginLayoutProps> = (props: LoginLayoutProps) => (<>
  <div style="background:#f7f7f7">
    <div class="flex flex-col items-center justify-center min-h-screen py-2">
      <div class="mb-8 w-full sm:max-w-md mt-6 px-6 py-4 bg-white shadow-md overflow-hidden sm:rounded-lg">
        <button class="mx-2 text-3xl" style="position:absolute" hx-on:click="window.history.back()">←</button>
        <div class="flex items-center justify-center">
          <h2 class="pb-4 text-3xl font-extrabold text-gray-900">
            Sign in
          </h2>
        </div>
        <button class="gsi-material-button mb-2" style="width:100%"
            hx-on:click="location = '/login/google'">
          <div class="gsi-material-button-state">
          </div>
          <div class="gsi-material-button-content-wrapper">
            <div class="gsi-material-button-icon">
              {//TODO: host this as an asset
              }
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: block;"> <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path> <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path> <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path> <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path> <path fill="none" d="M0 0h48v48H0z"></path> </svg>
            </div>
            <span class="gsi-material-button-contents">Sign in with Google
            </span>
            <span class="gsi-material-button-icon"></span>
          </div>
        </button>
        <button class="gsi-material-button mb-2" style="width:100%"
            hx-on:click="location = '/login/spotify'">
          <div class="gsi-material-button-state"></div>
          <div class="gsi-material-button-content-wrapper">
            <div class="gsi-material-button-icon">
              <img src="/static/icon-spotify.svg" width="48px"></img>
            </div>
            <span class="gsi-material-button-contents">Sign in with Spotify</span>
            <span class="gsi-material-button-icon"></span>
          </div>
        </button>
        <button class="gsi-material-button mb-2" style="width:100%"
            disabled title="Coming soon"
            hx-on:click="location = '/login/apple'">
          <div class="gsi-material-button-state"></div>
          <div class="gsi-material-button-content-wrapper">
            <div class="gsi-material-button-icon">
              <img src="/static/icon-soundcloud.svg" width="48px"></img>
            </div>
            <span class="gsi-material-button-contents">Sign in with Apple</span>
            <span class="gsi-material-button-icon"></span>
          </div>
        </button>
        <button class="gsi-material-button mb-2" style="width:100%"
            disabled title="Coming soon"
            hx-on:click="location = '/login/soundcloud'">
          <div class="gsi-material-button-state"></div>
          <div class="gsi-material-button-content-wrapper">
            <div class="gsi-material-button-icon">
              <img src="/static/icon-soundcloud.svg" width="48px"></img>
            </div>
            <span class="gsi-material-button-contents">Sign in with Soundcloud</span>
            <span class="gsi-material-button-icon"></span>
          </div>
        </button>
        <button class="gsi-material-button mb-2" style="width:100%"
            disabled title="Coming soon"
            hx-on:click="location = '/login/tidal'">
          <div class="gsi-material-button-state"></div>
          <div class="gsi-material-button-content-wrapper">
            <div class="gsi-material-button-icon">
              <img src="/static/icon-tidal.svg" width="48px"></img>
            </div>
            <span class="gsi-material-button-contents">Sign in with Tidal</span>
            <span class="gsi-material-button-icon"></span>
          </div>
        </button>
        <button class="gsi-material-button mb-2" style="width:100%"
            disabled title="Coming soon"
            hx-on:click="location = '/login/deezer'">
          <div class="gsi-material-button-state"></div>
          <div class="gsi-material-button-content-wrapper">
            <div class="gsi-material-button-icon">
              <img src="/static/icon-deezer.svg" width="48px"></img>
            </div>
            <span class="gsi-material-button-contents">Sign in with Deezer</span>
            <span class="gsi-material-button-icon"></span>
          </div>
        </button>
        {/*<hr class="h-px mx-2 mb-2 bg-gray-400 border-0"/>
        <button disabled class="gsi-material-button mb-2" style="width:100%"
            hx-on:click="location = '/login/microsoft'">
          <div class="gsi-material-button-state"></div>
          <div class="gsi-material-button-content-wrapper">
            <div class="gsi-material-button-icon">
              <img src="/static/icon-onedrive.svg" width="48px"></img>
            </div>
            <span class="gsi-material-button-contents">Sign in with Microsoft (OneDrive)</span>
            <span class="gsi-material-button-icon"></span>
          </div>
        </button>
        <button class="gsi-material-button mb-2" style="width:100%"
            hx-on:click="location = '/login/dropbox'">
          <div class="gsi-material-button-state"></div>
          <div class="gsi-material-button-content-wrapper">
            <div class="gsi-material-button-icon">
              <img src="/static/icon-dropbox.png" width="48px"></img>
            </div>
            <span class="gsi-material-button-contents">Sign in with Dropbox</span>
            <span class="gsi-material-button-icon"></span>
          </div>
        </button>*/}
      </div>
    </div>
  </div>
  <a href="https://www.flaticon.com/free-icons/dropbox"
     style="position: fixed; bottom: 0; border-radius: .5rem;
            padding: .1rem .5rem .1rem .3rem;
            background: #e5e5e5; color: #555; font-size: .9rem;"
  >
    Dropbox icon created by Freepik - Flaticon
  </a>
</>)
export default LoginLayout
