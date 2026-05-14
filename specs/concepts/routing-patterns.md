# Routing Patterns

Routing is one of Ingest’s strongest ideas because the framework supports several route-definition styles without changing the handler model. You can change where a route comes from without changing how the route behaves once it runs.

## The common handler shape

No matter how a route is declared, the useful target is still the same props-based action:

```typescript
({ req, res, ctx }) => {
  res.setJSON({ path: req.url.pathname });
}
```

That consistency makes the routing modes feel like variations of one system instead of unrelated features. It prevents the framework from drifting into several incompatible route APIs as the project scales.

## Inline action routes

Use inline routes when the handler is short and local readability matters most.

```typescript
app.get('/users/:id', ({ req, res }) => {
  res.setJSON({ id: req.data('id') });
});
```

Inline routes solve the straightforward case without requiring a file, import boundary, or plugin when the behavior is small and local.

## Entry-file routes

Use entry routes when you want route ownership to map directly to files.

```typescript
app.entry.get('/users/:id', './routes/user.js');
```

```typescript
// ./routes/user.js
export default function UserDetail({ req, res }) {
  res.setJSON({ id: req.data('id') });
}
```

This pattern is useful when the filesystem is part of how the app is organized or built. It keeps route ownership explicit, reduces the chance that one registration file turns into a large aggregation point, and gives build tooling a stable route-to-file map.

## Lazy import routes

Use import routes when handlers should load on demand or when tooling needs to see import boundaries directly.

```typescript
app.import.get('/users', () => import('./routes/users.js'));
```

```typescript
// ./routes/users.js
export default function UsersIndex({ res }) {
  res.setResults([
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Grace' }
  ]);
}
```

This pattern matters for:

- lazy loading
- server build scripts
- deployment packaging
- route-aware tooling

Import routes solve more than load timing. They make route module boundaries visible to tooling so large projects can package, inspect, or deploy them more deliberately.

```typescript
console.log(app.imports);
// [
//   ['GET /users', [{ priority: 0 }]]
// ]
```

## View routes

Attach a template engine and use view routes to automatically render template files.

```typescript
app.view.engine = async (filePath, req, res) => {
  const html = await renderTemplate(filePath, req.data());
  res.setHTML(html);
};

app.view.get('/profile', './views/profile.hbs');
```

View routes keep template lookup connected to routing so simple rendered pages do not need to repeat the same rendering boilerplate in every handler.

## Route matching and composition

Underneath these styles, Ingest routes are still regular router entries. That means you keep the same matching features, route parameters, wildcards, and router composition regardless of the route source.

```typescript
app.post('/users/:id', ({ req, res }) => {
  res.setJSON({ id: req.data('id') });
});

app.put('/files/*', ({ req, res }) => {
  res.setJSON({ args: req.data() });
});

app.get('/assets/**', ({ req, res }) => {
  res.setJSON({ args: req.data() });
});
```

The matching behavior comes from `ExpressEmitter`, which supports:

- `:name` for named parameters
- `*` for one path segment
- `**` for the rest of a path

Wildcard matches are pushed into request data as positional args rather than named params.

For example, `GET /files/report.pdf` can produce:

```typescript
req.data()
// { '0': 'report.pdf' }
```

While `GET /assets/images/icons/logo.png` can produce:

```typescript
req.data()
// { '0': 'images/icons/logo.png' }
```

Flexible matching and router composition help large apps evolve route structure without forcing everything into one flat route table.

```typescript
const admin = router();
admin.get('/admin/users/:id', ({ req, res }) => {
  res.setJSON({ id: req.data('id') });
});

app.use(admin);
```

## How to choose

- choose inline routes for directness
- choose entry routes for file-driven structure
- choose import routes for lazy loading and tooling
- choose view routes for template-first pages

## Read next

- [Composition](./composition.md)
- [Runtimes and Tooling](./runtimes-and-tooling.md)
