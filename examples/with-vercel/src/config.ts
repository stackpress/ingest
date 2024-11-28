import type { CookieOptions, Pluggable } from '@stackpress/ingest';

const environment = process.env.SERVER_ENV || 'development';
const config: Config = {
  server: {
    cwd: process.cwd(),
    mode: environment,
    bodySize: 0
  },
  cookie: { path: '/' },
  body: { size: 0 }
};

export type Config = {
  server: {
    cwd: string,
    mode: string,
    bodySize: number
  },
  cookie: CookieOptions,
  body: {
    size: number
  }
};

export type App = Pluggable<Config>;

export default config;