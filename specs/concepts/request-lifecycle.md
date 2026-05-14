# Request Lifecycle

Ingest treats a request as a sequence of phases rather than as a single callback. Once that sequence is clear, the rest of the framework becomes easier to follow because routes, plugins, adapters, and error handling all plug into the same flow.

## One request, end to end

This example shows the three most important phases:

```typescript
app.on('request', ({ req }) => {
  console.log('incoming', req.method, req.url.pathname);
});

app.get('/users/:id', ({ req, res }) => {
  res.setJSON({ id: req.data('id') });
});

app.on('response', ({ res }) => {
  console.log('outgoing', res.code);
});
```

When `GET /users/42` arrives, the flow is:

1. the adapter receives runtime input
2. Ingest prepares framework request and response objects
3. the adapter loads the request body into the framework request model
4. `request` listeners run
5. the route matches and executes
6. `response` listeners run
7. the runtime gets the final response back

## Phase 1: adapter boundary

The adapter is the first thing that sees the native runtime input. Its job is to translate that input into the framework request flow so the rest of the application does not need to care whether the runtime is Node HTTP or WHATWG-style. This boundary keeps runtime-specific branching from leaking across the whole application, including request parsing, cookie reads, and response writing.

## Phase 2: request hooks

`request` hooks run before the matched route executes.

```typescript
app.on('request', ({ req, res }) => {
  if (!req.headers.get('authorization')) {
    res.setError('Unauthorized', {}, [], 401);
    return false;
  }

  return true;
});
```

Use this phase for auth, request logging, early validation, or any decision that should happen before the route body runs. It keeps cross-cutting concerns out of every handler and makes the pre-route flow easier to reason about.

## Phase 3: route execution

Once the request phase allows execution to continue, the router matches the method and path and calls the route action.

```typescript
app.get('/users/:id', ({ req, res }) => {
  const id = req.data('id');
  res.setJSON({ id });
});
```

At this point the handler can set JSON, HTML, redirects, or errors. Keeping this phase narrow lets the route action stay focused on request-specific behavior instead of also owning setup and teardown concerns.

This is also where catch-all routes such as `/**` become useful. They let a project shape its own fallback behavior without needing a separate 404 subsystem.

```typescript
app.get('/**', ({ res }) => {
  if (!res.code && !res.status && !res.sent) {
    res.setHTML('Not Found', 404, 'Not Found');
  }
});
```

## Phase 4: response hooks

After the route finishes, `response` hooks run.

```typescript
app.on('response', ({ req, res }) => {
  console.log(req.url.pathname, res.code);
});
```

Use this phase for logging, response decoration, or final normalization. It prevents repeated post-processing logic from being copied into multiple handlers.

## Error flow

If a hook or route throws, Ingest upgrades the failure into its response/error model and sends it through the error path.

```typescript
app.get('/boom', () => {
  throw new Error('Something failed');
});

app.on('error', ({ req, res }) => {
  console.error('failed', req.url.pathname, res.error);
  if (!res.code) {
    res.setError('Internal Server Error', {}, [], 500);
  }
});
```

The important idea is that failures stay inside the same lifecycle instead of becoming a separate ad hoc system. That keeps error handling consistent and makes failures visible to the same extension points that handle the success path, whether the problem is a thrown exception, a validation failure, or an unmatched route.

Once that lifecycle is clear, plugins, adapters, and route styles all become easier to reason about because they are all participating in the same execution model.

## Read next

- [Application Model](./application-model.md)
- [Composition](./composition.md)
