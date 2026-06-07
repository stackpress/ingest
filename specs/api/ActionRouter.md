# ActionRouter

`ActionRouter` is the event-driven router behind the higher-level `Router` API. It accepts props-based handlers and exposes entry, import, and view routing helpers.

```typescript
import { ActionRouter } from '@stackpress/ingest';

const router = new ActionRouter({ appName: 'example' });

router.get('/users/:id', ({ req, res, ctx }) => {
  res.json({
    id: req.data('id'),
    app: ctx.appName
  });
});
```

## Constructor

```typescript
const router = new ActionRouter(context);
```

`context` is stored on the router and passed to handlers as `ctx`. `ActionRouter` provides one direct, props-based routing model that can also host entry, import, and view helpers without changing the handler shape.

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `context` | `X` | Context passed to route handlers |
| `routes` | `Map<string, Route>` | Registered route metadata |
| `entry` | `EntryRouter<R, S, X>` | Entry-file routing helper |
| `import` | `ImportRouter<R, S, X>` | Dynamic import routing helper for lazy loading and tooling |
| `view` | `ViewRouter<R, S, X>` | Template routing helper |

## Route methods

Use the HTTP verb helpers or `route()` to register handlers.

```typescript
router.get('/users', ({ res }) => {
  res.json({ users: [] });
});

router.patch('/users/:id', ({ req, res }) => {
  res.json({ id: req.data('id'), patched: true });
});

router.options('/users', ({ res }) => {
  res.json({ allow: ['GET', 'POST', 'PATCH', 'OPTIONS'] });
});

router.head('/users', ({ res }) => {
  res.code = 200;
});

router.post('/users', async ({ req, res }) => {
  await req.load();
  res.json({ created: req.data() }, 201);
});

router.all('/health', ({ res }) => {
  res.json({ ok: true });
});
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `path` | `string` | Route path |
| `action` | `ActionRouterAction<R, S, X>` | Props-based route handler |
| `priority` | `number` | Optional listener priority. Can be negative. Higher numbers run first, then ties follow definition order. |

### Returns

The verb helpers ultimately return the route metadata created by `route()`: method, path, and listener details.

## Event methods

### `emit(event, req, res)`

Runs the matching route tasks for an event string.

```typescript
const status = await router.emit('GET /users/123', request, response);
```

### `eventName(method, path)`

Builds the internal event name used for matching.

```typescript
const event = router.eventName('GET', '/users/:id');
```

### `use(otherRouter)`

Merges another `ActionRouter` into the current one.

```typescript
const api = new ActionRouter(context);
api.get('/api/health', ({ res }) => res.json({ ok: true }));

router.use(api);
```

## Routing modes

### Inline handlers

```typescript
router.get('/users', ({ res }) => {
  res.json({ users: [] });
});
```

### Entry files

Entry routes point to a module path. The default export receives a single props object.

```typescript
router.entry.get('/users/:id', './routes/user.js');
```

```typescript
// ./routes/user.js
export default function UserDetail({ req, res }) {
  res.json({ id: req.data('id') });
}
```

### Lazy imports

```typescript
router.import.get('/users', () => import('./routes/users.js'));
```

This mode is useful for lazy loading, but it is also useful when builders need explicit route import boundaries.

### View routes

```typescript
router.view.render = async (filePath, props) => {
  return await renderTemplate(filePath, props);
};

router.view.engine = async (filePath, { req, res, ctx }) => {
  const props = res.data();
  const html = await router.view.render(filePath, {
    ...req.data(),
    props
  });
  res.html(html);
};

router.view.get('/profile', './views/profile.hbs');
```

## Example

```typescript
import { ActionRouter } from '@stackpress/ingest';

const router = new ActionRouter({ version: '1.0.0' });

router.get('/health', ({ res, ctx }) => {
  res.json({ ok: true, version: ctx.version });
});

router.get('/users/:id', ({ req, res }) => {
  res.json({ id: req.data('id') });
});
```

## Related

- [Router](./Router.md)
- [EntryRouter](./EntryRouter.md)
- [ImportRouter](./ImportRouter.md)
- [ViewRouter](./ViewRouter.md)
