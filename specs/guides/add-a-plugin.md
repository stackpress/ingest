# Add a Plugin

This guide shows the shortest path to a working plugin.

The plugin system is recommended when you want the framework to handle wiring for you, but it is optional. You can still wire everything manually in a main file if you prefer.
Plugins matter once the main app file starts collecting hooks, service setup, config, and route registration for unrelated concerns.

## Manual wiring without plugins

This is a valid approach, but it usually becomes noisy as the app grows because one file starts collecting route imports, hook setup, shared services, and configuration.

```typescript
import { server } from '@stackpress/ingest/http';
import auditRoutes from './routes/audit';
import userRoutes from './routes/users';
import createDatabase from './services/database';

const app = server();
const database = createDatabase();

app.config.set('users', { enabled: true });

app.on('request', ({ req }) => {
  console.log(req.method, req.url.pathname);
});

app.on('error', ({ req, res }) => {
  console.error('failed', req.url.pathname, res.error);
});

app.register('database', database);
app.use(auditRoutes);
app.use(userRoutes);

app.create().listen(3000);
```

The plugin version moves that wiring into feature-level units so the main file does not have to own unrelated setup. In some applications, that also reduces the need for a large bootstrap file at all.

## Create the plugin

```typescript
import type { HttpServer } from '@stackpress/ingest';
import createDatabase from '../services/database';

export default function auditPlugin(server: HttpServer) {
  const database = createDatabase();

  server.config.set('audit', {
    enabled: true,
    channel: 'stdout'
  });

  server.on('request', ({ req }) => {
    console.log(req.method, req.url.pathname);
  });

  server.on('error', ({ req, res }) => {
    console.error('failed', req.url.pathname, res.error);
  });

  server.get('/health', ({ res }) => {
    res.json({ ok: true, audit: server.config.get('audit') });
  });

  server.register('database', database);

  return { database };
}
```

## Register it

Add the plugin entry to `package.json`:

```json
{
  "plugins": [
    "./src/plugins/audit"
  ]
}
```

## Bootstrap the server

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();
await app.bootstrap();

app.get('/db-check', ({ res, ctx }) => {
  const plugin = ctx.plugin('audit');
  res.json({ hasDatabase: Boolean(plugin?.database) });
});

app.create().listen(3000);
```

## Verify it worked

1. Start the server.
2. Request `GET /health`.
3. Confirm the response and request log.

## Read next

- [Composition](../concepts/composition.md)
- [Server](../api/Server.md)
- [Loader](../api/Loader.md)
