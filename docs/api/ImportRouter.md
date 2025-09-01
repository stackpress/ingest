# ImportRouter

Lazy-loading routing system that routes to dynamic import functions, enabling code splitting and on-demand module loading for optimal performance.

```typescript
import ImportRouter from '@stackpress/ingest/plugin/ImportRouter';

const router = new ImportRouter(actionRouter, listen);

// Route to dynamic imports
router.get('/users/:id', () => import('./routes/user.js'));
router.post('/users', () => import('./routes/create-user.js'));

// Conditional imports
router.get('/admin/*', () => {
  if (isProduction) {
    return import('./routes/admin-prod.js');
  }
  return import('./routes/admin-dev.js');
});
```

 1. [Properties](#1-properties)
 2. [HTTP Method Routing](#2-http-method-routing)
 3. [Event-Based Routing](#3-event-based-routing)
 4. [Creating Actions from Imports](#4-creating-actions-from-imports)
 5. [Using Other ImportRouters](#5-using-other-importrouters)
 6. [Dynamic Import Functions](#6-dynamic-import-functions)
 7. [Code Splitting Benefits](#7-code-splitting-benefits)
 8. [Error Handling](#8-error-handling)
 9. [Integration with ActionRouter](#9-integration-with-actionrouter)
 10. [Best Practices](#10-best-practices)

## 1. Properties

The following properties are available when instantiating an ImportRouter.

| Property | Type | Description |
|----------|------|-------------|
| `imports` | `Map<string, Set<ImportRouterTaskItem<R, S, X>>>` | Map of event names to import function configurations (readonly) |

## 2. HTTP Method Routing

The following examples show how to define import-based routes for different HTTP methods.

```typescript
// GET routes with dynamic imports
router.get('/users', () => import('./routes/users/list.js'));
router.get('/users/:id', () => import('./routes/users/get.js'));

// POST routes
router.post('/users', () => import('./routes/users/create.js'));

// PUT routes
router.put('/users/:id', () => import('./routes/users/update.js'));

// DELETE routes
router.delete('/users/:id', () => import('./routes/users/delete.js'));

// Handle any method
router.all('/health', () => import('./routes/health.js'));
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `path` | `string` | Route path with optional parameters (:id) |
| `action` | `ImportRouterAction<R, S, X>` | Function that returns a dynamic import |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The ImportRouter instance to allow method chaining.

## 3. Event-Based Routing

The following example shows how to route events to dynamic imports.

```typescript
// Route custom events to imports
router.on('user-login', () => import('./handlers/user-login.js'));
router.on('data-updated', () => import('./handlers/data-updated.js'));

// Route with regex patterns
router.on(/^email-.+$/, () => import('./handlers/email-handler.js'));
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string\|RegExp` | Event name or pattern |
| `entry` | `ImportRouterAction<R, S, X>` | Function that returns a dynamic import |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The ImportRouter instance to allow method chaining.

## 4. Creating Actions from Imports

The following example shows how import functions are converted to executable actions.

```typescript
// Internal method - creates action from import function
const action = router.action(
  'GET /users', 
  () => import('./routes/users.js'), 
  0
);

// The action executes the import and calls the default export
await action(request, response, context);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string` | Event name for tracking |
| `action` | `ImportRouterAction<R, S, X>` | Function that returns a dynamic import |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

An async function that executes the import and calls the default export.

## 5. Using Other ImportRouters

The following example shows how to merge imports from another router.

```typescript
const apiRouter = new ImportRouter(actionRouter, listen);
apiRouter.get('/api/users', () => import('./api/users.js'));

const mainRouter = new ImportRouter(actionRouter, listen);
mainRouter.use(apiRouter); // Merges import configurations
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `router` | `ImportRouter<R, S, X>` | Another ImportRouter to merge imports from |

**Returns**

The ImportRouter instance to allow method chaining.

## 6. Dynamic Import Functions

Import functions provide flexible module loading with conditional logic.

### 6.1. Basic Import Function

The following example shows a basic dynamic import function.

```typescript
router.get('/users', () => import('./routes/users.js'));

// The imported module should export a default function
// ./routes/users.js
export default async function(req, res, ctx) {
  const users = await getUsers();
  res.setResults(users);
}
```

### 6.2. Conditional Import Function

The following example shows how to implement conditional imports based on runtime conditions.

```typescript
router.get('/dashboard', () => {
  const userRole = getCurrentUserRole();
  
  if (userRole === 'admin') {
    return import('./routes/admin-dashboard.js');
  } else if (userRole === 'user') {
    return import('./routes/user-dashboard.js');
  } else {
    return import('./routes/guest-dashboard.js');
  }
});
```

### 6.3. Environment-Based Import Function

The following example shows how to use different imports based on environment.

```typescript
router.get('/debug', () => {
  if (process.env.NODE_ENV === 'development') {
    return import('./routes/debug/full.js');
  } else {
    return import('./routes/debug/minimal.js');
  }
});
```

### 6.4. Feature Flag Import Function

The following example shows how to use feature flags to control imports.

```typescript
router.get('/new-feature', () => {
  if (isFeatureEnabled('new-ui')) {
    return import('./routes/new-feature-v2.js');
  } else {
    return import('./routes/new-feature-v1.js');
  }
});
```

### 6.5. Async Import Function

The following example shows how to perform async operations before importing.

```typescript
router.get('/dynamic', async () => {
  // Can perform async operations before importing
  const config = await loadConfiguration();
  
  if (config.useNewHandler) {
    return import('./routes/new-handler.js');
  } else {
    return import('./routes/old-handler.js');
  }
});
```

## 7. Code Splitting Benefits

ImportRouter enables automatic code splitting and lazy loading for optimal performance.

### 7.1. Bundle Optimization

The following examples show how ImportRouter optimizes bundle size through code splitting.

```typescript
// Large admin panel is only loaded when needed
router.get('/admin/*', () => import('./routes/admin/index.js'));

// Heavy data processing is split into separate chunks
router.post('/process-data', () => import('./routes/data-processor.js'));

// Third-party integrations are loaded on demand
router.get('/integrations/:service', () => {
  const service = getServiceFromPath();
  return import(`./integrations/${service}.js`);
});
```

### 7.2. Performance Benefits

ImportRouter provides the following performance advantages:

 - **Reduced Initial Bundle Size**: Only core routes are included in the main bundle
 - **Faster Initial Load**: Application starts faster with smaller initial payload
 - **On-Demand Loading**: Route handlers are loaded only when accessed
 - **Better Caching**: Individual route chunks can be cached separately
 - **Progressive Loading**: Users only download code for features they use

### 7.3. Build-Time Analysis

The following example shows how bundlers can analyze import patterns for optimization.

```typescript
// Bundlers can analyze import patterns for optimization
console.log(router.imports);
// Map {
//   'GET /users' => Set([{ 
//     import: () => import('./routes/users.js'), 
//     priority: 0 
//   }]),
//   'POST /users' => Set([{ 
//     import: () => import('./routes/create.js'), 
//     priority: 0 
//   }])
// }
```

## 8. Error Handling

ImportRouter provides robust error handling for dynamic imports.

### 8.1. Import Failure Handling

The following example shows how to handle import failures with fallback strategies.

```typescript
router.get('/fallback-example', async () => {
  try {
    return await import('./routes/primary.js');
  } catch (error) {
    console.warn('Primary route failed, using fallback');
    return await import('./routes/fallback.js');
  }
});
```

### 8.2. Module Validation

The following example shows how to validate imported modules.

```typescript
router.get('/validated', async () => {
  const module = await import('./routes/example.js');
  
  if (!module.default || typeof module.default !== 'function') {
    throw new Error('Invalid route module: missing default export');
  }
  
  return module;
});
```

### 8.3. Graceful Degradation

The following example shows how to implement graceful degradation when imports fail.

```typescript
router.get('/optional-feature', () => {
  return import('./routes/optional.js').catch(() => {
    // Return a minimal handler if the feature module fails
    return {
      default: async (req, res, ctx) => {
        res.setError('Feature not available', {}, [], 503);
        return false;
      }
    };
  });
});
```

## 9. Integration with ActionRouter

ImportRouter works as an extension of ActionRouter, sharing the same event system and routing capabilities.

### 9.1. Initialization

The following example shows how ImportRouter integrates with ActionRouter.

```typescript
import ActionRouter from '@stackpress/ingest/plugin/ActionRouter';

const actionRouter = new ActionRouter(context);

// ImportRouter is automatically available
actionRouter.import.get('/users', () => import('./routes/users.js'));

// Or create standalone
const importRouter = new ImportRouter(actionRouter, listen);
```

### 9.2. Mixed Routing Approaches

The following example shows how to combine different routing approaches.

```typescript
// Combine different routing approaches
actionRouter.get('/immediate', immediateHandler);
actionRouter.entry.get('/file-based', './routes/file.js');
actionRouter.import.get('/lazy', () => import('./routes/lazy.js'));
actionRouter.view.get('/template', './views/template.hbs');

// All routes work together in the same system
```

## 10. Best Practices

The following guidelines help ensure effective use of ImportRouter in production applications.

### 10.1. Strategic Code Splitting

The following examples show recommended code splitting strategies.

```typescript
// Split by feature boundaries
router.get('/auth/*', () => import('./features/auth/routes.js'));
router.get('/billing/*', () => import('./features/billing/routes.js'));
router.get('/analytics/*', () => import('./features/analytics/routes.js'));

// Split heavy dependencies
router.get('/pdf-export', () => import('./routes/pdf-export.js')); // Heavy PDF library
router.get('/image-process', () => import('./routes/image-process.js')); // Heavy image library
```

### 10.2. Performance Optimization

The following example shows how to preload critical routes for better performance.

```typescript
// Preload critical routes
const criticalRoutes = [
  () => import('./routes/home.js'),
  () => import('./routes/login.js'),
  () => import('./routes/dashboard.js')
];

// Preload during idle time
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    criticalRoutes.forEach(importFn => importFn());
  });
}
```

### 10.3. Error Resilience

The following example shows how to implement retry logic for unstable imports.

```typescript
// Implement retry logic
router.get('/retry-example', async () => {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      return await import('./routes/unstable.js');
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }
});
```

### 10.4. Development vs Production

The following example shows different strategies for different environments.

```typescript
// Different strategies for different environments
const isDev = process.env.NODE_ENV === 'development';

router.get('/dev-tools', () => {
  if (isDev) {
    return import('./routes/dev-tools.js');
  } else {
    return Promise.resolve({
      default: (req, res, ctx) => {
        res.setError('Not available in production', {}, [], 404);
        return false;
      }
    });
  }
});
```

### 10.5. Type Safety

The following example shows how to implement type safety with ImportRouter.

```typescript
// Type-safe import functions
interface RouteModule {
  default: (req: Request, res: Response, ctx: Context) => Promise<boolean>;
}

router.get('/typed', (): Promise<RouteModule> => {
  return import('./routes/typed.js');
});
```

### 10.6. Bundle Analysis

The following example shows how to track import patterns for optimization.

```typescript
// Track import patterns for optimization
const importStats = new Map();

router.get('/tracked', () => {
  const route = './routes/tracked.js';
  importStats.set(route, (importStats.get(route) || 0) + 1);
  return import(route);
});

// Log popular routes for optimization
setInterval(() => {
  console.log('Import statistics:', importStats);
}, 60000);
```
