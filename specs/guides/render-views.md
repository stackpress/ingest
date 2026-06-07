# Render Views

Use view routes when a route primarily exists to render a template. They help keep rendering code from being duplicated across handlers by giving routing and rendering one shared pattern.

## Example

```typescript
app.view.render = async (filePath, props) => {
  return await renderTemplate(filePath, props);
};

app.view.engine = async (filePath, { req, res, ctx }) => {
  const html = await app.view.render(filePath, req.data());
  res.html(html);
};

app.view.get('/profile', './views/profile.hbs');
```

This split is useful because `render` becomes the reusable primitive while `engine` becomes the route-facing adapter that writes to the response.

## Response data for templates

`res.data()` is useful when a handler needs to pass view-only values into the template without mixing them into the real result set.

```typescript
app.view.engine = async (filePath, { req, res, ctx }) => {
  const props = res.data();
  const html = await app.view.render(filePath, {
    ...req.data(),
    props
  });
  res.html(html);
};
```

This keeps template data separate from the real result set. A handler can attach view-only values to `res.data()` while still returning the actual payload with `results()`:

```typescript
if (res.code === 200) {
  res.data.set('sessionId', 'abc123');
  res.data.set('sessionUser', 'John Doe');
}

res.results(results);
```

## Conditional rendering in handlers

Because `render` is separate, you can render manually inside a route or event handler when the response depends on runtime conditions.

```typescript
export default async function UserDetail({ req, res, ctx }) {
  if (req.data.has('id')) {
    const html = await ctx.view.render('./views/me.hbs', {
      id: req.data('id')
    });
    res.html(html);
  }
}
```

If the handler sets a body itself, a matching `app.view.get('/user/:id', './views/user.hbs')` route will not also render on top of that response.

```typescript
app.view.get('/user/:id', './views/user.hbs');

app.get('/user/:id', async ({ req, res, ctx }) => {
  if (req.data('id') === 'me') {
    const html = await ctx.view.render('./views/me.hbs', {
      id: req.data('id')
    });
    res.html(html);
  }
});
```

## Why use this

- keep route lookup and view lookup connected
- support server-rendered pages without writing a full action for simple pages
- reuse rendering logic outside direct view routes

## Read next

- [Routing Patterns](../concepts/routing-patterns.md)
- [ViewRouter](../api/ViewRouter.md)
