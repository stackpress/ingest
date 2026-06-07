# EntryRouter

`EntryRouter` is for file-based route ownership when projects want explicit route-to-file mapping without changing the handler shape.

File-based routing routes events to files with exported handlers, which keeps route ownership visible in the filesystem and gives tooling a stable map of route-to-file boundaries.

```typescript
import EntryRouter from '@stackpress/ingest/EntryRouter';

const router = new EntryRouter(actionRouter, listen);

// Route to file exports
router.get('/users/:id', './routes/user.js');
router.post('/users', './routes/create-user.js');

// Event-based routing
router.on('user-created', './handlers/user-created.js');
```

## Table of Contents

 1. Properties
 2. HTTP Method Routing
 3. Event-Based Routing
 4. Creating Actions from Entries
 5. Using Other EntryRouters
 6. File Structure Requirements
 7. Dynamic Import Process
 8. Build Integration
 9. Integration with ActionRouter
 10. Best Practices

## 1. Properties

The following properties are available when instantiating an EntryRouter.

| Property | Type | Description |
|----------|------|-------------|
| `entries` | `Map<string, Set<EntryRouterTaskItem>>` | Map of event names to entry file configurations (readonly) |

## 2. HTTP Method Routing

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

// PATCH routes
router.patch('/users/:id', './routes/users/patch.js');

// OPTIONS routes
router.options('/users', './routes/users/options.js');

// HEAD routes
router.head('/users', './routes/users/head.js');

// CONNECT and TRACE are also available
router.connect('/proxy', './routes/proxy/connect.js');
router.trace('/users', './routes/users/trace.js');

// Handle any method
router.all('/health', './routes/health.js');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `path` | `string` | Route path with optional parameters (:id) |
| `action` | `string` | File path to the route handler |
| `priority` | `number` | Priority level (default: 0). Can be negative. Higher numbers run first, then ties follow definition order. |

**Returns**

The EntryRouter instance to allow method chaining.

## 3. Event-Based Routing

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
| `priority` | `number` | Priority level (default: 0). Can be negative. Higher numbers run first, then ties follow definition order. |

**Returns**

The EntryRouter instance to allow method chaining.

## 4. Creating Actions from Entries

The following example shows how entry files are converted to executable actions.

```typescript
// Internal method - creates action from file path
const action = router.action('GET /users', './routes/users.js', 0);
const props = {
  request,
  response,
  context,
  req: request,
  res: response,
  ctx: context
};

// The action dynamically imports and executes the file
await action(props);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string` | Event name for tracking |
| `action` | `string` | File path to import |
| `priority` | `number` | Priority level (default: 0). Can be negative. Higher numbers run first, then ties follow definition order. |

**Returns**

An async function that imports and executes the file's default export.

## 5. Using Other EntryRouters

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

## 6. File Structure Requirements

Entry files must export a default function that matches the route handler signature.

### 6.1. Basic Route Handler

The following example shows a basic route handler file structure.

```typescript
// ./routes/users/list.js
export default async function UserList({ req, res, ctx }) {
  const users = await getUsers();
  res.results(users);
}
```

Many projects wrap the handler with `action(...)` so the entry file still reads like a route action while keeping the same props-based handler shape:

```typescript
import { action } from '@stackpress/ingest';

export default action(async function UserList({ req, res }) {
  res.results(await getUsers());
});
```

### 6.2. Route Handler with Parameters

The following example shows how to handle route parameters in entry files.

```typescript
// ./routes/users/get.js
export default async function UserDetail({ req, res, ctx }) {
  const id = req.data('id'); // Route parameter
  const user = await getUser(id);
  
  if (!user) {
    res.setError('User not found', {}, [], 404);
    return false;
  }
  
  res.results(user);
  return true;
}
```

### 6.3. Event Handler

The following example shows how to structure event handler files.

```typescript
// ./handlers/user-login.js
export default async function UserLogin({ req, res, ctx }) {
  const user = req.data('user');
  
  // Log the login
  await logUserLogin(user.id);
  
  // Send welcome email
  await sendWelcomeEmail(user.email);
  
  return true; // Continue processing
}
```

### 6.4. Complex Route Handler

The following example shows a complex route handler with validation and error handling.

```typescript
// ./routes/users/create.js
import { validateUser } from '../validators/user.js';
import { createUser } from '../services/user.js';

export default async function CreateUser({ req, res, ctx }) {
  try {
    const userData = req.data();
    
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
    
    res.results(user, 201);
    return true;
  } catch (error) {
    res.setError('Failed to create user', {}, [], 500);
    return false;
  }
}
```

## 7. Dynamic Import Process

EntryRouter uses dynamic imports to load route handlers at runtime.

### 7.1. Import Flow

The following steps describe how EntryRouter processes file imports:

 1. **Route Registration**: File path is registered with the route
 2. **Request Handling**: When route is matched, dynamic import is triggered
 3. **Module Loading**: File is imported using `import()` statement
 4. **Default Export**: The default export is extracted and executed
 5. **Execution**: Handler is called with `{ req, res, ctx }`

Because the file path stays attached to the route definition, builders and deployment tooling can inspect `router.entries` without reverse-engineering the module graph.

### 7.2. Import Example

The following example shows the internal implementation of dynamic imports.

```typescript
// Internal implementation
async function EntryFileAction(props) {
  // Dynamic import of the route file
  const imports = await import('./routes/user.js');
  
  // Extract default export
  const callback = imports.default;
  
  // Execute the handler
  return await callback(props);
}
```

## 8. Build Integration

EntryRouter provides build-time information for bundlers and static analysis.

### 8.1. Entry Tracking

The following example shows how to access entry configurations for build tools.

```typescript
// Access entry configurations
console.log(router.entries);
// Map {
//   'GET /users' => Set([{ entry: './routes/users.js', priority: 0 }]),
//   'POST /users' => Set([{ entry: './routes/create.js', priority: 0 }])
// }
```

That is usually enough for a build script to answer questions like “which files own HTTP routes?” without having to execute the application.

### 8.2. Bundle Optimization

The following example shows how bundlers can optimize EntryRouter configurations.

```typescript
// Bundlers can analyze entry configurations to:
// 1. Pre-compile route files
// 2. Generate static route tables
// 3. Build route-aware deployment artifacts
// 4. Create dependency graphs

const entries = Array.from(router.entries.values())
  .flatMap(set => Array.from(set))
  .map(item => item.entry);

console.log('Route files to bundle:', entries);
```

## 9. Integration with ActionRouter

EntryRouter works as an extension of ActionRouter, sharing the same event system and routing capabilities.

### 9.1. Initialization

The following example shows how EntryRouter integrates with ActionRouter.

```typescript
import { ActionRouter } from '@stackpress/ingest';

const actionRouter = new ActionRouter(context);

// EntryRouter is automatically available
actionRouter.entry.get('/users', './routes/users.js');

// Or create standalone
const entryRouter = new EntryRouter(actionRouter, listen);
```

### 9.2. Shared Event System

The following example shows how both routers share the same event system.

```typescript
// Both routers share the same event system
actionRouter.get('/api', handlerFunction);
actionRouter.entry.get('/files', './routes/files.js');

// Both routes are available in the same router
await actionRouter.emit('GET /api', req, res);
await actionRouter.emit('GET /files', req, res);
```

## 10. Best Practices

The following guidelines help ensure effective use of EntryRouter in production applications.

### 10.1. File Organization

The following examples show recommended file organization patterns.

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

### 10.2. Error Handling

The following example shows proper error handling in entry files.

```typescript
// ./routes/error-example.js
export default async function ErrorExample({ req, res, ctx }) {
  try {
    const result = await riskyOperation();
    res.results(result);
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

### 10.3. Shared Utilities

The following example shows how to share utilities across entry files.

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

export default async function ProtectedUser({ req, res, ctx }) {
  const user = await requireAuth(req, res);
  if (!user) return false; // Auth failed
  
  // Continue with protected logic
  res.results({ user });
  return true;
}
```

### 10.4. Development vs Production

The following example shows how to handle different environments with EntryRouter.

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

### 10.5. Type Safety

The following example shows how to implement type safety in entry files.

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
  const userData = req.data() as UserData;
  
  // Type-safe operations
  const user = await createUser(userData);
  res.results(user);
  
  return true;
}
```
