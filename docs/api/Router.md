# Router

The Router class provides event-driven routing capabilities with pattern matching and parameter extraction.

## Overview

The Router class is the foundation of Ingest's routing system, providing:
- Event-driven routing with pattern matching
- Multiple routing interfaces (action, entry, import, view)
- HTTP method routing (GET, POST, PUT, DELETE, etc.)
- Request and response object creation
- Route resolution and event emission

```typescript
import { Router } from '@stackpress/ingest';

const router = new Router();
```

## Type Parameters

The Router class accepts two generic type parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `R` | `unknown` | Request resource type |
| `S` | `unknown` | Response resource type |

## Properties

The following properties are available when instantiating a Router.

| Property | Type | Description |
|----------|------|-------------|
| `action` | `ActionRouter<R, S, this>` | Traditional Express.js-like routing interface |
| `entry` | `EntryRouter<R, S, this>` | File-based routing interface |
| `import` | `ImportRouter<R, S, this>` | Dynamic import routing interface |
| `view` | `ViewRouter<R, S, this>` | Template-based routing interface |
| `entries` | `Map` | Map of entry-based routes |
| `expressions` | `Map` | Map of route expressions and patterns |
| `imports` | `Map` | Map of import-based routes |
| `listeners` | `object` | Event listener map |
| `routes` | `Map` | Map of route definitions |
| `views` | `Map` | Map of view-based routes |

## Methods

The following methods are available when instantiating a Router.

### HTTP Method Routing

The following examples show how to define routes for different HTTP methods.

```typescript
// GET route
router.get('/users', (req, res) => {
  res.setJSON({ users: [] });
});

// POST route
router.post('/users', (req, res) => {
  const userData = req.data.get();
  res.setJSON({ user: userData }, 201);
});

// PUT route
router.put('/users/:id', (req, res) => {
  const userId = req.data.get('id');
  res.setJSON({ id: userId, updated: true });
});

// DELETE route
router.delete('/users/:id', (req, res) => {
  const userId = req.data.get('id');
  res.setJSON({ id: userId, deleted: true });
});

// Handle any method
router.all('/health', (req, res) => {
  res.setJSON({ status: 'healthy' });
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `path` | `string` | Route path with optional parameters |
| `action` | `AnyRouterAction<R, S, this>` | Route handler function |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The Router instance to allow method chaining.

### Generic Route Definition

The following example shows how to define routes with specific HTTP methods.

```typescript
router.route('GET', '/users/:id', (req, res) => {
  const userId = req.data.get('id');
  res.setJSON({ id: userId });
});

router.route('PATCH', '/users/:id', (req, res) => {
  const userId = req.data.get('id');
  res.setJSON({ id: userId, patched: true });
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `method` | `Method` | HTTP method (GET, POST, PUT, DELETE, etc.) |
| `path` | `string` | Route path with optional parameters |
| `action` | `AnyRouterAction<R, S, this>` | Route handler function |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The Router instance to allow method chaining.

### Event Handling

The following example shows how to add event listeners.

```typescript
// Listen to all requests
router.on('request', (req, res) => {
  console.log(`${req.method} ${req.url.pathname}`);
});

// Listen to specific route events
router.on('GET /api/users', (req, res) => {
  console.log('Users API accessed');
});

// Pattern-based event matching
router.on(/^GET \/api\/.*$/, (req, res) => {
  console.log('API endpoint accessed');
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string\|RegExp` | Event name or pattern |
| `action` | `AnyRouterAction<R, S, this>` | Event handler function |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The Router instance to allow method chaining.

### Event Emission

The following example shows how to emit events manually.

```typescript
const req = router.request({ url: 'http://localhost/test' });
const res = router.response();

const status = await router.emit('custom-event', req, res);
console.log(status.code); // 200, 404, etc.
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string` | Event name to emit |
| `req` | `Request<R>` | Request object |
| `res` | `Response<S>` | Response object |

**Returns**

A promise that resolves to a Status object indicating success or failure.

### Route Resolution

The following examples show how to resolve routes and get response data.

```typescript
// Resolve by method and path
const response = await router.resolve('GET', '/users/123');

// Resolve by event name
const response = await router.resolve('user-created', userData);

// With custom request data
const response = await router.resolve('POST', '/users', {
  name: 'John',
  email: 'john@example.com'
});
```

**Parameters for route resolution**

| Parameter | Type | Description |
|----------|------|-------------|
| `method` | `Method\|'*'` | HTTP method |
| `path` | `string` | Route path |
| `request` | `Request<R>\|Record<string, any>` | Request data (optional) |
| `response` | `Response<S>` | Response object (optional) |

**Parameters for event resolution**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string` | Event name |
| `request` | `Request<R>\|Record<string, any>` | Request data (optional) |
| `response` | `Response<S>` | Response object (optional) |

**Returns**

A promise that resolves to a partial StatusResponse object.

### Request and Response Creation

The following examples show how to create request and response objects.

```typescript
// Create request
const req = router.request({
  url: 'http://example.com/api',
  method: 'POST',
  data: { name: 'John' },
  headers: { 'Content-Type': 'application/json' }
});

// Create response
const res = router.response({
  headers: { 'Content-Type': 'application/json' },
  data: { message: 'Success' }
});
```

**Parameters for request**

| Parameter | Type | Description |
|----------|------|-------------|
| `init` | `Partial<RequestOptions<R>>` | Request initialization options |

**Parameters for response**

| Parameter | Type | Description |
|----------|------|-------------|
| `init` | `Partial<ResponseOptions<S>>` | Response initialization options |

**Returns**

A new Request or Response instance.

### Router Composition

The following example shows how to merge routes from other routers.

```typescript
const apiRouter = new Router();
apiRouter.get('/api/users', handler);

const mainRouter = new Router();
mainRouter.use(apiRouter); // Merges routes and listeners
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `router` | `Router<R, S>` | Another router to merge routes from |

**Returns**

The Router instance to allow method chaining.

## Routing Interfaces

The Router class provides four different routing interfaces for maximum flexibility.

### Action Router (Traditional)

Express.js-like routing with inline handlers:

```typescript
router.action.get('/users', (req, res) => {
  res.setJSON({ users: [] });
});

router.action.post('/users', (req, res) => {
  const userData = req.data.get();
  res.setJSON(userData, 201);
});
```

### Entry Router (File-based)

File-based routing that loads handlers from files:

```typescript
router.entry.get('/users', './routes/users.js');
router.entry.post('/users', './routes/create-user.js');
```

The target file should export a default function:

```typescript
// routes/users.js
export default function handler(req, res) {
  res.setJSON({ users: [] });
}
```

### Import Router (Lazy Loading)

Dynamic import routing for code splitting:

```typescript
router.import.get('/users', () => import('./routes/users.js'));
router.import.post('/users', () => import('./routes/create-user.js'));
```

### View Router (Template-based)

Template-based routing for rendering views:

```typescript
router.view.get('/users', './views/users.hbs');
router.view.get('/profile', './views/profile.hbs');
```

## Automatic Router Detection

The Router class can automatically determine which routing interface to use based on the action type:

```typescript
// Automatically uses action router (function with parameters)
router.get('/users', (req, res) => { /* handler */ });

// Automatically uses import router (parameterless function)
router.get('/users', () => import('./routes/users.js'));

// Automatically uses view router (string path)
router.get('/users', './views/users.hbs');
```

## Route Patterns

The Router supports various route patterns for flexible matching:

### Parameter Routes

```typescript
// Single parameter
router.get('/users/:id', (req, res) => {
  const userId = req.data.get('id');
  res.setJSON({ id: userId });
});

// Multiple parameters
router.get('/users/:userId/posts/:postId', (req, res) => {
  const userId = req.data.get('userId');
  const postId = req.data.get('postId');
  res.setJSON({ userId, postId });
});
```

### Wildcard Routes

```typescript
// Single wildcard
router.get('/files/*', (req, res) => {
  const filename = req.data.get('0'); // First wildcard match
  res.setJSON({ filename });
});

// Catch-all wildcard
router.get('/static/**', (req, res) => {
  const path = req.data.get('0'); // Full wildcard match
  res.setJSON({ path });
});
```

### Regular Expression Routes

```typescript
// Regex pattern matching
router.on(/^GET \/api\/v(\d+)\/users$/, (req, res) => {
  const version = req.event?.data.args[0]; // Captured group
  res.setJSON({ version, users: [] });
});
```

## Event System Integration

The Router is built on a powerful event system that enables reactive programming:

### Priority-Based Execution

```typescript
// Higher priority executes first
router.on('request', middleware1, 10);
router.on('request', middleware2, 5);
router.on('request', middleware3, 1);
```

### Event Hooks

```typescript
// Before hook
router.action.before = async (event) => {
  console.log('Before:', event.event);
  return true; // Continue execution
};

// After hook
router.action.after = async (event) => {
  console.log('After:', event.event);
};
```

## Examples

### Basic REST API

```typescript
const router = new Router();

// List users
router.get('/users', (req, res) => {
  const users = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
  ];
  res.setJSON({ users });
});

// Get user by ID
router.get('/users/:id', (req, res) => {
  const userId = req.data.get('id');
  const user = { id: userId, name: 'John' };
  res.setJSON({ user });
});

// Create user
router.post('/users', async (req, res) => {
  await req.load();
  const userData = req.data.get();
  const user = { id: Date.now(), ...userData };
  res.setJSON({ user }, 201);
});

// Update user
router.put('/users/:id', async (req, res) => {
  await req.load();
  const userId = req.data.get('id');
  const userData = req.data.get();
  const user = { id: userId, ...userData };
  res.setJSON({ user });
});

// Delete user
router.delete('/users/:id', (req, res) => {
  const userId = req.data.get('id');
  res.setJSON({ id: userId, deleted: true });
});
```

### Middleware Pattern

```typescript
const router = new Router();

// Global middleware
router.on('request', (req, res) => {
  console.log(`${req.method} ${req.url.pathname}`);
  return true; // Continue processing
}, 10);

// Authentication middleware
router.on('request', (req, res) => {
  const token = req.headers.get('authorization');
  if (!token && req.url.pathname.startsWith('/protected')) {
    res.setError('Authentication required', {}, [], 401);
    return false; // Stop processing
  }
  return true;
}, 5);

// Protected route
router.get('/protected/data', (req, res) => {
  res.setJSON({ data: 'secret information' });
});
```

### File-Based Routing

```typescript
const router = new Router();

// Entry-based routes
router.entry.get('/api/users', './routes/users.js');
router.entry.post('/api/users', './routes/create-user.js');

// Import-based routes for code splitting
router.import.get('/api/products', () => import('./routes/products.js'));
router.import.get('/api/orders', () => import('./routes/orders.js'));

// View-based routes for templates
router.view.get('/users', './views/users.hbs');
router.view.get('/profile', './views/profile.hbs');
```

## Build Integration

The Router exposes routing information that can be used by bundlers:

```typescript
const router = new Router();
router.import.get('/users', () => import('./routes/users.js'));
router.import.get('/posts', () => import('./routes/posts.js'));

// Access build information
console.log(router.routes);      // Route definitions
console.log(router.imports);     // Dynamic imports
console.log(router.entries);     // File entries
console.log(router.views);       // View templates
console.log(router.expressions); // Route patterns
```

This information can be used to:
- Generate static route manifests
- Pre-bundle route modules
- Optimize code splitting
- Create deployment artifacts
