# Server

The Server class is the core of the Ingest framework, extending Router with configuration management and plugin support.

## Overview

The Server class provides a generic server implementation that:
- Extends the Router class for event-driven routing
- Manages configuration through a nested configuration object
- Supports a plugin system for modular functionality
- Provides generic request and response wrappers
- Works with both HTTP and WHATWG server implementations

```typescript
import { server } from '@stackpress/ingest/http';
// or
import { server } from '@stackpress/ingest/whatwg';

const app = server();
```

## Type Parameters

The Server class accepts three generic type parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `C` | `UnknownNest` | Configuration map type |
| `R` | `unknown` | Request resource type |
| `S` | `unknown` | Response resource type |

## Properties

The following properties are available when instantiating a Server.

| Property | Type | Description |
|----------|------|-------------|
| `config` | `CallableNest<C>` | Configuration object for server settings |
| `loader` | `PluginLoader` | Plugin loader instance for managing plugins |
| `plugins` | `CallableMap` | Map of registered plugin configurations |

## Methods

The following methods are available when instantiating a Server.

### Bootstrapping Plugins

The following example shows how to load and initialize all registered plugins.

```typescript
const app = server();
await app.bootstrap();
```

**Returns**

The Server instance to allow method chaining.

### Creating a Server Instance

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

### Handling Requests

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

### Plugin Management

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

## Setters

The following setters are available for customizing server behavior.

### Setting Gateway

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

### Setting Handler

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

## Factory Functions

The following factory functions are available for creating server instances.

### server()

Creates a new Server instance with optional configuration.

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

### router()

Creates a new Router instance without server functionality.

```typescript
import { router } from '@stackpress/ingest';

const appRouter = router();
```

**Returns**

A new Router instance.

### action()

Type helper for creating type-safe action handlers.

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

## Configuration Management

The Server class provides a powerful configuration system through the `config` property.

### Setting Configuration

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

### Reading Configuration

```typescript
// Get entire config section
const dbConfig = app.config.get('database');

// Get nested values
const dbHost = app.config.get('database', 'host');

// Use path notation
const appName = app.config.path('app.name');
```

## Plugin System Integration

The Server class is designed to work seamlessly with the plugin system.

### Plugin Loading

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

### Plugin Access

```typescript
// Access plugin functionality
const db = app.plugin('database');
const users = await db.query('SELECT * FROM users');

const auth = app.plugin('auth');
const token = await auth.generateToken(user);
```

## Examples

### Basic HTTP Server

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

### Serverless Function

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

### With Plugins

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

## Inheritance

The Server class extends the Router class, inheriting all routing functionality:

- Event-driven routing with pattern matching
- Multiple routing interfaces (action, entry, import, view)
- Request and response handling
- Event emission and listening capabilities

See [Router.md](./Router.md) for detailed routing documentation.
