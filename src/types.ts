export interface AppContext {
  Bindings: Env
  // Variables: Variables
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type Env = {
  DB: D1Database;
  WORKER_ENV: "production" | "development";
  WEB_DOMAIN: string;
  GOOGLE_OAUTH_CLIENT_ID: string;
  GOOGLE_OAUTH_CLIENT_SECRET: string;
  APPLE_CLIENT_ID: string;
  APPLE_PRIVATE_KEY: string;
  APPLE_TEAM_ID: string;
  APPLE_WEB_CLIENT_ID: string;
  APPLE_KEY_ID: string;
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
}

// eslint//-disable-next-line @typescript-eslint/consistent-type-definitions
//type Variables = {
//  db: Database;
//  user: (User & DatabaseUserAttributes) | null;
//  session: Session | null;
//  lucia: Lucia<DatabaseUserAttributes>;
//}

export type Bindings = {
  DB: D1Database
}

