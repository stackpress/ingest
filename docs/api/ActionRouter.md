# ActionRouter

Event-driven routing system that provides multiple routing interfaces for handling HTTP requests with function-based actions.

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

## Properties

The following properties are available when instantiating an ActionRouter.

| Property | Type | Description |
|----------|------|-------------|
| `context` | `X` | Context object passed to route actions (readonly) |
| `routes` | `Map<string, Route>` | Map of event names to route definitions (readonly) |
| `entry` | `EntryRouter<R, S, X>` | Entry-based routing interface (readonly) |
| `import` | `ImportRouter<R, S, X>` | Import-based routing interface (readonly) |
| `view` | `ViewRouter<R, S, X>` | View-based routing interface (readonly) |

## Methods

The following methods are available when instantiating an ActionRouter.

### HTTP Method Routing

The following examples show how to define routes for different HTTP methods.

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

### Emitting Route Events

The following example shows how to emit route events directly.

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

### Event Name Generation

The following example shows how to generate event names from routes.

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

### Using Other Routers

The following example shows how to merge routes from another router.

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

## Multi-Routing Interface

ActionRouter provides four different routing approaches:

### 1. Action Router (Function-based)

Direct function routing for inline handlers:

```typescript
router.get('/users', async (req, res, ctx) => {
  // Direct function implementation
  const users = await getUsers();
  res.setResults(users);
});
```

### 2. Entry Router (File-based)

Route to file paths that export default functions:

```typescript
router.entry.get('/users/:id', './routes/user.js');

// ./routes/user.js
export default async function(req, res, ctx) {
  const id = req.data.get('id');
  const user = await getUser(id);
  res.setResults(user);
}
```

### 3. Import Router (Lazy Loading)

Route to dynamic imports for code splitting:

```typescript
router.import.post('/users', () => import('./routes/create-user.js'));

// Enables code splitting and lazy loading
router.import.get('/admin/*', () => import('./routes/admin/index.js'));
```

### 4. View Router (Template-based)

Route to template files for server-side rendering:

```typescript
// Configure template engine
router.view.engine = async (filePath, req, res, ctx) => {
  const html = await renderTemplate(filePath, req.data.get());
  res.setHTML(html);
};

router.view.get('/profile', './views/profile.hbs');
```

## Route Parameters

ActionRouter supports Express-like route parameters:

### Parameter Extraction

```typescript
router.get('/users/:id/posts/:postId', async (req, res, ctx) => {
  const userId = req.data.get('id');
  const postId = req.data.get('postId');
  
  // Parameters are automatically added to request data
  const post = await getPost(userId, postId);
  res.setResults(post);
});
```

### Wildcard Routes

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

### Pattern Matching

```typescript
// Regex patterns
router.on(/^GET \/api\/v(\d+)\/users$/, async (req, res, ctx) => {
  const version = req.data.get()[0]; // First capture group
  res.setJSON({ version, users: await getUsers() });
});
```

## Event-Driven Architecture

ActionRouter extends ExpressEmitter for pattern-based event handling:

### Event Hooks

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

### Priority-Based Execution

```typescript
// Higher priority executes first
router.get('/users', handler1, 1);      // Lower priority
router.get('/users', handler2, 10);     // Higher priority
router.get('/users', handler3, 5);      // Medium priority

// Execution order: handler2, handler3, handler1
```

### Event Data Access

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

## Integration with Server

ActionRouter is typically used within the Server class:

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

## Best Practices

### Route Organization

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

### Error Handling

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

### Middleware Pattern

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

### Code Splitting

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