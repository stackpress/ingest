# Create a Server

This guide shows the shortest path to a running Ingest app. It establishes the smallest viable application shape before the docs introduce plugins, route composition, or runtime-specific concerns.

## HTTP server

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

app.get('/', ({ res }) => {
  res.html('<h1>Hello World</h1>');
});

app.create().listen(3000);
```

## WHATWG-style server handler

```typescript
import { server } from '@stackpress/ingest/whatwg';

const app = server();

app.get('/health', ({ res }) => {
  res.json({ ok: true });
});

export default function handle(request: Request) {
  return app.handle(request, undefined);
}
```

## Read next

- [Application Model](../concepts/application-model.md)
- [Runtimes and Tooling](../concepts/runtimes-and-tooling.md)
