import type { VercelFactory } from '@stackpress/ingest-vercel';

export type Config = {
  server: {
    cwd: string,
    mode: string,
  },
  cookie: {
    path: string
  },
  body: {
    size: number
  }
};

export type VercelApp = VercelFactory<Config>;