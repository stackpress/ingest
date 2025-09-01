# Route

Pluggable route handler that manages the complete request lifecycle with hooks for preprocessing, processing, and post-processing phases.

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

 1. [Static Methods](#1-static-methods)
 2. [Properties](#2-properties)
 3. [Methods](#3-methods)
 4. [Route Lifecycle](#4-route-lifecycle)
 5. [Error Handling](#5-error-handling)
 6. [Integration with Server](#6-integration-with-server)
 7. [Best Practices](#7-best-practices)
 8. [Examples](#8-examples)

## 1. Static Methods

The following methods can be accessed directly from Route itself.

### 1.1. Emitting Route Events

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

## 2. Properties

The following properties are available when instantiating a Route.

| Property | Type | Description |
|----------|------|-------------|
| `event` | `ServerAction<C, R, S>\|string` | The route action or event name |
| `request` | `Request<R>` | Request object (readonly) |
| `response` | `Response<S>` | Response object (readonly) |
| `context` | `Server<C, R, S>` | Server context (readonly) |

## 3. Methods

The following methods are available when instantiating a Route.

### 3.1. Emitting the Route

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

### 3.2. Preparing the Request

The following example shows how to run the request preparation phase.

```typescript
const success = await route.prepare();
// Emits 'request' event and handles any errors
```

**Returns**

A promise that resolves to `true` if preparation succeeded, `false` if aborted.

### 3.3. Processing the Route

The following example shows how to execute the main route processing.

```typescript
const success = await route.process();
// Executes the route action and handles errors/404s
```

**Returns**

A promise that resolves to `true` if processing succeeded, `false` if aborted.

### 3.4. Shutting Down the Route

The following example shows how to run the response finalization phase.

```typescript
const success = await route.shutdown();
// Emits 'response' event and handles any errors
```

**Returns**

A promise that resolves to `true` if shutdown succeeded, `false` if aborted.

## 4. Route Lifecycle

The Route class manages a three-phase lifecycle for request processing with comprehensive error handling and abort capabilities.

### 4.1. Preparation Phase

The preparation phase handles authentication, logging, request validation, and other preprocessing tasks.

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

### 4.2. Processing Phase

The processing phase executes the main route logic and handles 404 errors for unhandled routes.

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

### 4.3. Shutdown Phase

The shutdown phase handles response headers, logging, cleanup, and other postprocessing tasks.

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

## 5. Error Handling

Route provides comprehensive error handling throughout the lifecycle with automatic error conversion and abort capabilities.

### 5.1. Automatic Error Conversion

The Route class automatically converts thrown errors into proper exception responses.

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

### 5.2. Error Event Handling

Custom error handling can be implemented through error event listeners.

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

### 5.3. Abort Handling

Any lifecycle phase can abort processing by returning `false` or throwing an error.

```typescript
server.on('request', async (req, res) => {
  if (req.url.pathname.startsWith('/admin') && !isAdmin(req)) {
    res.setError('Forbidden', {}, [], 403);
    return false; // Abort - skip processing and shutdown
  }
  return true; // Continue to processing phase
});

function isAdmin(req: any) {
  // Admin check logic
  return req.headers.get('x-admin-token') === 'admin-secret';
}
```

## 6. Integration with Server

Route is typically used internally by the Server class but can be used directly for advanced use cases.

### 6.1. Direct Usage

Use Route directly for custom request handling scenarios.

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

async function getUsers() {
  // User retrieval logic
  return [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
}
```

### 6.2. Server Integration

The Server class automatically uses Route for request handling with simplified syntax.

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

## 7. Best Practices

The following best practices help organize route lifecycle management and error handling effectively.

### 7.1. Lifecycle Hook Organization

Group related functionality in lifecycle hooks for better maintainability.

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

async function authenticateUser(req: any, res: any) {
  // Authentication logic
}

async function authorizeRequest(req: any, res: any) {
  // Authorization logic
}

async function parseRequestData(req: any) {
  // Request parsing logic
}

async function validateRequest(req: any, res: any) {
  // Request validation logic
}

function addSecurityHeaders(res: any) {
  // Security headers logic
}

async function formatResponse(res: any) {
  // Response formatting logic
}

function logRequest(req: any, res: any) {
  // Logging logic
}

function recordMetrics(req: any, res: any) {
  // Metrics recording logic
}
```

### 7.2. Error Recovery

Implement comprehensive error recovery strategies for robust applications.

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

const logger = {
  error: (message: string, data: any) => {
    console.error(message, data);
  }
};

async function renderErrorPage(type: string) {
  // Error page rendering logic
  return `<h1>Error ${type}</h1>`;
}
```

### 7.3. Conditional Processing

Use conditional processing to handle different request types efficiently.

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

async function authenticate(req: any) {
  // Authentication logic
  const token = req.headers.get('authorization');
  if (token === 'Bearer valid-token') {
    return { id: 1, username: 'user' };
  }
  return null;
}
```

### 7.4. Performance Monitoring

Monitor request performance to identify bottlenecks and optimize application performance.

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

## 8. Examples

The following examples demonstrate common Route usage patterns and advanced lifecycle management techniques.

### 8.1. Custom Route Handler

```typescript
import Route from '@stackpress/ingest/Route';
import { server } from '@stackpress/ingest/http';

const app = server();

// Custom route with full lifecycle control
async function handleUserProfile(req: any, res: any, ctx: any) {
  const userId = req.data.get('id');
  
  try {
    const user = await getUserById(userId);
    const profile = await getUserProfile(userId);
    
    res.setResults({
      user,
      profile,
      timestamp: Date.now()
    });
  } catch (error) {
    res.setError('Failed to load user profile', {}, [], 500);
  }
}

// Use Route directly
const req = app.request({ url: '/users/123' });
const res = app.response();
req.data.set('id', '123');

const success = await Route.emit(handleUserProfile, req, res, app);

async function getUserById(id: string) {
  // User lookup logic
  return { id, name: 'John Doe', email: 'john@example.com' };
}

async function getUserProfile(id: string) {
  // Profile lookup logic
  return { bio: 'Software developer', location: 'San Francisco' };
}
```

### 8.2. Middleware Chain

```typescript
// Authentication middleware
server.on('request', async (req, res) => {
  if (req.url.pathname.startsWith('/api/')) {
    const token = req.headers.get('authorization');
    if (!token) {
      res.setError('Missing authorization header', {}, [], 401);
      return false;
    }
    
    const user = await validateToken(token);
    if (!user) {
      res.setError('Invalid token', {}, [], 401);
      return false;
    }
    
    req.data.set('user', user);
  }
  
  return true;
}, 10); // High priority

// Rate limiting middleware
server.on('request', async (req, res) => {
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const allowed = await checkRateLimit(clientIp);
  
  if (!allowed) {
    res.setError('Rate limit exceeded', {}, [], 429);
    return false;
  }
  
  return true;
}, 5); // Medium priority

// Logging middleware
server.on('request', async (req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url.pathname}`);
  return true;
}, 1); // Low priority

async function validateToken(token: string) {
  // Token validation logic
  return token === 'Bearer valid-token' ? { id: 1, username: 'user' } : null;
}

async function checkRateLimit(ip: string) {
  // Rate limiting logic
  return true; // Allow for demo
}
```

### 8.3. Error Handling Pipeline

```typescript
// Global error handler
server.on('error', async (req, res) => {
  // Log error details
  const errorDetails = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url.href,
    userAgent: req.headers.get('user-agent'),
    error: res.error,
    code: res.code,
    stack: res.stack
  };
  
  console.error('Request error:', errorDetails);
  
  // Send error to monitoring service
  await sendToMonitoring(errorDetails);
  
  // Customize error response based on type
  if (res.code === 404) {
    res.setHTML(await render404Page(req));
  } else if (res.code === 500) {
    res.setHTML(await render500Page());
  } else if (res.code === 401) {
    res.setJSON({
      error: 'Authentication required',
      loginUrl: '/auth/login'
    });
  }
  
  return true;
});

async function sendToMonitoring(errorDetails: any) {
  // Send to monitoring service
  console.log('Sent to monitoring:', errorDetails);
}

async function render404Page(req: any) {
  return `
    <html>
      <head><title>Page Not Found</title></head>
      <body>
        <h1>404 - Page Not Found</h1>
        <p>The page ${req.url.pathname} could not be found.</p>
        <a href="/">Go Home</a>
      </body>
    </html>
  `;
}

async function render500Page() {
  return `
    <html>
      <head><title>Server Error</title></head>
      <body>
        <h1>500 - Internal Server Error</h1>
        <p>Something went wrong. Please try again later.</p>
      </body>
    </html>
  `;
}
```
