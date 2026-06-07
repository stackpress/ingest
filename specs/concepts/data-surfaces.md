# Data Surfaces

Ingest uses callable nested structures throughout the framework. That is why `config`, `req.data`, `req.query`, `req.post`, `res.data`, and similar APIs feel related instead of behaving like separate utility types.

In this page, "data surfaces" just means "places where you read or write nested data."

## One underlying idea

Most of these data objects are built on the same primitive: a callable nested data structure. That gives them a few shared traits:

- you can call them like functions for the common read case
- you can still use methods like `get()`, `set()`, and `has()`
- they can hold nested data without forcing you to flatten everything into strings

That shared shape keeps app config, request data, and response metadata from feeling like unrelated APIs.

## Request-side data objects

The request has a few different data objects depending on what you are trying to read.

```typescript
app.post('/users/:id', async ({ req, res }) => {
  res.json({
    query: req.query(),
    post: req.post(),
    data: req.data()
  });
});
```

- `req.query()` is URL query data
- `req.post()` is parsed body data
- `req.data()` is the main request data object

In most route handlers, `req.data()` is the default choice because it is the merged view of request data. The narrower data objects are still useful when you need to be precise about where a value came from.

## How `req.data()` gets populated

`req.data()` is not just body data. It becomes the place where the rest of the request is assembled.

It can contain:

- query string values
- parsed body values
- route params like `:id`
- wildcard args from `*` and `**`
- extra values set by hooks or handlers

That is why a handler can often stay simple:

```typescript
app.post('/users/:id', ({ req, res }) => {
  res.json({
    id: req.data('id'),
    form: req.data()
  });
});
```

Under the hood, route params and wildcard args are pushed into `req.data()` during route matching. That keeps handlers from needing one API for body data and a different API for route data.

## Response-side data objects

The response has its own nested data objects too.

- `res.errors` is validation or field-level error detail
- `res.data()` is response-side metadata

`res.data()` is most useful when the route needs to pass extra values forward without mixing them into the actual result set.

```typescript
if (res.code === 200) {
  res.data.set('sessionId', 'abc123');
  res.data.set('sessionUser', 'John Doe');
}

res.results(results);
```

That pattern becomes especially useful in view rendering, where the template may need extra display data that should not be treated as the main payload.

## App-level data objects

The same idea shows up outside request and response objects.

```typescript
app.config.set('database', {
  host: 'localhost',
  port: 5432
});

const host = app.config('database', 'host');
```

`app.config` uses the same nested callable model as the request and response data objects. That consistency matters because configuration, request state, and response metadata all end up using the same mental model.

## Rule of thumb

- use `req.data()` by default in handlers
- use `req.query()` when the distinction from body data matters
- use `req.post()` when body-only semantics matter
- use `res.data()` for response metadata, especially rendering
- use `app.config()` for shared application and plugin configuration

If you want the lower-level primitive behind these data objects, see [Nest](../api/Nest.md).

## Read next

- [Request Lifecycle](./request-lifecycle.md)
- [Application Model](./application-model.md)
