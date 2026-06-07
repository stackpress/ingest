# ExpressEmitter

`ExpressEmitter` is the event-pattern primitive underneath Ingest routing. `ActionRouter` extends it directly, which is why route patterns, wildcards, and named params behave the way they do.

This class lives in `@stackpress/lib`, not in Ingest itself, but it explains a large part of how route matching works.

```typescript
import ExpressEmitter from '@stackpress/lib/ExpressEmitter';

const emitter = new ExpressEmitter('/');
```

## Why it matters in Ingest

Ingest routes are event matches.

`ActionRouter` turns routes like `GET /users/:id` into event patterns and then lets `ExpressEmitter` do the matching and extraction work.

```typescript
router.get('/users/:id', ({ req, res }) => {
  res.json({ id: req.data('id') });
});

router.get('/files/*', ({ req, res }) => {
  res.json({ args: req.data() });
});

router.get('/assets/**', ({ req, res }) => {
  res.json({ args: req.data() });
});
```

## Pattern types

The important pattern shapes are:

- `:name` for named params
- `*` for one path segment
- `**` for the rest of a path

Those patterns are converted into regular expressions and stored as event expressions.

## What it extracts

When an event matches:

- named params become `data.params`
- wildcard matches become `data.args`

In Ingest, `ActionRouter` then merges those into `req.data()`, which is why route handlers usually read params directly from the main request data object instead of from a separate matcher object.

## Matching example

```typescript
router.get('/users/:id', ({ req, res }) => {
  res.json({
    id: req.data('id')
  });
});

router.get('/files/*', ({ req, res }) => {
  res.json({
    pathPart: req.data('0')
  });
});
```

That behavior comes from the underlying event match, not from a separate route-param subsystem.

## Expressions and listeners

`ExpressEmitter` also explains two maps that show up in the router API:

- `expressions`
- `listeners`

```typescript
console.log(router.expressions);
console.log(router.listeners);
```

`expressions` holds the compiled route patterns. `listeners` holds the task queues attached to those events. Together, those structures are what make route introspection and tooling possible.

## Relation to ActionRouter

`ActionRouter` adds three important pieces on top of `ExpressEmitter`:

- HTTP method route helpers like `get()` and `post()`
- request/response props creation
- merging matched params and args into `req.data()`

So if you want to understand route syntax, pattern matching, or event priority behavior, `ExpressEmitter` is the right primitive to keep in mind. If you want the framework-level handler model, go back up to [ActionRouter](./ActionRouter.md) and [Router](./Router.md).

## Read next

- [ActionRouter](./ActionRouter.md)
- [Router](./Router.md)
- [Routing Patterns](../concepts/routing-patterns.md)
