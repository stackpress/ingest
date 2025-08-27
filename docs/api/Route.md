# Route

Pluggable route handler that manages the complete request lifecycle with hooks for preprocessing, processing, and post-processing.

```typescript
import Route from '@stackpress/ingest/Route';

// Static usage
const success = await Route.emit(
  'user-login',
  request,
  response,
  server
);

// Instance usage
const route = new Route(action, request, response, server);
const success = await route.emit();
```

## Static Methods

The following methods can be accessed directly from Route itself.

### Emitting Route Events

The following example shows how to emit route events with complete lifecycle management.

```typescript
const success = await Route.emit(
  async (req, res, ctx) => {
    const user = await ctx.resolve('get-user', req);
    res.setResults(user);
  },
  request,
  response,
  server
);

// Or with string event
const success = await Route.emit(
  'user-profile',
  request,
  response,
  server
);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `ServerAction<C, R, S>\|string` | Route action function or event name |
| `request` | `Request<R>` | Request object |
| `response` | `Response<S>` | Response object |
| `context` | `Server<C, R, S>` | Server context |

**Returns**

A promise that resolves to `true` if the route completed successfully, `false` if aborted.

## Properties

The following properties are available when instantiating a Route.

| Property | Type | Description |
|----------|------|-------------|
| `event` | `ServerAction<C, R, S>\|string` | The route action or event name |
| `request` | `Request<R>` | Request object (readonly) |
| `response` | `Response<S>` | Response object (readonly) |
| `context` | `Server<C, R, S>` | Server context (readonly) |

## Methods

The following methods are available when instantiating a Route.

### Emitting the Route

The following example shows how to execute the complete route lifecycle.

```typescript
const route = new Route(
  async (req, res, ctx) => {
    res.setJSON({ message: 'Hello World' });
  },
  request,
  response,
  server
);

const success = await route.emit();
if (success) {
  console.log('Route completed successfully');
} else {
  console.log('Route was aborted');
}
```

**Returns**

A promise that resolves to `true` if all lifecycle phases completed, `false` if any phase was aborted.

### Preparing the Request

The following example shows how to run the request preparation phase.

```typescript
const success = await route.prepare();
// Emits 'request' event and handles any errors
```

**Returns**

A promise that resolves to `true` if preparation succeeded, `false` if aborted.

### Processing the Route

The following example shows how to execute the main route processing.

```typescript
const success = await route.process();
// Executes the route action and handles errors/404s
```

**Returns**

A promise that resolves to `true` if processing succeeded, `false` if aborted.

### Shutting Down the Route

The following example shows how to run the response finalization phase.

```typescript
const success = await route.shutdown();
// Emits 'response' event and handles any errors
```

**Returns**

A promise that resolves to `true` if shutdown succeeded, `false` if aborted.

## Route Lifecycle

The Route class manages a three-phase lifecycle for request processing:

### 1. Preparation Phase (`prepare`)

```typescript
// Emits 'request' event for preprocessing
await server.emit('request', request, response);

// Example request preprocessor
server.on('request', async (req, res) => {
  // Authentication
  if (!req.headers.authorization) {
    res.setError('Unauthorized', {}, [], 401);
    return false; // Abort processing
  }
  
  // Request logging
  console.log(`${req.method} ${req.url.pathname}`);
  
  return true; // Continue processing
});
```

**Purpose**: Handle authentication, logging, request validation, and other preprocessing tasks.

### 2. Processing Phase (`process`)

```typescript
// Executes the route action
if (typeof event === 'string') {
  await server.emit(event, request, response);
} else {
  await event(request, response, server);
}

// Handles 404 if no response body or status code
if (!response.body && !response.code) {
  response.setError('Not Found', {}, [], 404);
  await server.emit('error', request, response);
}
```

**Purpose**: Execute the main route logic and handle 404 errors for unhandled routes.

### 3. Shutdown Phase (`shutdown`)

```typescript
// Emits 'response' event for postprocessing
await server.emit('response', request, response);

// Example response postprocessor
server.on('response', async (req, res) => {
  // Add security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Response logging
  console.log(`Response: ${res.code} ${res.status}`);
  
  return true; // Continue processing
});
```

**Purpose**: Handle response headers, logging, cleanup, and other postprocessing tasks.

## Error Handling

Route provides comprehensive error handling throughout the lifecycle:

### Automatic Error Conversion

```typescript
try {
  await routeAction(request, response, server);
} catch (error) {
  // Automatically converts errors to exceptions
  const exception = Exception.upgrade(error).toResponse();
  response.setError(exception);
  
  // Allows plugins to handle the error
  await server.emit('error', request, response);
}
```

### Error Event Handling

```typescript
server.on('error', async (req, res) => {
  // Custom error handling
  if (res.code === 404) {
    res.setHTML('<h1>Page Not Found</h1>');
  } else if (res.code >= 500) {
    // Log server errors
    console.error('Server error:', res.error);
    res.setHTML('<h1>Internal Server Error</h1>');
  }
  
  return true; // Continue processing
});
```

### Abort Handling

Any lifecycle phase can abort processing by returning `false` or throwing an error:

```typescript
server.on('request', async (req, res) => {
  if (req.url.pathname.startsWith('/admin') && !isAdmin(req)) {
    res.setError('Forbidden', {}, [], 403);
    return false; // Abort - skip processing and shutdown
  }
  return true; // Continue to processing phase
});
```

## Integration with Server

Route is typically used internally by the Server class but can be used directly:

### Direct Usage

```typescript
import Route from '@stackpress/ingest/Route';
import { server } from '@stackpress/ingest/http';

const app = server();
const req = app.request({ url: '/api/users' });
const res = app.response();

// Direct route execution
const success = await Route.emit(
  async (request, response, context) => {
    const users = await getUsers();
    response.setResults(users);
  },
  req,
  res,
  app
);
```

### Server Integration

```typescript
// Server automatically uses Route for request handling
app.get('/users', async (req, res, ctx) => {
  // This action is wrapped in Route.emit() automatically
  const users = await getUsers();
  res.setResults(users);
});

// Equivalent to:
app.on('GET /users', async (req, res) => {
  await Route.emit(
    async (request, response, context) => {
      const users = await getUsers();
      response.setResults(users);
    },
    req,
    res,
    app
  );
});
```

## Best Practices

### Lifecycle Hook Organization

```typescript
// Group related functionality in lifecycle hooks
server.on('request', async (req, res) => {
  // Authentication and authorization
  await authenticateUser(req, res);
  await authorizeRequest(req, res);
  
  // Request preprocessing
  await parseRequestData(req);
  await validateRequest(req, res);
  
  return true;
});

server.on('response', async (req, res) => {
  // Security headers
  addSecurityHeaders(res);
  
  // Response formatting
  await formatResponse(res);
  
  // Logging and metrics
  logRequest(req, res);
  recordMetrics(req, res);
  
  return true;
});
```

### Error Recovery

```typescript
server.on('error', async (req, res) => {
  // Log the error
  logger.error('Request error:', {
    url: req.url.href,
    method: req.method,
    error: res.error,
    stack: res.stack
  });
  
  // Provide user-friendly error responses
  if (res.code === 404) {
    res.setHTML(await renderErrorPage('404'));
  } else if (res.code >= 500) {
    res.setHTML(await renderErrorPage('500'));
  }
  
  return true;
});
```

### Conditional Processing

```typescript
server.on('request', async (req, res) => {
  // Skip authentication for public routes
  if (req.url.pathname.startsWith('/public')) {
    return true;
  }
  
  // Require authentication for protected routes
  const user = await authenticate(req);
  if (!user) {
    res.setError('Unauthorized', {}, [], 401);
    return false; // Abort processing
  }
  
  // Store user in request data
  req.data.set('user', user);
  return true;
});
```

### Performance Monitoring

```typescript
server.on('request', async (req, res) => {
  // Start timing
  req.data.set('startTime', Date.now());
  return true;
});

server.on('response', async (req, res) => {
  // Calculate duration
  const startTime = req.data.get('startTime');
  const duration = Date.now() - startTime;
  
  // Log slow requests
  if (duration > 1000) {
    console.warn(`Slow request: ${req.method} ${req.url.pathname} (${duration}ms)`);
  }
  
  return true;
});
```