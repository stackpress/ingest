# Application Model

Ingest is easiest to understand when you treat it as one application model that can run in a few different environments. Most of the framework stays the same even when the runtime, route source, or wiring style changes.

## The shape of an app

Most apps start with the same three pieces:

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

app.get('/users/:id', ({ req, res, ctx }) => {
  res.json({
    id: req.data('id'),
    hasPlugins: Boolean(ctx.plugins.size)
  });
});

app.create().listen(3000);
```

Even this small example already shows the main parts:

- `server()` creates the application
- `app.get()` registers a route
- the handler receives `{ req, res, ctx }`
- `req` and `res` are framework objects, not raw runtime objects

## Server and router

The `Server` is the top-level app object. It owns configuration, plugin loading, and runtime handling.

The `Router` is the part that knows how to:

- register routes
- match methods and paths
- compose route collections
- expose route metadata

Because `Server` extends `Router`, most application code works directly on `app`. You usually do not need to think about the inheritance boundary unless you are looking at the lower-level API.

That usually looks like this in practice:

```typescript
import { router, server } from '@stackpress/ingest/http';

const users = router();
users.get('/users/:id', ({ req, res }) => {
  res.json({ id: req.data('id') });
});

const app = server();
app.use(users);
app.create().listen(3000);
```

## Request and response

Ingest wraps runtime request and response objects so handlers can work with one consistent interface. That is why the same route shape can run in a local Node server or a WHATWG-style runtime without rewriting every handler.

The important idea is not just that "there is a wrapper." The wrapper gives you one shared handler interface. It reduces runtime lock-in and keeps handler code from depending on one host API everywhere.

That is why the same handler can move between runtime entrypoints without changing its internal shape:

```typescript
const userDetail = ({ req, res }) => {
  res.json({
    id: req.data('id'),
    method: req.method
  });
};

app.get('/users/:id', userDetail);
```

The request and response objects also share a common nested data model with config. That is why APIs like `req.data()`, `req.query()`, `req.post()`, `res.data()`, and `app.config()` feel related instead of behaving like separate mini-APIs.

## Handler props

Handlers receive one props object instead of positional arguments:

```typescript
app.get('/health', ({ req, res, ctx }) => {
  res.json({
    method: req.method,
    path: req.url.pathname,
    app: ctx.constructor.name
  });
});
```

This matters because the same handler shape works for:

- inline routes
- plugin-registered routes
- entry-file routes
- lazy imported routes

That keeps the route model stable even when the route source changes.

## Plugins are optional wiring

Plugins are optional, but they help keep unrelated setup from collapsing into one main file. You can still import routers, handlers, and services into a main file and wire everything together yourself. That is still a common way to build with Ingest.

```typescript
import type { HttpServer } from '@stackpress/ingest';

export default function auditPlugin(server: HttpServer) {
  server.on('request', ({ req }) => {
    console.log(req.method, req.url.pathname);
  });

  server.config.set('audit', { enabled: true });

  server.get('/health', ({ res }) => {
    res.json({ ok: true });
  });

  return { enabled: true };
}
```

What the plugin system adds is automatic wiring. Once loaded during `bootstrap()`, a plugin can:

- hook into the request lifecycle
- register routes
- write configuration
- expose reusable state through `server.plugin(...)`

This becomes useful when the main file starts collecting too many imports and setup steps. If you prefer explicit manual wiring, the framework still supports it.

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();
await app.bootstrap();

app.get('/audit', ({ res, ctx }) => {
  res.json({
    audit: ctx.config.get('audit'),
    plugin: ctx.plugin('audit')
  });
});
```

## What to keep in your head

If you only remember one mental model, use this one:

1. `Server` is the application.
2. `Router` is how requests get matched.
3. `{ req, res, ctx }` is the handler shape.
4. Plugins can automate wiring, but they are optional.
5. Adapters let the same app model run in different runtimes.

## Read next

- [Data Surfaces](./data-surfaces.md)
- [Request Lifecycle](./request-lifecycle.md)
- [Composition](./composition.md)
