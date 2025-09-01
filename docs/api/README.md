# API Reference

Complete API documentation for the Ingest framework, providing comprehensive guides for all classes, plugins, and utilities in the framework.

 1. [Core Classes](#1-core-classes)
 2. [Plugin System](#2-plugin-system)
 3. [Routing Interfaces](#3-routing-interfaces)
 4. [Event System](#4-event-system)
 5. [Adapters](#5-adapters)
 6. [Type Safety](#6-type-safety)
 7. [Error Handling](#7-error-handling)
 8. [Build Integration](#8-build-integration)

## 1. Core Classes

The following core classes provide the foundation of the Ingest framework.

### 1.1. Detailed Class Documentation

For comprehensive documentation of individual classes, see the following dedicated pages:

**Core Classes**

- **[Server](./Server.md)** - Main server class with configuration and plugin management
- **[Router](./Router.md)** - Event-driven routing system with pattern matching
- **[Request](./Request.md)** - Cross-platform request wrapper with data access methods
- **[Response](./Response.md)** - Cross-platform response wrapper with multiple output formats
- **[Exception](./Exception.md)** - Enhanced error handling with structured error information
- **[Route](./Route.md)** - Request lifecycle management with hooks and error handling

**Plugin System**

- **[ActionRouter](./ActionRouter.md)** - Function-based routing with multiple interfaces
- **[EntryRouter](./EntryRouter.md)** - File-based routing for modular organization
- **[ImportRouter](./ImportRouter.md)** - Dynamic import routing for code splitting
- **[ViewRouter](./ViewRouter.md)** - Template-based routing for server-side rendering

**Utilities**

- **[Loader](./Loader.md)** - Configuration and plugin loading utilities

**Adapters**

- **[HttpAdapter](./HttpAdapter.md)** - Node.js HTTP server integration
- **[WhatwgAdapter](./WhatwgAdapter.md)** - WHATWG Fetch API integration for serverless

### 1.2. Server

The Server class is the core of the Ingest framework, extending Router with configuration management and plugin support.

```typescript
import { server } from '@stackpress/ingest/http';
// or
import { server } from '@stackpress/ingest/whatwg';

const app = server(options);
```

#### 1.2.1. Properties

The following properties are available when instantiating a Server.

| Property | Type | Description |
|----------|------|-------------|
| `config` | `CallableNest` | Configuration object for server settings |
| `loader` | `PluginLoader` | Plugin loader instance |
| `plugins` | `CallableMap` | Map of registered plugins |

#### 1.2.2. Methods

The following methods are available when instantiating a Server.

##### 1.2.2.1. Bootstrapping Plugins

The following example shows how to load and initialize plugins.

```typescript
await app.bootstrap();
```

**Returns**

The Server instance to allow method chaining.

##### 1.2.2.2. Creating a Server Instance

The following example shows how to create a native server instance.

```typescript
const server = app.create({ port: 3000 });
server.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `options` | `NodeServerOptions` | Server configuration options |

**Returns**

A native Node.js HTTP server instance.

##### 1.2.2.3. Handling Requests

The following example shows how to handle requests directly.

```typescript
const result = await app.handle(request, response);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `request` | `R` | Request object (generic type) |
| `response` | `S` | Response object (generic type) |

**Returns**

A promise that resolves to the response object.

##### 1.2.2.4. Plugin Management

The following example shows how to register and retrieve plugins.

```typescript
// Register a plugin
app.register('auth', { secret: 'my-secret' });

// Get a plugin
const authConfig = app.plugin<AuthConfig>('auth');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Plugin name |
| `config` | `Record<string, any>` | Plugin configuration |

**Returns**

For `register`: The Server instance to allow method chaining.
For `plugin`: The plugin configuration or undefined.

### 1.3. Router

The Router class provides event-driven routing capabilities with pattern matching and parameter extraction.

```typescript
import { Router } from '@stackpress/ingest';

const router = new Router();
```

The following methods are available when instantiating a Router.

#### 1.3.1. Defining Routes

The following example shows how to define routes with different HTTP methods.

```typescript
router.route('GET', '/users/:id', async (req, res) => {
  const userId = req.data.get('id');
  res.setJSON({ id: userId });
});

router.route('POST', '/users', async (req, res) => {
  const userData = req.data.get();
  res.setJSON(userData, 201);
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `method` | `string` | HTTP method (GET, POST, PUT, DELETE, etc.) |
| `path` | `string` | Route path with optional parameters |
| `action` | `RouterAction` | Route handler function |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The Router instance to allow method chaining.

#### 1.3.2. Resolving Routes

The following example shows how to resolve routes and get response data.

```typescript
const response = await router.resolve('GET', '/users/123');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `method` | `string` | HTTP method |
| `path` | `string` | Route path |
| `request` | `Record<string, any>` | Request data (optional) |

**Returns**

A promise that resolves to a StatusResponse object.

#### 1.3.3. Creating Request/Response Objects

The following example shows how to create request and response objects.

```typescript
const req = router.request({
  url: 'http://example.com/api',
  method: 'POST',
  data: { name: 'John' }
});

const res = router.response({
  headers: { 'Content-Type': 'application/json' }
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `init` | `RequestOptions` | Request initialization options |
| `init` | `ResponseOptions` | Response initialization options |

**Returns**

A new Request or Response instance.

### 1.4. Request

The Request class provides a generic wrapper for handling HTTP requests across different platforms.

#### 1.4.1. Properties

The following properties are available when instantiating a Request.

| Property | Type | Description |
|----------|------|-------------|
| `data` | `CallableNest` | Combined data from query, post, and additional data |
| `headers` | `CallableMap` | Request headers |
| `query` | `CallableNest` | URL query parameters |
| `post` | `CallableNest` | POST body data |
| `session` | `CallableSession` | Session data |
| `url` | `URL` | Request URL object |
| `method` | `Method` | HTTP method |
| `body` | `Body` | Raw request body |
| `loaded` | `boolean` | Whether the body has been loaded |


#### 1.4.2. Loading Request Body

The following example shows how to load the request body asynchronously.

```typescript
await req.load();
console.log(req.body); // Access the loaded body
```

**Returns**

The Request instance to allow method chaining.

### 1.5. Response

The Response class provides a generic wrapper for handling HTTP responses across different platforms.

#### 1.5.1. Properties

The following properties are available when instantiating a Response.

| Property | Type | Description |
|----------|------|-------------|
| `headers` | `CallableMap` | Response headers |
| `session` | `CallableSession` | Session data |
| `errors` | `CallableNest` | Validation errors |
| `data` | `CallableNest` | Response data |
| `body` | `Body` | Response body |
| `code` | `number` | HTTP status code |
| `status` | `string` | HTTP status message |

#### 1.5.2. Methods

The following methods are available when instantiating a Response.

##### 1.5.2.1. Setting JSON Response

The following example shows how to set a JSON response.

```typescript
res.setJSON({ message: 'Success', data: results });
res.setJSON('{"message": "Success"}', 201, 'Created');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `body` | `string\|object` | JSON data or string |
| `code` | `number` | HTTP status code (default: 200) |
| `status` | `string` | HTTP status message (optional) |

**Returns**

The Response instance to allow method chaining.

##### 1.5.2.2. Setting HTML Response

The following example shows how to set an HTML response.

```typescript
res.setHTML('<h1>Welcome</h1>', 200, 'OK');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `body` | `string` | HTML content |
| `code` | `number` | HTTP status code (default: 200) |
| `status` | `string` | HTTP status message (optional) |

**Returns**

The Response instance to allow method chaining.

##### 1.5.2.3. Setting Error Response

The following example shows how to set an error response.

```typescript
res.setError('Invalid input', { name: 'required' }, [], 400);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `error` | `string` | Error message |
| `errors` | `object` | Validation errors (default: {}) |
| `stack` | `array` | Stack trace (default: []) |
| `code` | `number` | HTTP status code (default: 400) |
| `status` | `string` | HTTP status message (optional) |

**Returns**

The Response instance to allow method chaining.

##### 1.5.2.4. Redirecting

The following example shows how to redirect the response.

```typescript
res.redirect('/login', 302, 'Found');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `url` | `string` | Redirect URL |
| `code` | `number` | HTTP status code (default: 302) |
| `status` | `string` | HTTP status message (optional) |

**Returns**

The Response instance to allow method chaining.

## 2. Plugin System

The plugin system allows you to extend server functionality through modular components.

### 2.1. Plugin Structure

A plugin is a function that receives the server instance and configures it.

```typescript
export default function myPlugin(server) {
  // Configure the server
  server.config.set('myPlugin', { enabled: true });
  
  // Add middleware
  server.on('request', (req, res) => {
    console.log('Request received');
  });
  
  // Register components
  server.register('myComponent', { data: 'value' });
}
```

### 2.2. Plugin Registration

Add plugins to your `package.json` to enable automatic discovery and loading.

```json
{
  "plugins": [
    "./src/plugins/auth",
    "./src/plugins/logging",
    "@my-org/ingest-plugin"
  ]
}
```

### 2.3. Plugin Loader

The PluginLoader class handles plugin discovery and loading.

```typescript
import { PluginLoader } from '@stackpress/ingest';

const loader = new PluginLoader({
  cwd: process.cwd(),
  packageFile: 'package.json'
});

await loader.bootstrap(async (name, plugin) => {
  // Handle plugin loading
});
```

## 3. Routing Interfaces

Ingest provides four different routing interfaces for maximum flexibility.

### 3.1. Action Router

Traditional Express.js-like routing with inline handlers.

```typescript
app.action.get('/users', (req, res) => {
  res.setJSON({ users: [] });
});

app.action.post('/users', (req, res) => {
  const userData = req.data.get();
  res.setJSON(userData, 201);
});
```

### 3.2. Entry Router

File-based routing that loads handlers from files.

```typescript
app.entry.get('/users', './routes/users.js');
app.entry.post('/users', './routes/create-user.js');
```

The target file should export a default function:

```typescript
// routes/users.js
export default function handler(req, res) {
  res.setJSON({ users: [] });
}
```

### 3.3. Import Router

Dynamic import routing for code splitting.

```typescript
app.import.get('/users', () => import('./routes/users.js'));
app.import.post('/users', () => import('./routes/create-user.js'));
```

### 3.4. View Router

Template-based routing for rendering views.

```typescript
app.view.get('/users', './views/users.hbs');
app.view.get('/profile', './views/profile.hbs');
```

Requires a template engine to be configured:

```typescript
app.view.engine('hbs', handlebars);
app.view.render('hbs', (template, data) => {
  return handlebars.compile(template)(data);
});
```

## 4. Event System

Ingest is built on a powerful event system that enables reactive programming patterns.

### 4.1. Event Listeners

Add event listeners with optional priority for controlling execution order.

```typescript
// Basic event listener
app.on('request', (req, res) => {
  console.log(`${req.method} ${req.url.pathname}`);
});

// Priority-based listeners (higher numbers execute first)
app.on('request', middleware1, 10);
app.on('request', middleware2, 5);
```

### 4.2. Route Events

Routes automatically generate events that you can listen to.

```typescript
// Listen to specific route events
app.on('GET /api/users', (req, res) => {
  console.log('Users API called');
});

// Pattern-based event matching
app.on('GET /api/*', (req, res) => {
  console.log('API endpoint called');
});
```

### 4.3. Event Hooks

Set up before and after hooks for event processing.

```typescript
app.before = async (event) => {
  console.log('Before:', event.event);
  return true; // Continue processing
};

app.after = async (event) => {
  console.log('After:', event.event);
};
```

## 5. Adapters

Ingest provides adapters for different runtime environments.

### 5.1. HTTP Adapter

For Node.js HTTP servers.

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();
app.get('/', (req, res) => {
  res.setHTML('<h1>Hello World!</h1>');
});

app.create().listen(3000);
```

### 5.2. WHATWG Adapter

For serverless environments and modern web APIs.

```typescript
import { server } from '@stackpress/ingest/whatwg';

const app = server();
app.get('/api/hello', (req, res) => {
  res.setJSON({ message: 'Hello World!' });
});

// Use with Vercel, Netlify, etc.
export default async function handler(request) {
  return await app.handle(request, new Response());
}
```

### 5.3. Custom Adapters

Create custom adapters for specific environments.

```typescript
import { Server } from '@stackpress/ingest';

class CustomServer extends Server {
  constructor() {
    super({
      handler: async (server, req, res) => {
        // Custom request handling logic
        return res;
      }
    });
  }
}
```

## 6. Type Safety

Ingest is built with TypeScript and provides comprehensive type definitions.

```typescript
import type { 
  ServerAction,
  RouterAction,
  RequestOptions,
  ResponseOptions 
} from '@stackpress/ingest';

// Type-safe route handlers
const handler: ServerAction = async (req, res, server) => {
  const userId = req.data.get('id');
  res.setJSON({ id: userId });
};

// Type-safe server configuration
interface Config {
  database: {
    host: string;
    port: number;
  };
}

const app = server<Config>();
app.config.set('database', { host: 'localhost', port: 5432 });
```

## 7. Error Handling

Ingest provides built-in error handling with the Exception class.

```typescript
import { Exception } from '@stackpress/ingest';

// Throw structured exceptions
throw Exception.for('User %s not found', userId).withCode(404);

// Handle validation errors
throw Exception.forErrors({
  email: 'Email is required',
  password: 'Password too short'
});

// Use in route handlers
app.get('/users/:id', (req, res) => {
  const userId = req.data.get('id');
  if (!userId) {
    throw Exception.for('User ID is required').withCode(400);
  }
  
  res.setJSON({ id: userId });
});
```

## 8. Build Integration

Access routing information for build tools and bundlers.

```typescript
const app = server();
app.import.get('/users', () => import('./routes/users.js'));
app.import.get('/posts', () => import('./routes/posts.js'));

// Access build information
console.log(app.routes);      // Route definitions
console.log(app.imports);     // Dynamic imports
console.log(app.entries);     // File entries
console.log(app.views);       // View templates
console.log(app.expressions); // Route patterns
```

This information can be used to:
 - Generate static route manifests
 - Pre-bundle route modules
 - Optimize code splitting
 - Create deployment artifacts
