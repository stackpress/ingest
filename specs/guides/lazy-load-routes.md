# Lazy Load Routes

Use import routes when a handler should be loaded on demand. They are not only a loading choice; they also give build and deployment tooling explicit visibility into route module boundaries.

## Example

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

```typescript
console.log(app.imports);
// [
//   ['GET /users', [{ priority: 0 }]]
// ]
```

## Why use this

- reduce initial load
- expose route import metadata to tooling
- keep route registration central while loading handlers lazily

## Read next

- [Routing Patterns](../concepts/routing-patterns.md)
- [Runtimes and Tooling](../concepts/runtimes-and-tooling.md)
- [ImportRouter](../api/ImportRouter.md)
