# Composition

Ingest composes applications through plugins, routers, configuration, and reusable plugin state. The goal is to keep features modular without forcing everything into one bootstrap file.

## Plugins do most of the assembly work

One common Ingest composition pattern is: create a server, load plugins, and let those plugins attach behavior.

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();
await app.bootstrap();
app.create().listen(3000);
```

A plugin can register routes, hooks, config defaults, and services:

```typescript
import type { HttpServer } from '@stackpress/ingest';

export default function usersPlugin(server: HttpServer) {
  server.config.set('users', { enabled: true });

  server.get('/users', ({ res }) => {
    res.setJSON({ users: [] });
  });

  return {
    findAll() {
      return [];
    }
  };
}
```

This pattern keeps large apps from centralizing too much setup in one place. It lets features carry their own routes, hooks, config, and reusable services.

## Shared config is part of composition

Config is shared state. It lets plugins and routes cooperate without hard-coding everything into one file.

```typescript
server.config.set('app', {
  name: 'My App',
  features: { audit: true }
});

server.get('/feature-flags', ({ res, ctx }) => {
  res.setJSON({
    features: ctx.config.get('app', 'features')
  });
});
```

That matters because plugins often do two jobs at once:

- define behavior
- define the configuration that behavior depends on

Shared config reduces duplicated setup and avoids hard-coding environment or feature decisions into every route.

## Reusable plugin state

If a plugin returns an object, other parts of the app can consume it through `server.plugin(name)`.

```typescript
const users = server.plugin<{ findAll(): unknown[] }>('src/plugins/users');

server.get('/users', ({ res }) => {
  const results = users.findAll();
  res.setResults(results);
});
```

This gives Ingest a lightweight service model without requiring a larger dependency injection container. It also helps avoid repeated service construction and the spread of cross-feature imports through unrelated modules.

## Routers also compose

Composition is not limited to plugins. Routers can also be built separately and merged.

```typescript
import { router } from '@stackpress/ingest/http';

const pages = router();
pages.get('/', ({ res }) => res.setHTML('<h1>Home</h1>'));

const api = router();
api.get('/users', ({ res }) => res.setJSON({ users: [] }));

app.use(pages).use(api);
```

This is useful when route ownership belongs to a feature, while plugin ownership belongs to a cross-cutting concern.

## When to use what

- use a plugin when the behavior spans hooks, config, routes, or services
- use a router when the main job is to group routes
- use config when behavior needs shared settings
- use plugin return values when multiple parts of the app need the same service

## Read next

- [Routing Patterns](./routing-patterns.md)
- [Runtimes and Tooling](./runtimes-and-tooling.md)
