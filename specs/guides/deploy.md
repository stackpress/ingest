# Deploy an App

Deployment in Ingest is mostly about choosing the right adapter and runtime entrypoint shape. The goal is to keep deployment concerns close to the runtime boundary instead of leaking them across handler code.

## Local or long-lived Node server

Use the HTTP entrypoint:

```typescript
import { server } from '@stackpress/ingest/http';
```

## WHATWG or serverless-style runtime

Use the WHATWG entrypoint:

```typescript
import { server } from '@stackpress/ingest/whatwg';
```

Some platforms hand you a WHATWG `Request` directly, while others give you an event object that you translate into one. The application model stays the same either way, but the entrypoint glue changes:

- Vercel-style handlers can often pass the request through directly
- Netlify-style handlers often build a `Request`, call `app.handle(...)`, then translate the response back into the platform result shape
- event-driven runtimes may need a small boundary layer even when the app itself still uses the WHATWG server

On platforms that already give you a WHATWG request, the boundary is small:

```typescript
import { server } from '@stackpress/ingest/whatwg';

const app = server({ cwd: process.cwd() });

export default async function handle(request: Request) {
  await app.bootstrap();
  return app.handle(request, undefined);
}
```

On platforms that give you an event object, the boundary usually converts in and out:

```typescript
import { server } from '@stackpress/ingest/whatwg';

export async function handler(event: any) {
  const app = server();
  await app.bootstrap();

  const request = new Request(event.rawUrl, {
    method: event.httpMethod,
    headers: event.headers
  });

  const response = await app.handle(request, undefined);

  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text()
  };
}
```

Some runtimes need an even thinner bridge because the host callback shape is not WHATWG-native:

```typescript
import { server } from '@stackpress/ingest/whatwg';

const app = server();

export async function lambdaHandler(event: any) {
  const request = new Request(event.url, {
    method: event.method,
    headers: event.headers
  });

  const response = await app.handle(request, undefined);
  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text()
  };
}
```

## Verify platform wiring against examples

Once the concepts are clear, use the example workspaces to confirm the correct runtime entrypoint shape:

- [`with-vercel`](../../examples/with-vercel)
- [`with-netlify`](../../examples/with-netlify)
- [`with-lambda`](../../examples/with-lambda)
- [`with-google`](../../examples/with-google)

## Read next

- [Runtimes and Tooling](../concepts/runtimes-and-tooling.md)
- [Examples](../examples.md)
