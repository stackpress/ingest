# HttpAdapter

Node.js HTTP adapter that bridges Node.js IncomingMessage and ServerResponse with the Ingest framework, enabling seamless integration with Node.js HTTP servers.

```typescript
import HttpAdapter from '@stackpress/ingest/http/Adapter';
import { createServer } from 'node:http';

// Static usage
const server = createServer(async (req, res) => {
  await HttpAdapter.plug(context, req, res);
});

// Instance usage
const adapter = new HttpAdapter(context, req, res);
await adapter.plug();
```

 1. [Plugging HTTP Requests](#1-plugging-http-requests)
 2. [Methods](#2-methods)
 3. [Request Processing Flow](#3-request-processing-flow)
 4. [Body Loading](#4-body-loading)
 5. [Response Dispatching](#5-response-dispatching)
 6. [Integration Examples](#6-integration-examples)
 7. [Static Functions](#7-static-functions)
 8. [Best Practices](#8-best-practices)

## 1. Plugging HTTP Requests

The following example shows how to handle HTTP requests using the static plug method for seamless integration.

```typescript
import { createServer } from 'node:http';
import { server } from '@stackpress/ingest/http';

const app = server();
const httpServer = createServer(async (req, res) => {
  await HttpAdapter.plug(app, req, res);
});

// With custom action
const httpServer2 = createServer(async (req, res) => {
  await HttpAdapter.plug(app, req, res, 'custom-handler');
});

// With action function
const httpServer3 = createServer(async (req, res) => {
  await HttpAdapter.plug(app, req, res, async (req, res, ctx) => {
    res.setJSON({ message: 'Custom handler' });
  });
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `context` | `HttpServer<C>` | Server context instance |
| `request` | `IncomingMessage` | Node.js HTTP request object |
| `response` | `ServerResponse` | Node.js HTTP response object |
| `action` | `string\|HttpAction<C>` | Custom action name or function (optional) |

**Returns**

A promise that resolves to the ServerResponse object after processing.

## 2. Methods

The following methods are available when instantiating an HttpAdapter.

### 2.1. Processing Requests

The following example shows how to process HTTP requests through the adapter with flexible action handling.

```typescript
const adapter = new HttpAdapter(context, req, res);

// Process with automatic route detection
await adapter.plug();

// Process with custom action
await adapter.plug('user-login');

// Process with action function
await adapter.plug(async (req, res, ctx) => {
  const users = await getUsers();
  res.setResults(users);
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `action` | `string\|HttpAction<C>` | Custom action name or function (optional) |

**Returns**

A promise that resolves to the ServerResponse object after processing.

### 2.2. Creating Request Objects

The following example shows how HTTP requests are converted to Ingest Request objects.

```typescript
const adapter = new HttpAdapter(context, req, res);
const request = adapter.request();

// Access request properties
console.log(request.method);     // 'GET', 'POST', etc.
console.log(request.url);        // URL object
console.log(request.headers);    // Request headers
console.log(request.query);      // Query parameters
console.log(request.session);    // Session data from cookies
```

**Returns**

An Ingest Request object configured for the HTTP request.

### 2.3. Creating Response Objects

The following example shows how HTTP responses are created for Ingest processing.

```typescript
const adapter = new HttpAdapter(context, req, res);
const response = adapter.response();

// Set response data
response.setJSON({ message: 'Hello World' });
response.setHTML('<h1>Hello World</h1>');
response.setError('Not found', {}, [], 404);

// Dispatch to HTTP response
await response.dispatch();
```

**Returns**

An Ingest Response object configured for HTTP output.

## 3. Request Processing Flow

HttpAdapter follows a structured request processing flow for reliable HTTP request handling.

### 3.1. Request Initialization

Convert IncomingMessage to Ingest Request with comprehensive data extraction.

```typescript
// Convert IncomingMessage to Ingest Request
const request = adapter.request();
// - Extracts HTTP method, URL, headers
// - Parses cookies into session data
// - Converts query parameters to nested object
// - Sets up body loader for POST data
```

### 3.2. Response Setup

Create Ingest Response for ServerResponse with proper configuration.

```typescript
// Create Ingest Response for ServerResponse
const response = adapter.response();
// - Configures response dispatcher
// - Sets up cookie handling
// - Prepares header management
```

### 3.3. Body Loading

Load request body asynchronously with content type detection.

```typescript
// Load request body asynchronously
await request.load();
// - Reads POST data from request stream
// - Parses form data and JSON
// - Handles multipart uploads
// - Enforces size limits
```

### 3.4. Route Processing

Execute route through Route.emit with complete lifecycle management.

```typescript
// Execute route through Route.emit
await Route.emit(event, request, response, context);
// - Runs request lifecycle (prepare, process, shutdown)
// - Executes route handlers
// - Handles errors and 404s
```

### 3.5. Response Dispatch

Send response to client with proper headers and content.

```typescript
// Send response to client
await response.dispatch();
// - Sets HTTP status code and message
// - Writes cookies to Set-Cookie headers
// - Sends response headers
// - Streams response body
```

## 4. Body Loading

HttpAdapter provides robust body loading for HTTP requests with automatic parsing and size limits.

### 4.1. Automatic Body Parsing

Parse request bodies automatically based on content type.

```typescript
// Body is automatically loaded and parsed
await request.load();

// Access parsed data
const formData = request.post.get();     // Form data
const jsonData = request.data.get();     // Combined data
const rawBody = request.body;            // Raw body string
```

### 4.2. Content Type Handling

Handle different content types with appropriate parsing strategies.

```typescript
// Form data (application/x-www-form-urlencoded)
// Content-Type: application/x-www-form-urlencoded
// Body: name=John&email=john@example.com
// Result: { name: 'John', email: 'john@example.com' }

// JSON data (application/json)
// Content-Type: application/json
// Body: {"name":"John","email":"john@example.com"}
// Result: { name: 'John', email: 'john@example.com' }

// Multipart form data (multipart/form-data)
// Handles file uploads and form fields
```

### 4.3. Size Limits

Enforce request size limits for security and performance.

```typescript
// Configure body size limits
const loader = HttpAdapter.loader(request, 1024 * 1024); // 1MB limit

// Size limit enforcement
request.on('data', chunk => {
  body += chunk;
  if (body.length > maxSize) {
    throw new Error(`Request exceeds ${maxSize} bytes`);
  }
});
```

## 5. Response Dispatching

HttpAdapter handles various response types and formats with automatic content type detection.

### 5.1. Response Type Handling

Handle different response types with appropriate content type headers.

```typescript
// String responses
response.setHTML('<h1>Hello World</h1>');
// Sets Content-Type: text/html

// JSON responses
response.setJSON({ message: 'Success' });
// Sets Content-Type: application/json

// Buffer responses
response.body = Buffer.from('binary data');
// Sends raw binary data

// Stream responses
response.body = fs.createReadStream('file.pdf');
// Pipes file stream to response

// Object responses (automatic JSON)
response.body = { users: [...] };
// Automatically serializes to JSON
```

### 5.2. Cookie Management

Manage session cookies with automatic serialization and security options.

```typescript
// Session cookies are automatically handled
response.session.set('user_id', '123');
response.session.set('preferences', JSON.stringify(prefs));

// Cookies are written as Set-Cookie headers
// Set-Cookie: user_id=123; Path=/
// Set-Cookie: preferences={"theme":"dark"}; Path=/
```

### 5.3. Header Management

Set custom headers for security, caching, and API versioning.

```typescript
// Custom headers
response.headers.set('X-API-Version', '1.0');
response.headers.set('Cache-Control', 'no-cache');

// Security headers
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-Content-Type-Options', 'nosniff');
```

## 6. Integration Examples

The following examples demonstrate common HttpAdapter integration patterns for real-world applications.

### 6.1. Express.js Style Server

```typescript
import { createServer } from 'node:http';
import { server } from '@stackpress/ingest/http';

const app = server();

// Define routes
app.get('/users', async (req, res, ctx) => {
  const users = await getUsers();
  res.setResults(users);
});

app.post('/users', async (req, res, ctx) => {
  const userData = req.data.get();
  const user = await createUser(userData);
  res.setResults(user, 201);
});

// Create HTTP server
const httpServer = createServer(async (req, res) => {
  await HttpAdapter.plug(app, req, res);
});

httpServer.listen(3000, () => {
  console.log('Server running on port 3000');
});

async function getUsers() {
  return [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
}

async function createUser(userData: any) {
  return { id: Date.now(), ...userData };
}
```

### 6.2. Custom Middleware

```typescript
const app = server();

// Request middleware
app.on('request', async (req, res) => {
  // CORS headers
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  
  // Request logging
  console.log(`${req.method} ${req.url.pathname}`);
  
  return true; // Continue processing
});

// Error handling
app.on('error', async (req, res) => {
  console.error('Request error:', res.error);
  
  if (res.code >= 500) {
    // Log server errors
    logger.error(res.error, { url: req.url.href, method: req.method });
  }
  
  return true; // Continue processing
});

const logger = {
  error: (message: string, context: any) => {
    console.error(message, context);
  }
};
```

### 6.3. File Upload Handling

```typescript
app.post('/upload', async (req, res, ctx) => {
  await req.load(); // Load multipart data
  
  const files = req.post.get('files');
  const metadata = req.post.get('metadata');
  
  // Process uploaded files
  for (const file of files) {
    await saveFile(file);
  }
  
  res.setJSON({ 
    message: 'Files uploaded successfully',
    count: files.length 
  });
});

async function saveFile(file: any) {
  // File saving logic
  console.log(`Saving file: ${file.name}`);
}
```

## 7. Static Functions

HttpAdapter provides utility functions for request and response handling with customizable options.

### 7.1. Request Body Loader

The following example shows how to create a custom body loader with size limits.

```typescript
import { loader } from '@stackpress/ingest/http/Adapter';

// Create loader with size limit
const bodyLoader = loader(incomingMessage, 1024 * 1024); // 1MB limit

// Use with request
request.loader = bodyLoader;
await request.load();
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `resource` | `IncomingMessage` | Node.js HTTP request object |
| `size` | `number` | Maximum body size in bytes (default: 0 = no limit) |

**Returns**

A loader function that reads and parses the request body.

### 7.2. Response Dispatcher

The following example shows how to create a custom response dispatcher with cookie options.

```typescript
import { dispatcher } from '@stackpress/ingest/http/Adapter';

// Create dispatcher with cookie options
const responseDispatcher = dispatcher({
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});

// Use with response
response.dispatcher = responseDispatcher;
await response.dispatch();
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `options` | `CookieOptions` | Cookie configuration options |

**Returns**

A dispatcher function that writes the response to ServerResponse.

## 8. Best Practices

The following best practices ensure robust and secure HTTP adapter implementations.

### 8.1. Error Handling

Implement comprehensive error handling for production reliability.

```typescript
const httpServer = createServer(async (req, res) => {
  try {
    await HttpAdapter.plug(app, req, res);
  } catch (error) {
    console.error('Adapter error:', error);
    
    // Ensure response is sent
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        code: 500,
        status: 'Internal Server Error',
        error: 'Server error occurred'
      }));
    }
  }
});
```

### 8.2. Performance Optimization

Configure server settings for optimal performance and resource usage.

```typescript
// Enable keep-alive
httpServer.keepAliveTimeout = 65000;
httpServer.headersTimeout = 66000;

// Set request size limits
const app = server();
app.on('request', async (req, res) => {
  const contentLength = parseInt(req.headers.get('content-length') || '0');
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    res.setError('Request too large', {}, [], 413);
    return false; // Abort processing
  }
  return true;
});
```

### 8.3. Security Headers

Implement security headers for protection against common vulnerabilities.

```typescript
app.on('response', async (req, res) => {
  // Security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000');
  
  return true;
});
```

### 8.4. Graceful Shutdown

Implement graceful shutdown for clean server termination.

```typescript
const httpServer = createServer(async (req, res) => {
  await HttpAdapter.plug(app, req, res);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
```
