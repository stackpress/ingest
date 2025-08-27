# EntryRouter

File-based routing system that routes to file paths containing exported route handlers, enabling modular route organization and build-time optimization.

```typescript
import EntryRouter from '@stackpress/ingest/plugin/EntryRouter';

const router = new EntryRouter(actionRouter, listen);

// Route to file exports
router.get('/users/:id', './routes/user.js');
router.post('/users', './routes/create-user.js');

// Event-based routing
router.on('user-created', './handlers/user-created.js');
```

## Properties

The following properties are available when instantiating an EntryRouter.

| Property | Type | Description |
|----------|------|-------------|
| `entries` | `Map<string, Set<EntryRouterTaskItem>>` | Map of event names to entry file configurations (readonly) |

## Methods

The following methods are available when instantiating an EntryRouter.

### HTTP Method Routing

The following examples show how to define file-based routes for different HTTP methods.

```typescript
// GET routes
router.get('/users', './routes/users/list.js');
router.get('/users/:id', './routes/users/get.js');

// POST routes
router.post('/users', './routes/users/create.js');

// PUT routes
router.put('/users/:id', './routes/users/update.js');

// DELETE routes
router.delete('/users/:id', './routes/users/delete.js');

// Handle any method
router.all('/health', './routes/health.js');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `path` | `string` | Route path with optional parameters (:id) |
| `action` | `string` | File path to the route handler |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The EntryRouter instance to allow method chaining.

### Event-Based Routing

The following example shows how to route events to file handlers.

```typescript
// Route custom events to files
router.on('user-login', './handlers/user-login.js');
router.on('data-updated', './handlers/data-updated.js');

// Route with regex patterns
router.on(/^email-.+$/, './handlers/email-handler.js');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string\|RegExp` | Event name or pattern |
| `entry` | `string` | File path to the event handler |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The EntryRouter instance to allow method chaining.

### Creating Actions from Entries

The following example shows how entry files are converted to executable actions.

```typescript
// Internal method - creates action from file path
const action = router.action('GET /users', './routes/users.js', 0);

// The action dynamically imports and executes the file
await action(request, response, context);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string` | Event name for tracking |
| `action` | `string` | File path to import |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

An async function that imports and executes the file's default export.

### Using Other EntryRouters

The following example shows how to merge entries from another router.

```typescript
const apiRouter = new EntryRouter(actionRouter, listen);
apiRouter.get('/api/users', './api/users.js');

const mainRouter = new EntryRouter(actionRouter, listen);
mainRouter.use(apiRouter); // Merges entry configurations
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `router` | `EntryRouter<R, S, X>` | Another EntryRouter to merge entries from |

**Returns**

The EntryRouter instance to allow method chaining.

## File Structure Requirements

Entry files must export a default function that matches the route handler signature:

### Basic Route Handler

```typescript
// ./routes/users/list.js
export default async function(req, res, ctx) {
  const users = await getUsers();
  res.setResults(users);
}
```

### Route Handler with Parameters

```typescript
// ./routes/users/get.js
export default async function(req, res, ctx) {
  const id = req.data.get('id'); // Route parameter
  const user = await getUser(id);
  
  if (!user) {
    res.setError('User not found', {}, [], 404);
    return false;
  }
  
  res.setResults(user);
  return true;
}
```

### Event Handler

```typescript
// ./handlers/user-login.js
export default async function(req, res, ctx) {
  const user = req.data.get('user');
  
  // Log the login
  await logUserLogin(user.id);
  
  // Send welcome email
  await sendWelcomeEmail(user.email);
  
  return true; // Continue processing
}
```

### Complex Route Handler

```typescript
// ./routes/users/create.js
import { validateUser } from '../validators/user.js';
import { createUser } from '../services/user.js';

export default async function(req, res, ctx) {
  try {
    const userData = req.data.get();
    
    // Validate input
    const validation = await validateUser(userData);
    if (!validation.valid) {
      res.setError('Validation failed', validation.errors, [], 400);
      return false;
    }
    
    // Create user
    const user = await createUser(userData);
    
    // Emit user created event
    await ctx.emit('user-created', req, res);
    
    res.setResults(user, 201);
    return true;
  } catch (error) {
    res.setError('Failed to create user', {}, [], 500);
    return false;
  }
}
```

## Dynamic Import Process

EntryRouter uses dynamic imports to load route handlers at runtime:

### Import Flow

1. **Route Registration**: File path is registered with the route
2. **Request Handling**: When route is matched, dynamic import is triggered
3. **Module Loading**: File is imported using `import()` statement
4. **Default Export**: The default export is extracted and executed
5. **Execution**: Handler is called with request, response, and context

### Import Example

```typescript
// Internal implementation
async function EntryFileAction(req, res, ctx) {
  // Dynamic import of the route file
  const imports = await import('./routes/user.js');
  
  // Extract default export
  const callback = imports.default;
  
  // Execute the handler
  return await callback(req, res, ctx);
}
```

## Build Integration

EntryRouter provides build-time information for bundlers and static analysis:

### Entry Tracking

```typescript
// Access entry configurations
console.log(router.entries);
// Map {
//   'GET /users' => Set([{ entry: './routes/users.js', priority: 0 }]),
//   'POST /users' => Set([{ entry: './routes/create.js', priority: 0 }])
// }
```

### Bundle Optimization

```typescript
// Bundlers can analyze entry configurations to:
// 1. Pre-compile route files
// 2. Generate static route tables
// 3. Optimize code splitting
// 4. Create dependency graphs

const entries = Array.from(router.entries.values())
  .flatMap(set => Array.from(set))
  .map(item => item.entry);

console.log('Route files to bundle:', entries);
```

## Integration with ActionRouter

EntryRouter works as an extension of ActionRouter:

### Initialization

```typescript
import ActionRouter from '@stackpress/ingest/plugin/ActionRouter';

const actionRouter = new ActionRouter(context);

// EntryRouter is automatically available
actionRouter.entry.get('/users', './routes/users.js');

// Or create standalone
const entryRouter = new EntryRouter(actionRouter, listen);
```

### Shared Event System

```typescript
// Both routers share the same event system
actionRouter.get('/api', handlerFunction);
actionRouter.entry.get('/files', './routes/files.js');

// Both routes are available in the same router
await actionRouter.emit('GET /api', req, res);
await actionRouter.emit('GET /files', req, res);
```

## Best Practices

### File Organization

```typescript
// Organize by feature
router.get('/users', './routes/users/index.js');
router.get('/users/:id', './routes/users/get.js');
router.post('/users', './routes/users/create.js');
router.put('/users/:id', './routes/users/update.js');
router.delete('/users/:id', './routes/users/delete.js');

// Organize by HTTP method
router.get('/posts', './routes/get/posts.js');
router.post('/posts', './routes/post/posts.js');
router.put('/posts/:id', './routes/put/posts.js');
```

### Error Handling

```typescript
// ./routes/error-example.js
export default async function(req, res, ctx) {
  try {
    const result = await riskyOperation();
    res.setResults(result);
    return true;
  } catch (error) {
    // Log error
    console.error('Route error:', error);
    
    // Set appropriate error response
    if (error.code === 'VALIDATION_ERROR') {
      res.setError('Invalid input', error.details, [], 400);
    } else {
      res.setError('Internal server error', {}, [], 500);
    }
    
    return false; // Abort processing
  }
}
```

### Shared Utilities

```typescript
// ./routes/shared/auth.js
export async function requireAuth(req, res) {
  const token = req.headers.get('authorization');
  if (!token) {
    res.setError('Unauthorized', {}, [], 401);
    return null;
  }
  
  return await validateToken(token);
}

// ./routes/users/protected.js
import { requireAuth } from '../shared/auth.js';

export default async function(req, res, ctx) {
  const user = await requireAuth(req, res);
  if (!user) return false; // Auth failed
  
  // Continue with protected logic
  res.setResults({ user });
  return true;
}
```

### Development vs Production

```typescript
// Use different files for different environments
const isDev = process.env.NODE_ENV === 'development';

router.get('/debug', isDev 
  ? './routes/debug/full.js' 
  : './routes/debug/minimal.js'
);

// Conditional route registration
if (isDev) {
  router.get('/dev-tools', './routes/dev/tools.js');
}
```

### Type Safety

```typescript
// ./routes/typed-example.ts
import type { Request, Response, Server } from '@stackpress/ingest';

interface UserData {
  name: string;
  email: string;
}

export default async function(
  req: Request<any>, 
  res: Response<any>, 
  ctx: Server<any, any, any>
) {
  const userData = req.data.get() as UserData;
  
  // Type-safe operations
  const user = await createUser(userData);
  res.setResults(user);
  
  return true;
}
```