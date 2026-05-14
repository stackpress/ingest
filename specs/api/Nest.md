# Nest

`Nest` is the nested data primitive behind many Ingest data objects such as `app.config`, `req.data`, `req.query`, `req.post`, `res.data`, and `res.errors`.

This class lives in `@stackpress/lib`, not in Ingest itself, but Ingest relies on it heavily enough that it is worth understanding.

```typescript
import { Nest, nest } from '@stackpress/lib';

const config = nest({
  database: {
    postgres: {
      host: 'localhost',
      port: 5432
    }
  }
});
```

## Why it matters in Ingest

Ingest uses the callable form of `Nest` almost everywhere it needs structured state.

```typescript
app.config.set('app', { name: 'My App' });

app.get('/users/:id', ({ req, res }) => {
  res.setJSON({
    id: req.data('id'),
    filters: req.query(),
    body: req.post(),
    config: app.config('app', 'name')
  });
});
```

That is why these data objects behave similarly even though they belong to different classes.

## Common operations

The most useful methods are:

```typescript
config('database', 'postgres', 'host');      // callable read
config.get('database', 'postgres', 'port');  // method read
config.set('database', 'postgres', 'port', 5432);
config.has('database', 'postgres', 'host');
config.path('database.postgres.host');
config.entries();
```

The callable form is convenient for reads in handlers, while the methods are better when you need more explicit mutation or inspection.

## Where you will see it in Ingest

- `app.config`
- `req.query`
- `req.post`
- `req.data`
- `res.data`
- `res.errors`

For example:

```typescript
app.view.engine = async (filePath, req, res) => {
  const props = res.data();
  const html = await app.view.render(filePath, {
    ...req.data(),
    props
  });
  res.setHTML(html);
};
```

## Parsing helpers

The same module also provides parsing helpers that Ingest adapters use when building request data.

```typescript
import {
  objectFromQuery,
  objectFromFormData,
  objectFromJson
} from '@stackpress/lib/Nest';
```

Those helpers are part of how:

- query strings become `req.query`
- request bodies become `req.post`
- merged request state becomes `req.data`

## Read next

- [Request](./Request.md)
- [Response](./Response.md)
- [Server](./Server.md)
- [Data Surfaces](../concepts/data-surfaces.md)
