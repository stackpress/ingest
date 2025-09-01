# Router

The Router class provides event-driven routing capabilities with pattern matching and parameter extraction for building flexible web applications and APIs.

```typescript
import { Router } from '@stackpress/ingest';

const router = new Router<RequestType, ResponseType>();
```

 1. [Properties](#1-properties)
 2. [Methods](#2-methods)
 3. [Routing Interfaces](#3-routing-interfaces)
 4. [Automatic Router Detection](#4-automatic-router-detection)
 5. [Route Patterns](#5-route-patterns)
 6. [Event System Integration](#6-event-system-integration)
 7. [Type Parameters](#7-type-parameters)
 8. [Examples](#8-examples)
 9. [Build Integration](#9-build-integration)

## 1. Properties

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

## 2. Methods

The following methods are available when instantiating a Router.

### 2.1. HTTP Method Routing

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

### 2.2. Generic Route Definition

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

### 2.3. Event Handling

The following example shows how to add event listeners for reactive programming.

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

### 2.4. Event Emission

The following example shows how to emit events manually for custom workflows.

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

### 2.5. Route Resolution

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

### 2.6. Request and Response Creation

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

### 2.7. Router Composition

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

## 3. Automatic Router Detection

The Router class can automatically determine which routing interface to use based on the action type, providing a seamless development experience.

```typescript
// Automatically uses action router (function with parameters)
router.get('/users', (req, res) => { /* handler */ });

// Automatically uses import router (parameterless function)
router.get('/users', () => import('./routes/users.js'));

// Automatically uses view router (string path)
router.get('/users', './views/users.hbs');
```

The router analyzes the provided action and selects the appropriate interface:

 - **Function with parameters** → Action Router (traditional routing)
 - **Parameterless function** → Import Router (lazy loading)
 - **String path** → View Router (template-based) or Entry Router (file-based)

This automatic detection eliminates the need to explicitly specify which routing interface to use, making the API more intuitive and reducing boilerplate code.

## 4. Routing Interfaces

The Router class provides four different routing interfaces for maximum flexibility in how you define and organize your routes.

### 4.1. Action Router (Traditional)

Express.js-like routing with inline handlers for immediate function execution.

```typescript
router.action.get('/users', (req, res) => {
  res.setJSON({ users: [] });
});

router.action.post('/users', (req, res) => {
  const userData = req.data.get();
  res.setJSON(userData, 201);
});
```

### 4.2. Entry Router (File-based)

File-based routing that loads handlers from external files for better organization.

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

### 4.3. Import Router (Lazy Loading)

Dynamic import routing for code splitting and performance optimization.

```typescript
router.import.get('/users', () => import('./routes/users.js'));
router.import.post('/users', () => import('./routes/create-user.js'));
```

### 4.4. View Router (Template-based)

Template-based routing for rendering views and server-side templates.

```typescript
router.view.get('/users', './views/users.hbs');
router.view.get('/profile', './views/profile.hbs');
```

## 5. Route Patterns

The Router supports various route patterns for flexible URL matching and parameter extraction.

### 5.1. Parameter Routes

Extract dynamic segments from URLs using named parameters.

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

### 5.2. Wildcard Routes

Handle dynamic paths with wildcard matching for flexible routing.

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

### 5.3. Regular Expression Routes

Use regular expressions for complex pattern matching requirements.

```typescript
// Regex pattern matching
router.on(/^GET \/api\/v(\d+)\/users$/, (req, res) => {
  const version = req.event?.data.args[0]; // Captured group
  res.setJSON({ version, users: [] });
});
```

## 6. Event System Integration

The Router is built on a powerful event system that enables reactive programming and middleware patterns.

### 6.1. Priority-Based Execution

Control the order of event handler execution using priority levels.

```typescript
// Higher priority executes first
router.on('request', middleware1, 10);
router.on('request', middleware2, 5);
router.on('request', middleware3, 1);
```

### 6.2. Event Hooks

Implement before and after hooks for cross-cutting concerns.

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

## 7. Type Parameters

The Router class accepts two generic type parameters for type safety.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `R` | `unknown` | Request resource type |
| `S` | `unknown` | Response resource type |

```typescript
interface UserRequest {
  userId: string;
  permissions: string[];
}

interface ApiResponse {
  data: any;
  meta: { timestamp: number };
}

const router = new Router<UserRequest, ApiResponse>();
```

## 8. Examples

The following examples demonstrate common Router usage patterns and best practices.

### 8.1. Basic REST API

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
```

### 8.2. Middleware Pattern

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

### 8.3. File-Based Routing

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

## 9. Build Integration

The Router exposes routing information that can be used by bundlers and build tools for optimization.

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

This information can be used to generate static route manifests, pre-bundle route modules, optimize code splitting, and create deployment artifacts for production environments.
