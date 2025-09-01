# ViewRouter

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

 1. [Properties](#1-properties)
 2. [HTTP Method Routing](#2-http-method-routing)
 3. [Event-Based Routing](#3-event-based-routing)
 4. [Template Engine Configuration](#4-template-engine-configuration)
 5. [Render Function Configuration](#5-render-function-configuration)
 6. [Creating Actions from Views](#6-creating-actions-from-views)
 7. [Using Other ViewRouters](#7-using-other-viewrouters)
 8. [Template Engine Integration](#8-template-engine-integration)
 9. [Data Flow and Context](#9-data-flow-and-context)
 10. [Error Handling and Fallbacks](#10-error-handling-and-fallbacks)
 11. [Integration with ActionRouter](#11-integration-with-actionrouter)
 12. [Best Practices](#12-best-practices)

## 1. Properties

The following properties are available when instantiating a ViewRouter.

| Property | Type | Description |
|----------|------|-------------|
| `views` | `Map<string, Set<ViewRouterTaskItem>>` | Map of event names to view file configurations (readonly) |
| `engine` | `ViewEngine<R, S, X>` | Template engine function for rendering views |
| `render` | `ViewRender` | Render function for processing templates |

## 2. HTTP Method Routing

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

## 3. Event-Based Routing

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

## 4. Template Engine Configuration

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

## 5. Render Function Configuration

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

## 6. Creating Actions from Views

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

## 7. Using Other ViewRouters

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

## 8. Template Engine Integration

ViewRouter supports various template engines through the engine configuration.

### 8.1. Handlebars Integration

The following example shows how to integrate Handlebars with ViewRouter.

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

### 8.2. EJS Integration

The following example shows how to integrate EJS with ViewRouter.

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

### 8.3. Mustache Integration

The following example shows how to integrate Mustache with ViewRouter.

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

### 8.4. Custom Template Engine

The following example shows how to create a custom template engine with layout support.

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

## 9. Data Flow and Context

ViewRouter provides rich context to templates through request data.

### 9.1. Request Data Access

The following example shows how templates receive request data.

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

### 9.2. Context Integration

The following example shows how to integrate server context into templates.

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

## 10. Error Handling and Fallbacks

ViewRouter provides robust error handling for template rendering.

### 10.1. Template Error Handling

The following example shows how to handle template rendering errors.

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

### 10.2. Development vs Production Error Handling

The following example shows different error handling strategies for different environments.

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

## 11. Integration with ActionRouter

ViewRouter works as an extension of ActionRouter, sharing the same event system and routing capabilities.

### 11.1. Initialization

The following example shows how ViewRouter integrates with ActionRouter.

```typescript
import ActionRouter from '@stackpress/ingest/plugin/ActionRouter';

const actionRouter = new ActionRouter(context);

// ViewRouter is automatically available
actionRouter.view.get('/home', './views/home.hbs');

// Or create standalone
const viewRouter = new ViewRouter(actionRouter, listen);
```

### 11.2. Mixed Routing Approaches

The following example shows how to combine different routing approaches.

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

## 12. Best Practices

The following guidelines help ensure effective use of ViewRouter in production applications.

### 12.1. Template Organization

The following examples show recommended template organization patterns.

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

### 12.2. Performance Optimization

The following example shows how to implement template caching for better performance.

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

### 12.3. Security Considerations

The following example shows important security considerations for ViewRouter.

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

### 12.4. SEO and Meta Tags

The following example shows how to handle SEO and meta tags in templates.

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
