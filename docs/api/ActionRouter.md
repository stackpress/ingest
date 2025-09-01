# ActionRouter

Event-driven routing system that provides multiple routing interfaces for handling HTTP requests with function-based actions and flexible routing patterns.

```typescript
import ActionRouter from '@stackpress/ingest/plugin/ActionRouter';

const router = new ActionRouter(context);

// Function-based routing
router.get('/users', async (req, res, ctx) => {
  const users = await getUsers();
  res.setResults(users);
});

// Entry-based routing
router.entry.get('/users/:id', './routes/user.js');

// Import-based routing
router.import.post('/users', () => import('./routes/create-user.js'));

// View-based routing
router.view.get('/profile', './views/profile.hbs');
```

 1. [Properties](#1-properties)
 2. [Methods](#2-methods)
 3. [Multi-Routing Interface](#3-multi-routing-interface)
 4. [Route Parameters](#4-route-parameters)
 5. [Event-Driven Architecture](#5-event-driven-architecture)
 6. [Integration with Server](#6-integration-with-server)
 7. [Best Practices](#7-best-practices)
 8. [Examples](#8-examples)

## 1. Properties

The following properties are available when instantiating an ActionRouter.

| Property | Type | Description |
|----------|------|-------------|
| `context` | `X` | Context object passed to route actions (readonly) |
| `routes` | `Map<string, Route>` | Map of event names to route definitions (readonly) |
| `entry` | `EntryRouter<R, S, X>` | Entry-based routing interface (readonly) |
| `import` | `ImportRouter<R, S, X>` | Import-based routing interface (readonly) |
| `view` | `ViewRouter<R, S, X>` | View-based routing interface (readonly) |

## 2. Methods

The following methods are available when instantiating an ActionRouter.

### 2.1. HTTP Method Routing

The following examples show how to define routes for different HTTP methods with function-based handlers.

```typescript
// GET routes
router.get('/users', async (req, res, ctx) => {
  const users = await getUsers();
  res.setResults(users);
});

// POST routes
router.post('/users', async (req, res, ctx) => {
  const userData = req.data.get();
  const user = await createUser(userData);
  res.setResults(user, 201);
});

// PUT routes
router.put('/users/:id', async (req, res, ctx) => {
  const id = req.data.get('id');
  const userData = req.data.get();
  const user = await updateUser(id, userData);
  res.setResults(user);
});

// DELETE routes
router.delete('/users/:id', async (req, res, ctx) => {
  const id = req.data.get('id');
  await deleteUser(id);
  res.setJSON({ success: true });
});

// Handle any method
router.all('/health', async (req, res, ctx) => {
  res.setJSON({ status: 'ok', timestamp: Date.now() });
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `path` | `string` | Route path with optional parameters (:id) |
| `action` | `ActionRouterAction<R, S, X>` | Route handler function |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

Route information object with method, path, and event details.

### 2.2. Emitting Route Events

The following example shows how to emit route events directly for programmatic route execution.

```typescript
const status = await router.emit('GET /users/123', request, response);
if (status.code === 404) {
  console.log('Route not found');
} else if (status.code === 200) {
  console.log('Route executed successfully');
}
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string` | Route event name (e.g., 'GET /users/123') |
| `req` | `Request<R>` | Request object |
| `res` | `Response<S>` | Response object |

**Returns**

A promise that resolves to a Status object indicating success or failure.

### 2.3. Event Name Generation

The following example shows how to generate event names from routes for debugging and introspection.

```typescript
// Generate event name from method and path
const eventName = router.eventName('GET', '/users/:id');
// Returns: 'GET /users/:id' or regex pattern for dynamic routes

// Generate event name from pattern
const regexEvent = router.eventName(/^GET \/api\/.+$/);
// Returns: string representation of the regex
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `method` | `Method\|string\|RegExp` | HTTP method or pattern |
| `path` | `string` | Route path (optional for regex patterns) |

**Returns**

The generated event name string.

### 2.4. Using Other Routers

The following example shows how to merge routes from another router for modular route organization.

```typescript
const apiRouter = new ActionRouter(context);
apiRouter.get('/api/users', userHandler);

const mainRouter = new ActionRouter(context);
mainRouter.use(apiRouter); // Merges routes and listeners
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `emitter` | `EventEmitter<ActionRouterMap<R, S, X>>` | Another router to merge |

**Returns**

The ActionRouter instance to allow method chaining.

## 3. Multi-Routing Interface

ActionRouter provides four different routing approaches for maximum flexibility in application architecture.

### 3.1. Action Router (Function-based)

Direct function routing for inline handlers with immediate execution.

```typescript
router.get('/users', async (req, res, ctx) => {
  // Direct function implementation
  const users = await getUsers();
  res.setResults(users);
});
```

### 3.2. Entry Router (File-based)

Route to file paths that export default functions for better code organization.

```typescript
router.entry.get('/users/:id', './routes/user.js');

// ./routes/user.js
export default async function(req, res, ctx) {
  const id = req.data.get('id');
  const user = await getUser(id);
  res.setResults(user);
}
```

### 3.3. Import Router (Lazy Loading)

Route to dynamic imports for code splitting and performance optimization.

```typescript
router.import.post('/users', () => import('./routes/create-user.js'));

// Enables code splitting and lazy loading
router.import.get('/admin/*', () => import('./routes/admin/index.js'));
```

### 3.4. View Router (Template-based)

Route to template files for server-side rendering and view generation.

```typescript
// Configure template engine
router.view.engine = async (filePath, req, res, ctx) => {
  const html = await renderTemplate(filePath, req.data.get());
  res.setHTML(html);
};

router.view.get('/profile', './views/profile.hbs');
```

## 4. Route Parameters

ActionRouter supports Express-like route parameters with automatic extraction and pattern matching.

### 4.1. Parameter Extraction

Extract dynamic segments from URLs using named parameters.

```typescript
router.get('/users/:id/posts/:postId', async (req, res, ctx) => {
  const userId = req.data.get('id');
  const postId = req.data.get('postId');
  
  // Parameters are automatically added to request data
  const post = await getPost(userId, postId);
  res.setResults(post);
});
```

### 4.2. Wildcard Routes

Handle dynamic paths with wildcard matching for flexible routing.

```typescript
// Single wildcard
router.get('/files/*', async (req, res, ctx) => {
  const args = req.data.get(); // Contains wildcard matches
  const filePath = args[0]; // First wildcard match
  res.setJSON({ file: filePath });
});

// Catch-all wildcard
router.get('/api/**', async (req, res, ctx) => {
  // Handles any path under /api/
  res.setJSON({ path: req.url.pathname });
});
```

### 4.3. Pattern Matching

Use regular expressions for complex pattern matching requirements.

```typescript
// Regex patterns
router.on(/^GET \/api\/v(\d+)\/users$/, async (req, res, ctx) => {
  const version = req.data.get()[0]; // First capture group
  res.setJSON({ version, users: await getUsers() });
});
```

## 5. Event-Driven Architecture

ActionRouter extends ExpressEmitter for pattern-based event handling with hooks and priority-based execution.

### 5.1. Event Hooks

Implement before and after hooks for cross-cutting concerns.

```typescript
// Before hook - runs before each route action
router.before = async (event) => {
  console.log(`Executing: ${event.event}`);
  return true; // Continue execution
};

// After hook - runs after each route action
router.after = async (event) => {
  console.log(`Completed: ${event.event}`);
  return true; // Continue execution
};
```

### 5.2. Priority-Based Execution

Control the order of event handler execution using priority levels.

```typescript
// Higher priority executes first
router.get('/users', handler1, 1);      // Lower priority
router.get('/users', handler2, 10);     // Higher priority
router.get('/users', handler3, 5);      // Medium priority

// Execution order: handler2, handler3, handler1
```

### 5.3. Event Data Access

Access current event information for debugging and context awareness.

```typescript
router.get('/users/:id', async (req, res, ctx) => {
  // Access current event information
  const event = router.event;
  console.log('Event:', event.event);        // 'GET /users/123'
  console.log('Pattern:', event.pattern);    // 'GET /users/:id'
  console.log('Params:', event.data.params); // { id: '123' }
  console.log('Args:', event.data.args);     // ['users', '123']
});
```

## 6. Integration with Server

ActionRouter is typically used within the Server class for seamless integration with the Ingest framework.

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

// Server provides ActionRouter interface
app.get('/users', async (req, res, ctx) => {
  // ctx is the server instance
  const users = await getUsers();
  res.setResults(users);
});

// Access the underlying ActionRouter
const router = app.router;
console.log(router.routes); // Map of all routes
```

## 7. Best Practices

The following best practices ensure maintainable and efficient routing implementations.

### 7.1. Route Organization

Group related routes for better code organization and maintainability.

```typescript
// Group related routes
const userRoutes = (router: ActionRouter) => {
  router.get('/users', listUsers);
  router.get('/users/:id', getUser);
  router.post('/users', createUser);
  router.put('/users/:id', updateUser);
  router.delete('/users/:id', deleteUser);
};

// Apply route groups
userRoutes(router);
```

### 7.2. Error Handling

Implement comprehensive error handling for robust applications.

```typescript
router.get('/users/:id', async (req, res, ctx) => {
  try {
    const id = req.data.get('id');
    const user = await getUser(id);
    
    if (!user) {
      res.setError('User not found', {}, [], 404);
      return false; // Abort further processing
    }
    
    res.setResults(user);
    return true; // Continue processing
  } catch (error) {
    res.setError('Internal server error', {}, [], 500);
    return false;
  }
});
```

### 7.3. Middleware Pattern

Use priority-based execution for middleware implementation.

```typescript
// Authentication middleware
const requireAuth = async (req, res, ctx) => {
  const token = req.headers.get('authorization');
  if (!token) {
    res.setError('Unauthorized', {}, [], 401);
    return false;
  }
  
  const user = await validateToken(token);
  req.data.set('user', user);
  return true;
};

// Apply middleware with priority
router.get('/protected', requireAuth, 10);  // High priority
router.get('/protected', protectedHandler, 0); // Lower priority
```

### 7.4. Code Splitting

Leverage import router for performance optimization and lazy loading.

```typescript
// Use import router for large route handlers
router.import.get('/dashboard/*', () => import('./routes/dashboard'));
router.import.get('/admin/*', () => import('./routes/admin'));

// Conditional imports
router.import.get('/dev/*', () => {
  if (process.env.NODE_ENV === 'development') {
    return import('./routes/dev-tools');
  }
  throw new Error('Dev routes not available in production');
});
```

## 8. Examples

The following examples demonstrate common ActionRouter usage patterns for real-world applications.

### 8.1. REST API Implementation

```typescript
import ActionRouter from '@stackpress/ingest/plugin/ActionRouter';

const router = new ActionRouter(server);

// User management API
router.get('/api/users', async (req, res, ctx) => {
  const page = parseInt(req.query.get('page') || '1');
  const limit = parseInt(req.query.get('limit') || '10');
  
  const users = await getUsersPaginated(page, limit);
  res.setRows(users.data, users.total);
});

router.get('/api/users/:id', async (req, res, ctx) => {
  const id = req.data.get('id');
  const user = await getUserById(id);
  
  if (!user) {
    res.setError('User not found', {}, [], 404);
    return;
  }
  
  res.setResults(user);
});

router.post('/api/users', async (req, res, ctx) => {
  await req.load();
  const userData = req.data.get();
  
  const user = await createUser(userData);
  res.setResults(user, 201);
});

async function getUsersPaginated(page: number, limit: number) {
  // Pagination logic
  return { data: [], total: 0 };
}

async function getUserById(id: string) {
  // User lookup logic
  return { id, name: 'John Doe' };
}

async function createUser(userData: any) {
  // User creation logic
  return { id: Date.now(), ...userData };
}
```

### 8.2. Multi-Interface Routing

```typescript
const router = new ActionRouter(server);

// Function-based routes for simple handlers
router.get('/api/status', async (req, res, ctx) => {
  res.setJSON({ status: 'ok', timestamp: Date.now() });
});

// Entry-based routes for organized file structure
router.entry.get('/api/users/:id', './routes/api/users/get.js');
router.entry.post('/api/users', './routes/api/users/create.js');

// Import-based routes for code splitting
router.import.get('/dashboard/*', () => import('./routes/dashboard'));
router.import.get('/admin/*', () => import('./routes/admin'));

// View-based routes for server-side rendering
router.view.get('/', './views/home.hbs');
router.view.get('/about', './views/about.hbs');
```

### 8.3. Middleware Chain Implementation

```typescript
const router = new ActionRouter(server);

// Global middleware
const logger = async (req, res, ctx) => {
  console.log(`${req.method} ${req.url.pathname}`);
  return true;
};

const cors = async (req, res, ctx) => {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  return true;
};

// Authentication middleware
const authenticate = async (req, res, ctx) => {
  const token = req.headers.get('authorization');
  if (!token) {
    res.setError('Authentication required', {}, [], 401);
    return false;
  }
  
  const user = await validateToken(token);
  req.data.set('user', user);
  return true;
};

// Apply middleware with priorities
router.all('*', logger, 100);      // Highest priority
router.all('*', cors, 90);         // High priority
router.all('/api/*', authenticate, 80); // Medium priority

// Route handlers (lowest priority)
router.get('/api/profile', async (req, res, ctx) => {
  const user = req.data.get('user');
  res.setResults(user);
}, 0);

async function validateToken(token: string) {
  // Token validation logic
  return { id: 1, username: 'user' };
}
```

### 8.4. Dynamic Route Registration

```typescript
const router = new ActionRouter(server);

// Dynamic API route registration
const apiEndpoints = [
  { method: 'GET', path: '/api/users', handler: 'listUsers' },
  { method: 'POST', path: '/api/users', handler: 'createUser' },
  { method: 'GET', path: '/api/users/:id', handler: 'getUser' },
  { method: 'PUT', path: '/api/users/:id', handler: 'updateUser' },
  { method: 'DELETE', path: '/api/users/:id', handler: 'deleteUser' }
];

const handlers = {
  listUsers: async (req, res, ctx) => {
    const users = await getAllUsers();
    res.setResults(users);
  },
  createUser: async (req, res, ctx) => {
    await req.load();
    const user = await createUser(req.data.get());
    res.setResults(user, 201);
  },
  getUser: async (req, res, ctx) => {
    const user = await getUserById(req.data.get('id'));
    res.setResults(user);
  },
  updateUser: async (req, res, ctx) => {
    await req.load();
    const user = await updateUser(req.data.get('id'), req.data.get());
    res.setResults(user);
  },
  deleteUser: async (req, res, ctx) => {
    await deleteUser(req.data.get('id'));
    res.setJSON({ success: true });
  }
};

// Register routes dynamically
apiEndpoints.forEach(({ method, path, handler }) => {
  router[method.toLowerCase()](path, handlers[handler]);
});

async function getAllUsers() {
  return [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
}
```
