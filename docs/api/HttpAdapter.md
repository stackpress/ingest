## HttpAdapter

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

### Static Methods

The following methods can be accessed directly from HttpAdapter itself.

#### Plugging HTTP Requests

The following example shows how to handle HTTP requests using the static plug method.

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

### Methods

The following methods are available when instantiating an HttpAdapter.

#### Processing Requests

The following example shows how to process HTTP requests through the adapter.

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

#### Creating Request Objects

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

#### Creating Response Objects

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

### Request Processing Flow

HttpAdapter follows a structured request processing flow:

#### 1. Request Initialization

```typescript
// Convert IncomingMessage to Ingest Request
const request = adapter.request();
// - Extracts HTTP method, URL, headers
// - Parses cookies into session data
// - Converts query parameters to nested object
// - Sets up body loader for POST data
```

#### 2. Response Setup

```typescript
// Create Ingest Response for ServerResponse
const response = adapter.response();
// - Configures response dispatcher
// - Sets up cookie handling
// - Prepares header management
```

#### 3. Body Loading

```typescript
// Load request body asynchronously
await request.load();
// - Reads POST data from request stream
// - Parses form data and JSON
// - Handles multipart uploads
// - Enforces size limits
```

#### 4. Route Processing

```typescript
// Execute route through Route.emit
await Route.emit(event, request, response, context);
// - Runs request lifecycle (prepare, process, shutdown)
// - Executes route handlers
// - Handles errors and 404s
```

#### 5. Response Dispatch

```typescript
// Send response to client
await response.dispatch();
// - Sets HTTP status code and message
// - Writes cookies to Set-Cookie headers
// - Sends response headers
// - Streams response body
```

### Body Loading

HttpAdapter provides robust body loading for HTTP requests:

#### Automatic Body Parsing

```typescript
// Body is automatically loaded and parsed
await request.load();

// Access parsed data
const formData = request.post.get();     // Form data
const jsonData = request.data.get();     // Combined data
const rawBody = request.body;            // Raw body string
```

#### Content Type Handling

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

#### Size Limits

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

### Response Dispatching

HttpAdapter handles various response types and formats:

#### Response Type Handling

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

#### Cookie Management

```typescript
// Session cookies are automatically handled
response.session.set('user_id', '123');
response.session.set('preferences', JSON.stringify(prefs));

// Cookies are written as Set-Cookie headers
// Set-Cookie: user_id=123; Path=/
// Set-Cookie: preferences={"theme":"dark"}; Path=/
```

#### Header Management

```typescript
// Custom headers
response.headers.set('X-API-Version', '1.0');
response.headers.set('Cache-Control', 'no-cache');

// Security headers
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-Content-Type-Options', 'nosniff');
```

### Integration Examples

#### Express.js Style Server

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
```

#### Custom Middleware

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
```

#### File Upload Handling

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
```

### Static Functions

HttpAdapter provides utility functions for request and response handling:

#### Request Body Loader

The following example shows how to create a custom body loader.

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

#### Response Dispatcher

The following example shows how to create a custom response dispatcher.

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

### Best Practices

#### Error Handling

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

#### Performance Optimization

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

#### Security Headers

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

#### Graceful Shutdown

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