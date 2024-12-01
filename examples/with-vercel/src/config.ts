export const environment = process.env.SERVER_ENV || 'development';
export const config = {
  server: {
    cwd: process.cwd(),
    mode: environment,
    bodySize: 0
  },
  cookie: { path: '/' },
  body: { size: 0 }
};