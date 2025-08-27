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

## Properties

The following properties are available when instantiating an ImportRouter.

| Property | Type | Description |
|----------|------|-------------|
| `imports` | `Map<string, Set<ImportRouterTaskItem<R, S, X>>>` | Map of event names to import function configurations (readonly) |

## Methods

The following methods are available when instantiating an ImportRouter.

### HTTP Method Routing

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

### Event-Based Routing

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

### Creating Actions from Imports

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

### Using Other ImportRouters

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

## Dynamic Import Functions

Import functions provide flexible module loading with conditional logic:

### Basic Import Function

```typescript
router.get('/users', () => import('./routes/users.js'));

// The imported module should export a default function
// ./routes/users.js
export default async function(req, res, ctx) {
  const users = await getUsers();
  res.setResults(users);
}
```

### Conditional Import Function

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

### Environment-Based Import Function

```typescript
router.get('/debug', () => {
  if (process.env.NODE_ENV === 'development') {
    return import('./routes/debug/full.js');
  } else {
    return import('./routes/debug/minimal.js');
  }
});
```

### Feature Flag Import Function

```typescript
router.get('/new-feature', () => {
  if (isFeatureEnabled('new-ui')) {
    return import('./routes/new-feature-v2.js');
  } else {
    return import('./routes/new-feature-v1.js');
  }
});
```

### Async Import Function

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

## Code Splitting Benefits

ImportRouter enables automatic code splitting and lazy loading:

### Bundle Optimization

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

### Performance Benefits

1. **Reduced Initial Bundle Size**: Only core routes are included in the main bundle
2. **Faster Initial Load**: Application starts faster with smaller initial payload
3. **On-Demand Loading**: Route handlers are loaded only when accessed
4. **Better Caching**: Individual route chunks can be cached separately
5. **Progressive Loading**: Users only download code for features they use

### Build-Time Analysis

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

## Error Handling

ImportRouter provides robust error handling for dynamic imports:

### Import Failure Handling

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

### Module Validation

```typescript
router.get('/validated', async () => {
  const module = await import('./routes/example.js');
  
  if (!module.default || typeof module.default !== 'function') {
    throw new Error('Invalid route module: missing default export');
  }
  
  return module;
});
```

### Graceful Degradation

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

## Integration with ActionRouter

ImportRouter works as an extension of ActionRouter:

### Initialization

```typescript
import ActionRouter from '@stackpress/ingest/plugin/ActionRouter';

const actionRouter = new ActionRouter(context);

// ImportRouter is automatically available
actionRouter.import.get('/users', () => import('./routes/users.js'));

// Or create standalone
const importRouter = new ImportRouter(actionRouter, listen);
```

### Mixed Routing Approaches

```typescript
// Combine different routing approaches
actionRouter.get('/immediate', immediateHandler);
actionRouter.entry.get('/file-based', './routes/file.js');
actionRouter.import.get('/lazy', () => import('./routes/lazy.js'));
actionRouter.view.get('/template', './views/template.hbs');

// All routes work together in the same system
```

## Best Practices

### Strategic Code Splitting

```typescript
// Split by feature boundaries
router.get('/auth/*', () => import('./features/auth/routes.js'));
router.get('/billing/*', () => import('./features/billing/routes.js'));
router.get('/analytics/*', () => import('./features/analytics/routes.js'));

// Split heavy dependencies
router.get('/pdf-export', () => import('./routes/pdf-export.js')); // Heavy PDF library
router.get('/image-process', () => import('./routes/image-process.js')); // Heavy image library
```

### Performance Optimization

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

### Error Resilience

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

### Development vs Production

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

### Type Safety

```typescript
// Type-safe import functions
interface RouteModule {
  default: (req: Request, res: Response, ctx: Context) => Promise<boolean>;
}

router.get('/typed', (): Promise<RouteModule> => {
  return import('./routes/typed.js');
});
```

### Bundle Analysis

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

## ViewRouter

Template-based routing system that routes to view files for server-side rendering, supporting various template engines and rendering strategies.

```typescript
import ViewRouter from '@stackpress/ingest/plugin/ViewRouter';

const router = new ViewRouter(actionRouter, listen);

// Configure template engine
router.engine = async (filePath, req, res, ctx) => {
  const html = await renderTemplate(filePath, req.data.get());
  res.setHTML(html);
};

// Route to template files
router.get('/profile', './views/profile.hbs');
router.get('/dashboard', './views/dashboard.ejs');
```

### Properties

The following properties are available when instantiating a ViewRouter.

| Property | Type | Description |
|----------|------|-------------|
| `views` | `Map<string, Set<ViewRouterTaskItem>>` | Map of event names to view file configurations (readonly) |
| `engine` | `ViewEngine<R, S, X>` | Template engine function for rendering views |
| `render` | `ViewRender` | Render function for processing templates |

### Methods

The following methods are available when instantiating a ViewRouter.

#### HTTP Method Routing

The following examples show how to define view-based routes for different HTTP methods.

```typescript
// GET routes with template rendering
router.get('/home', './views/home.hbs');
router.get('/users/:id', './views/user-profile.ejs');

// POST routes (typically for form submissions)
router.post('/contact', './views/contact-success.hbs');

// Handle any method
router.all('/error', './views/error.hbs');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `path` | `string` | Route path with optional parameters (:id) |
| `action` | `string` | File path to the template file |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The ViewRouter instance to allow method chaining.

#### Event-Based Routing

The following example shows how to route events to template files.

```typescript
// Route custom events to templates
router.on('user-welcome', './views/welcome.hbs');
router.on('order-confirmation', './views/order-confirm.ejs');

// Route with regex patterns
router.on(/^admin-.+$/, './views/admin-layout.hbs');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string\|RegExp` | Event name or pattern |
| `entry` | `string` | File path to the template file |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The ViewRouter instance to allow method chaining.

#### Template Engine Configuration

The following example shows how to configure the template engine.

```typescript
// Handlebars engine
router.engine = async (filePath, req, res, ctx) => {
  const template = await fs.readFile(filePath, 'utf8');
  const compiled = Handlebars.compile(template);
  const html = compiled(req.data.get());
  res.setHTML(html);
};

// EJS engine
router.engine = async (filePath, req, res, ctx) => {
  const html = await ejs.renderFile(filePath, req.data.get());
  res.setHTML(html);
};

// Custom engine with layout support
router.engine = async (filePath, req, res, ctx) => {
  const data = req.data.get();
  const html = await renderWithLayout(filePath, data);
  res.setHTML(html);
};
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `filePath` | `string` | Path to the template file |
| `req` | `Request<R>` | Request object with data |
| `res` | `Response<S>` | Response object for output |
| `ctx` | `X` | Context object |

**Returns**

`TaskResult` - void, boolean, or Promise of these types.

#### Render Function Configuration

The following example shows how to configure the render function for standalone template processing.

```typescript
// Basic render function
router.render = async (filePath, props, options) => {
  const template = await fs.readFile(filePath, 'utf8');
  return processTemplate(template, props, options);
};

// Render with caching
const templateCache = new Map();
router.render = async (filePath, props, options) => {
  if (!templateCache.has(filePath)) {
    const template = await fs.readFile(filePath, 'utf8');
    templateCache.set(filePath, template);
  }
  
  const template = templateCache.get(filePath);
  return processTemplate(template, props, options);
};
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `filePath` | `string` | Path to the template file |
| `props` | `UnknownNest` | Template data/props (optional) |
| `options` | `UnknownNest` | Rendering options (optional) |

**Returns**

`string|null|Promise<string|null>` - Rendered template or null if failed.

#### Creating Actions from Views

The following example shows how view files are converted to executable actions.

```typescript
// Internal method - creates action from template path
const action = router.action('GET /profile', './views/profile.hbs', 0);

// The action calls the configured engine with the template path
await action(request, response, context);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string` | Event name for tracking |
| `action` | `string` | File path to the template |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

An async function that calls the template engine with the file path.

#### Using Other ViewRouters

The following example shows how to merge views from another router.

```typescript
const adminRouter = new ViewRouter(actionRouter, listen);
adminRouter.get('/admin/dashboard', './admin/dashboard.hbs');

const mainRouter = new ViewRouter(actionRouter, listen);
mainRouter.use(adminRouter); // Merges view configurations
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `router` | `ViewRouter<R, S, X>` | Another ViewRouter to merge views from |

**Returns**

The ViewRouter instance to allow method chaining.

### Template Engine Integration

ViewRouter supports various template engines through the engine configuration:

#### Handlebars Integration

```typescript
import Handlebars from 'handlebars';
import fs from 'node:fs/promises';

// Configure Handlebars engine
router.engine = async (filePath, req, res, ctx) => {
  try {
    const template = await fs.readFile(filePath, 'utf8');
    const compiled = Handlebars.compile(template);
    const data = {
      ...req.data.get(),
      user: req.data.get('user'),
      url: req.url,
      method: req.method
    };
    const html = compiled(data);
    res.setHTML(html);
  } catch (error) {
    res.setError('Template rendering failed', {}, [], 500);
  }
};

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', (date) => {
  return new Date(date).toLocaleDateString();
});

// Use the router
router.get('/profile', './views/profile.hbs');
```

#### EJS Integration

```typescript
import ejs from 'ejs';

// Configure EJS engine
router.engine = async (filePath, req, res, ctx) => {
  try {
    const data = {
      ...req.data.get(),
      user: req.data.get('user'),
      helpers: {
        formatDate: (date) => new Date(date).toLocaleDateString()
      }
    };
    const html = await ejs.renderFile(filePath, data);
    res.setHTML(html);
  } catch (error) {
    res.setError('Template rendering failed', {}, [], 500);
  }
};

router.get('/dashboard', './views/dashboard.ejs');
```

#### Mustache Integration

```typescript
import Mustache from 'mustache';
import fs from 'node:fs/promises';

// Configure Mustache engine
router.engine = async (filePath, req, res, ctx) => {
  try {
    const template = await fs.readFile(filePath, 'utf8');
    const data = req.data.get();
    const html = Mustache.render(template, data);
    res.setHTML(html);
  } catch (error) {
    res.setError('Template rendering failed', {}, [], 500);
  }
};

router.get('/simple', './views/simple.mustache');
```

#### Custom Template Engine

```typescript
// Custom template engine with layout support
router.engine = async (filePath, req, res, ctx) => {
  try {
    const data = req.data.get();
    const layout = data.layout || 'default';
    
    // Load template and layout
    const template = await fs.readFile(filePath, 'utf8');
    const layoutTemplate = await fs.readFile(`./layouts/${layout}.hbs`, 'utf8');
    
    // Render template
    const content = Handlebars.compile(template)(data);
    
    // Render with layout
    const html = Handlebars.compile(layoutTemplate)({
      ...data,
      content
    });
    
    res.setHTML(html);
  } catch (error) {
    res.setError('Template rendering failed', {}, [], 500);
  }
};
```

### Data Flow and Context

ViewRouter provides rich context to templates through request data:

#### Request Data Access

```typescript
router.get('/user/:id', './views/user.hbs');

// Template receives all request data
// ./views/user.hbs
/*
<h1>User Profile</h1>
<p>User ID: {{id}}</p>
<p>Name: {{name}}</p>
<p>Email: {{email}}</p>
*/

// Route handler can prepare data
router.on('GET /user/:id', async (req, res, ctx) => {
  const userId = req.data.get('id');
  const user = await getUser(userId);
  
  // Add user data to request
  req.data.set('name', user.name);
  req.data.set('email', user.email);
  
  return true; // Continue to view rendering
}, 10); // Higher priority than view router
```

#### Context Integration

```typescript
router.engine = async (filePath, req, res, ctx) => {
  const data = {
    // Request data
    ...req.data.get(),
    
    // Request metadata
    url: req.url.pathname,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    
    // Context data (server instance)
    config: ctx.config.get(),
    
    // Helper functions
    helpers: {
      asset: (path) => `/assets/${path}`,
      route: (name, params) => ctx.generateRoute(name, params),
      csrf: () => req.session.get('csrf_token')
    }
  };
  
  const html = await renderTemplate(filePath, data);
  res.setHTML(html);
};
```

### Error Handling and Fallbacks

ViewRouter provides robust error handling for template rendering:

#### Template Error Handling

```typescript
router.engine = async (filePath, req, res, ctx) => {
  try {
    const html = await renderTemplate(filePath, req.data.get());
    res.setHTML(html);
  } catch (error) {
    console.error('Template error:', error);
    
    // Try fallback template
    try {
      const fallbackHtml = await renderTemplate('./views/error.hbs', {
        error: error.message,
        path: filePath
      });
      res.setHTML(fallbackHtml, 500);
    } catch (fallbackError) {
      // Ultimate fallback
      res.setHTML('<h1>Template Error</h1><p>Unable to render page</p>', 500);
    }
  }
};
```

#### Development vs Production Error Handling

```typescript
const isDev = process.env.NODE_ENV === 'development';

router.engine = async (filePath, req, res, ctx) => {
  try {
    const html = await renderTemplate(filePath, req.data.get());
    res.setHTML(html);
  } catch (error) {
    if (isDev) {
      // Detailed error in development
      res.setHTML(`
        <h1>Template Error</h1>
        <p><strong>File:</strong> ${filePath}</p>
        <p><strong>Error:</strong> ${error.message}</p>
        <pre>${error.stack}</pre>
      `, 500);
    } else {
      // Generic error in production
      const errorHtml = await renderTemplate('./views/500.hbs', {});
      res.setHTML(errorHtml, 500);
    }
  }
};
```

### Integration with ActionRouter

ViewRouter works as an extension of ActionRouter:

#### Initialization

```typescript
import ActionRouter from '@stackpress/ingest/plugin/ActionRouter';

const actionRouter = new ActionRouter(context);

// ViewRouter is automatically available
actionRouter.view.get('/home', './views/home.hbs');

// Or create standalone
const viewRouter = new ViewRouter(actionRouter, listen);
```

#### Mixed Routing Approaches

```typescript
// API routes return JSON
actionRouter.get('/api/users', async (req, res, ctx) => {
  const users = await getUsers();
  res.setResults(users);
});

// View routes return HTML
actionRouter.view.get('/users', './views/users.hbs');

// Combined approach - API + View
actionRouter.get('/users/:id', async (req, res, ctx) => {
  const user = await getUser(req.data.get('id'));
  req.data.set('user', user);
  return true; // Continue to view
}, 10);

actionRouter.view.get('/users/:id', './views/user.hbs', 0);
```

### Best Practices

#### Template Organization

```typescript
// Organize templates by feature
router.get('/auth/login', './views/auth/login.hbs');
router.get('/auth/register', './views/auth/register.hbs');
router.get('/users/profile', './views/users/profile.hbs');
router.get('/users/settings', './views/users/settings.hbs');

// Use layouts for consistency
router.engine = async (filePath, req, res, ctx) => {
  const data = req.data.get();
  const layout = data.layout || 'main';
  
  const content = await renderTemplate(filePath, data);
  const html = await renderTemplate(`./layouts/${layout}.hbs`, {
    ...data,
    content
  });
  
  res.setHTML(html);
};
```

#### Performance Optimization

```typescript
// Template caching
const templateCache = new Map();
const layoutCache = new Map();

router.engine = async (filePath, req, res, ctx) => {
  // Cache templates in production
  const useCache = process.env.NODE_ENV === 'production';
  
  let template;
  if (useCache && templateCache.has(filePath)) {
    template = templateCache.get(filePath);
  } else {
    template = await fs.readFile(filePath, 'utf8');
    if (useCache) {
      templateCache.set(filePath, template);
    }
  }
  
  const html = Handlebars.compile(template)(req.data.get());
  res.setHTML(html);
};
```

#### Security Considerations

```typescript
router.engine = async (filePath, req, res, ctx) => {
  // Sanitize file path to prevent directory traversal
  const safePath = path.resolve('./views', path.relative('./views', filePath));
  if (!safePath.startsWith(path.resolve('./views'))) {
    res.setError('Invalid template path', {}, [], 400);
    return;
  }
  
  const data = {
    ...req.data.get(),
    // Add CSRF token
    csrfToken: req.session.get('csrf_token'),
    // Escape user input
    helpers: {
      escape: (str) => Handlebars.escapeExpression(str)
    }
  };
  
  const html = await renderTemplate(safePath, data);
  res.setHTML(html);
};
```

#### SEO and Meta Tags

```typescript
router.engine = async (filePath, req, res, ctx) => {
  const data = {
    ...req.data.get(),
    meta: {
      title: req.data.get('title') || 'Default Title',
      description: req.data.get('description') || 'Default Description',
      keywords: req.data.get('keywords') || 'default, keywords',
      canonical: `${req.url.origin}${req.url.pathname}`
    }
  };
  
  const html = await renderTemplate(filePath, data);
  res.setHTML(html);
};
```