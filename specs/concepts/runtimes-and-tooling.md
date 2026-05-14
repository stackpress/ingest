# Runtimes and Tooling

Ingest keeps the application model stable by moving runtime-specific behavior into adapters and by exposing route metadata to tools. That lets the app stay recognizable even when the hosting environment or build process changes.

## Two main runtime shapes

The repo ships two main entrypoints:

```typescript
import { server as httpServer } from '@stackpress/ingest/http';
import { server as whatwgServer } from '@stackpress/ingest/whatwg';
```

Use the HTTP entrypoint when you want a long-lived Node server:

```typescript
const app = httpServer();
app.create().listen(3000);
```

Use the WHATWG entrypoint when your platform already thinks in terms of `Request` and `Response`:

```typescript
const app = whatwgServer();

export default function handle(request: Request) {
  return app.handle(request, undefined);
}
```

These runtime shapes exist so application code can stay mostly stable while deployment targets change.

## What adapters are doing

Adapters handle the runtime boundary:

- converting runtime input into the framework request flow
- creating or dispatching the correct response shape
- keeping route handlers portable

The application still thinks in terms of `server`, `router`, plugins, and `{ req, res, ctx }`.

Adapters keep environment-specific branching near the runtime boundary instead of spreading it through handlers and services. They also own request-body loading, cookie/session translation, and the final dispatch rules for strings, JSON payloads, redirects, and streams.

## Error handling belongs here too

Error handling is part of the runtime story because a thrown error still has to become a coherent response. Ingest routes failures through its response/error model so plugins and handlers can stay inside one lifecycle.

```typescript
app.get('/boom', () => {
  throw new Error('Something failed');
});

app.on('error', ({ req, res }) => {
  console.error('failed', req.url.pathname);
  res.status = 500;
});
```

The important point is that the runtime adapter still gets a coherent response object back instead of an unshaped thrown value. That keeps runtime dispatch predictable even when route code or hooks fail.

There are still a few runtime differences worth knowing. The HTTP adapter can enforce request body size limits through its loader, while the WHATWG adapter does not yet do that internally. The WHATWG adapter can also return an already-built native `Response` directly when a route sets one on `res.resource`.

## Tooling is a first-class concern

Ingest also exposes routing metadata:

```typescript
const app = httpServer();
app.import.get('/users', () => import('./routes/users.js'));

console.log(app.routes);
console.log(app.imports);
console.log(app.entries);
console.log(app.views);
console.log(app.listeners);
```

For example:

```typescript
import { Router } from '@stackpress/ingest';

const app = new Router();
app.get('/users/:id', ({ res }) => res.setJSON({ ok: true }));
app.import.get('/lazy', () => import('./routes/users.js'));
app.entry.get('/entry/:id', './routes/user.js');
app.view.get('/profile', './views/profile.hbs');
app.on('request', ({ req }) => console.log(req.url.pathname));
```

The metadata shape looks like this:

```json
{
  "routes": [
    ["/^GET \\/users\\/([^/]+)\\/*$/g", { "method": "GET", "path": "/users/:id" }],
    ["GET /lazy", { "method": "GET", "path": "/lazy" }],
    ["/^GET \\/entry\\/([^/]+)\\/*$/g", { "method": "GET", "path": "/entry/:id" }],
    ["GET /profile", { "method": "GET", "path": "/profile" }]
  ],
  "imports": [
    ["GET /lazy", [{ "priority": 0 }]]
  ],
  "entries": [
    ["/^GET \\/entry\\/([^/]+)\\/*$/g", [{ "entry": "./routes/user.js", "priority": 0 }]]
  ],
  "views": [
    ["GET /profile", [{ "entry": "./views/profile.hbs", "priority": 0 }]]
  ],
  "listeners": [
    [
      "/^GET \\/users\\/([^/]+)\\/*$/g",
      [{ "item": [Handler], "priority": 0 }]
    ],
    [
      "GET /lazy",
      [{ "item": [Handler], "priority": 0 }]
    ],
    [
      "/^GET \\/entry\\/([^/]+)\\/*$/g",
      [{ "item": [Handler], "priority": 0 }]
    ],
    [
      "GET /profile",
      [{ "item": [Handler], "priority": 0 }]
    ],
    [
      "request",
      [{ "item": [Handler], "priority": 0 }]
    ]
  ]
}
```

That metadata is useful for:

- route-aware bundling
- deployment artifact generation
- static manifests
- inspecting lazy-loaded route boundaries

Large projects often need their builders and deployment scripts to understand application structure. Exposed route metadata makes that possible without reverse-engineering the codebase.

## Read next

- [API Reference](../api/README.md)
- [Examples](../examples.md)
