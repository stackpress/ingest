# Server

The Server class is the core of the Ingest framework, extending Router with configuration management and plugin support.

```typescript
import { server } from '@stackpress/ingest/http';
// or
import { server } from '@stackpress/ingest/whatwg';

const app = server();
```

 1. [Properties](#1-properties)
 2. [Methods](#2-methods)
 3. [Static Methods](#2-static-methods)
 4. [Configuration Management](#4-configuration-management)
 5. [Plugin System Integration](#5-plugin-system-integration)
 6. [Examples](#6-examples)

## 1. Properties

The following properties are available when instantiating a Server.

| Property | Type | Description |
|----------|------|-------------|
| `config` | `CallableNest<C>` | Configuration object for server settings |
| `loader` | `PluginLoader` | Plugin loader instance for managing plugins |
| `plugins` | `CallableMap` | Map of registered plugin configurations |

## 2. Methods

The following methods are available when instantiating a Server.

### 2.1. Bootstrapping Plugins

The following example shows how to load and initialize all registered plugins.

```typescript
const app = server();
await app.bootstrap();
```

**Parameters**

None.

**Returns**

The Server instance to allow method chaining.

### 2.2. Creating a Server Instance

The following example shows how to create a native server instance.

```typescript
const app = server();
const httpServer = app.create({ port: 3000 });
httpServer.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `options` | `NodeServerOptions` | Server configuration options (optional) |

**Returns**

A native Node.js HTTP server instance.

### 2.3. Handling Requests

The following example shows how to handle requests directly.

```typescript
const app = server();
const result = await app.handle(request, response);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `request` | `R` | Request object (generic type) |
| `response` | `S` | Response object (generic type) |

**Returns**

A promise that resolves to the response object.

### 2.4. Plugin Management

The following example shows how to register and retrieve plugins.

```typescript
// Register a plugin configuration
app.register('auth', { 
  secret: 'my-secret',
  expiresIn: '24h'
});

// Get a plugin configuration
const authConfig = app.plugin<AuthConfig>('auth');
console.log(authConfig.secret);
```

**Parameters for register**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Plugin name |
| `config` | `Record<string, any>` | Plugin configuration object |

**Parameters for plugin**

| Parameter | Type | Description |
|----------|------|-------------|
| `name` | `string` | Plugin name to retrieve |

**Returns**

For `register`: The Server instance to allow method chaining.
For `plugin`: The plugin configuration or undefined if not found.

### 2.5. Setting Gateway

The following example shows how to set a custom gateway function.

```typescript
app.gateway = (server) => {
  return (options) => {
    // Custom server creation logic
    return createCustomServer(options);
  };
};
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `callback` | `ServerGateway` | Gateway function for creating server instances |

**Returns**

None.

### 2.6. Setting Handler

The following example shows how to set a custom request handler.

```typescript
app.handler = async (server, request, response) => {
  // Custom request handling logic
  console.log('Handling request:', request.url);
  return response;
};
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `callback` | `ServerHandler<C, R, S>` | Handler function for processing requests |

**Returns**

None.

## 3. Static Methods

The following methods can be accessed directly from Server itself.

### 3.1. Creating Server Instances

The following example shows how to create a new Server instance with optional configuration.

```typescript
import { server } from '@stackpress/ingest/http';

const app = server({
  gateway: customGateway,
  handler: customHandler
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `options` | `ServerOptions<C, R, S>` | Server configuration options (optional) |

**Returns**

A new Server instance.

### 3.2. Creating Router Instances

The following example shows how to create a new Router instance without server functionality.

```typescript
import { router } from '@stackpress/ingest';

const appRouter = router();
```

**Parameters**

None.

**Returns**

A new Router instance.

### 3.3. Creating Type-Safe Actions

The following example shows how to create type-safe action handlers.

```typescript
import { action } from '@stackpress/ingest';

const userHandler = action<Config, Request, Response>((req, res, server) => {
  // Type-safe handler implementation
  res.setJSON({ message: 'Hello' });
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `action` | `ServerAction<C, R, S>` | Action handler function |

**Returns**

The same action function with proper typing.

## 4. Configuration Management

The Server class provides a powerful configuration system through the `config` property.

### 4.1. Setting Configuration

The following example shows how to set nested configuration values.

```typescript
// Set nested configuration
app.config.set('database', {
  host: 'localhost',
  port: 5432,
  name: 'myapp'
});

// Set individual values
app.config.set('app', 'name', 'My Application');
```

### 4.2. Reading Configuration

The following example demonstrates various ways to read configuration values.

```typescript
// Get entire config section
const dbConfig = app.config.get('database');

// Get nested values
const dbHost = app.config.get('database', 'host');

// Use path notation
const appName = app.config.path('app.name');
```

## 5. Plugin System Integration

The Server class is designed to work seamlessly with the plugin system.

### 5.1. Plugin Loading

The following example shows how plugins are defined and loaded.

```typescript
// Plugins are defined in package.json
{
  "plugins": [
    "./src/plugins/auth",
    "./src/plugins/database",
    "@my-org/logging-plugin"
  ]
}

// Load all plugins
await app.bootstrap();
```

### 5.2. Plugin Access

The following example demonstrates accessing plugin functionality.

```typescript
// Access plugin functionality
const db = app.plugin('database');
const users = await db.query('SELECT * FROM users');

const auth = app.plugin('auth');
const token = await auth.generateToken(user);
```

## 6. Examples

### 6.1. Basic HTTP Server

The following example shows how to create a basic HTTP server.

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

app.get('/', (req, res) => {
  res.setHTML('<h1>Hello World!</h1>');
});

app.get('/api/users', (req, res) => {
  res.setJSON({ users: [] });
});

app.create().listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 6.2. Serverless Function

The following example demonstrates creating a serverless function.

```typescript
import { server } from '@stackpress/ingest/whatwg';

const app = server();

app.get('/api/hello', (req, res) => {
  res.setJSON({ message: 'Hello from serverless!' });
});

export default async function handler(request: Request) {
  const response = new Response();
  return await app.handle(request, response);
}
```

### 6.3. With Plugins

The following example shows how to use the server with plugins.

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

// Configure plugins
app.config.set('auth', {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h'
});

app.config.set('database', {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432')
});

// Load plugins
await app.bootstrap();

// Use plugin functionality
app.get('/protected', (req, res) => {
  const user = req.data.get('user'); // Set by auth plugin
  res.setJSON({ user });
});

app.create().listen(3000);
```
