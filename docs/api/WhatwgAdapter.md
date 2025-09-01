# WhatwgAdapter

WHATWG Fetch API adapter that bridges standard Request and Response objects with the Ingest framework, enabling seamless integration with serverless environments and modern web standards.

```typescript
import WhatwgAdapter from '@stackpress/ingest/whatwg/Adapter';

// Static usage
const response = await WhatwgAdapter.plug(context, request);

// Instance usage
const adapter = new WhatwgAdapter(context, request);
const response = await adapter.plug();
```

 1. [Plugging WHATWG Requests](#1-plugging-whatwg-requests)
 2. [Methods](#2-methods)
 3. [Request Processing Flow](#3-request-processing-flow)
 4. [Body Loading](#4-body-loading)
 5. [Response Dispatching](#5-response-dispatching)
 6. [Serverless Integration Examples](#6-serverless-integration-examples)
 7. [Static Functions](#7-static-functions)
 8. [Advanced Usage](#8-advanced-usage)
 9. [Best Practices](#9-best-practices)

## 1. Plugging WHATWG Requests

The following example shows how to handle WHATWG requests using the static plug method for serverless environments.

```typescript
import { server } from '@stackpress/ingest/whatwg';

const app = server();

// Basic usage
export default async function handler(request: Request) {
  return await WhatwgAdapter.plug(app, request);
}

// With custom action
export async function customHandler(request: Request) {
  return await WhatwgAdapter.plug(app, request, 'custom-handler');
}

// With action function
export async function functionHandler(request: Request) {
  return await WhatwgAdapter.plug(app, request, async (req, res, ctx) => {
    res.setJSON({ message: 'Custom handler' });
  });
}
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `context` | `WhatwgServer<C>` | Server context instance |
| `request` | `Request` | WHATWG Request object |
| `action` | `string\|WhatwgAction<C>` | Custom action name or function (optional) |

**Returns**

A promise that resolves to a WHATWG Response object.

## 2. Methods

The following methods are available when instantiating a WhatwgAdapter.

### 2.1. Processing Requests

The following example shows how to process WHATWG requests through the adapter with flexible action handling.

```typescript
const adapter = new WhatwgAdapter(context, request);

// Process with automatic route detection
const response = await adapter.plug();

// Process with custom action
const response2 = await adapter.plug('user-login');

// Process with action function
const response3 = await adapter.plug(async (req, res, ctx) => {
  const users = await getUsers();
  res.setResults(users);
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `action` | `string\|WhatwgAction<C>` | Custom action name or function (optional) |

**Returns**

A promise that resolves to a WHATWG Response object.

### 2.2. Creating Request Objects

The following example shows how WHATWG requests are converted to Ingest Request objects.

```typescript
const adapter = new WhatwgAdapter(context, request);
const ingestRequest = adapter.request();

// Access request properties
console.log(ingestRequest.method);     // 'GET', 'POST', etc.
console.log(ingestRequest.url);        // URL object
console.log(ingestRequest.headers);    // Request headers
console.log(ingestRequest.query);      // Query parameters
console.log(ingestRequest.session);    // Session data from cookies
```

**Returns**

An Ingest Request object configured for the WHATWG request.

### 2.3. Creating Response Objects

The following example shows how WHATWG responses are created for Ingest processing.

```typescript
const adapter = new WhatwgAdapter(context, request);
const ingestResponse = adapter.response();

// Set response data
ingestResponse.setJSON({ message: 'Hello World' });
ingestResponse.setHTML('<h1>Hello World</h1>');
ingestResponse.setError('Not found', {}, [], 404);

// Dispatch to WHATWG response
const whatwgResponse = await ingestResponse.dispatch();
```

**Returns**

An Ingest Response object configured for WHATWG output.

## 3. Request Processing Flow

WhatwgAdapter follows a structured request processing flow for reliable WHATWG request handling.

### 3.1. Request Initialization

Convert WHATWG Request to Ingest Request with comprehensive data extraction.

```typescript
// Convert WHATWG Request to Ingest Request
const request = adapter.request();
// - Extracts HTTP method, URL, headers
// - Parses cookies into session data
// - Converts query parameters to nested object
// - Sets up body loader for POST data
```

### 3.2. Response Setup

Create Ingest Response for WHATWG Response with proper configuration.

```typescript
// Create Ingest Response for WHATWG Response
const response = adapter.response();
// - Configures response dispatcher
// - Sets up cookie handling
// - Prepares header management
```

### 3.3. Body Loading

Load request body asynchronously with WHATWG-specific handling.

```typescript
// Load request body asynchronously
await request.load();
// - Reads POST data from request body
// - Parses form data and JSON
// - Handles multipart uploads
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

Create WHATWG Response with proper headers and content.

```typescript
// Create WHATWG Response
const whatwgResponse = await response.dispatch();
// - Creates new Response object
// - Sets status code and message
// - Writes cookies to Set-Cookie headers
// - Sends response headers and body
```

## 4. Body Loading

WhatwgAdapter provides robust body loading for WHATWG requests with native API support.

### 4.1. Automatic Body Parsing

Parse request bodies automatically based on content type using WHATWG APIs.

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

// FormData (multipart/form-data)
// Handles file uploads and form fields
```

### 4.3. Async Body Loading

Use WHATWG Request body methods for different data types.

```typescript
// WHATWG Request body loading
const bodyText = await request.text();
const bodyJson = await request.json();
const bodyFormData = await request.formData();
const bodyArrayBuffer = await request.arrayBuffer();
```

## 5. Response Dispatching

WhatwgAdapter handles various response types and formats with WHATWG Response creation.

### 5.1. Response Type Handling

Handle different response types with appropriate WHATWG Response creation.

```typescript
// String responses
response.setHTML('<h1>Hello World</h1>');
// Creates Response with text/html content-type

// JSON responses
response.setJSON({ message: 'Success' });
// Creates Response with application/json content-type

// Buffer responses
response.body = Buffer.from('binary data');
// Creates Response with binary data

// Stream responses
response.body = new ReadableStream({...});
// Creates Response with streaming body

// Object responses (automatic JSON)
response.body = { users: [...] };
// Automatically serializes to JSON Response
```

### 5.2. Cookie Management

Manage session cookies with automatic serialization for serverless environments.

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

## 6. Serverless Integration Examples

The following examples demonstrate WhatwgAdapter integration with popular serverless platforms.

### 6.1. Vercel Functions

```typescript
// api/users.ts
import { server } from '@stackpress/ingest/whatwg';
import WhatwgAdapter from '@stackpress/ingest/whatwg/Adapter';

const app = server();

app.get('/api/users', async (req, res, ctx) => {
  const users = await getUsers();
  res.setResults(users);
});

export default async function handler(request: Request) {
  return await WhatwgAdapter.plug(app, request);
}

async function getUsers() {
  return [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
}
```

### 6.2. Netlify Functions

```typescript
// netlify/functions/api.ts
import { server } from '@stackpress/ingest/whatwg';
import WhatwgAdapter from '@stackpress/ingest/whatwg/Adapter';

const app = server();

app.all('/*', async (req, res, ctx) => {
  // Handle all routes
  const path = req.url.pathname;
  res.setJSON({ path, method: req.method });
});

export default async function handler(request: Request) {
  return await WhatwgAdapter.plug(app, request);
}
```

### 6.3. Cloudflare Workers

```typescript
// worker.ts
import { server } from '@stackpress/ingest/whatwg';
import WhatwgAdapter from '@stackpress/ingest/whatwg/Adapter';

const app = server();

app.get('/', async (req, res, ctx) => {
  res.setHTML('<h1>Hello from Cloudflare Workers!</h1>');
});

export default {
  async fetch(request: Request): Promise<Response> {
    return await WhatwgAdapter.plug(app, request);
  }
};
```

### 6.4. Deno Deploy

```typescript
// main.ts
import { server } from '@stackpress/ingest/whatwg';
import WhatwgAdapter from '@stackpress/ingest/whatwg/Adapter';

const app = server();

app.get('/api/hello', async (req, res, ctx) => {
  res.setJSON({ message: 'Hello from Deno!' });
});

Deno.serve(async (request: Request) => {
  return await WhatwgAdapter.plug(app, request);
});
```

### 6.5. AWS Lambda (with Response Streaming)

```typescript
// lambda.ts
import { server } from '@stackpress/ingest/whatwg';
import WhatwgAdapter from '@stackpress/ingest/whatwg/Adapter';

const app = server();

app.get('/api/stream', async (req, res, ctx) => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue('chunk 1\n');
      controller.enqueue('chunk 2\n');
      controller.close();
    }
  });
  res.body = stream;
});

export const handler = async (event: any) => {
  const request = new Request(event.requestContext.http.sourceIp, {
    method: event.requestContext.http.method,
    headers: event.headers,
    body: event.body
  });
  
  return await WhatwgAdapter.plug(app, request);
};
```

## 7. Static Functions

WhatwgAdapter provides utility functions for request and response handling with WHATWG-specific implementations.

### 7.1. Request Body Loader

The following example shows how to create a custom body loader for WHATWG requests.

```typescript
import { loader } from '@stackpress/ingest/whatwg/Adapter';

// Create loader for WHATWG Request
const bodyLoader = loader(request);

// Use with Ingest request
ingestRequest.loader = bodyLoader;
await ingestRequest.load();
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `resource` | `Request` | WHATWG Request object |

**Returns**

A loader function that reads and parses the request body.

### 7.2. Response Dispatcher

The following example shows how to create a custom response dispatcher for WHATWG responses.

```typescript
import { dispatcher } from '@stackpress/ingest/whatwg/Adapter';

// Create dispatcher with cookie options
const responseDispatcher = dispatcher({
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});

// Use with response
response.dispatcher = responseDispatcher;
const whatwgResponse = await response.dispatch();
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `options` | `CookieOptions` | Cookie configuration options |

**Returns**

A dispatcher function that creates a WHATWG Response object.

## 8. Advanced Usage

### 8.1. Custom Request Processing

```typescript
const app = server();

// Custom request preprocessing
app.on('request', async (req, res) => {
  // Add request ID
  req.data.set('requestId', crypto.randomUUID());
  
  // Parse custom headers
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    req.data.set('apiKey', apiKey);
  }
  
  return true;
});

// Route with custom processing
app.get('/api/data', async (req, res, ctx) => {
  const requestId = req.data.get('requestId');
  const apiKey = req.data.get('apiKey');
  
  res.setJSON({ requestId, authenticated: !!apiKey });
});
```

### 8.2. Stream Processing

```typescript
app.get('/api/stream', async (req, res, ctx) => {
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(`data chunk ${i}\n`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      controller.close();
    }
  });
  
  res.body = stream;
  res.headers.set('Content-Type', 'text/plain');
  res.headers.set('Transfer-Encoding', 'chunked');
});
```

### 8.3. Error Handling

```typescript
app.on('error', async (req, res) => {
  // Custom error formatting for APIs
  if (req.url.pathname.startsWith('/api/')) {
    res.setJSON({
      error: res.error,
      code: res.code,
      timestamp: new Date().toISOString(),
      path: req.url.pathname
    });
  } else {
    // HTML error pages for web routes
    res.setHTML(`
      <h1>Error ${res.code}</h1>
      <p>${res.error}</p>
    `);
  }
  
  return true;
});
```

## 9. Best Practices

The following best practices ensure optimal performance and security in serverless environments.

### 9.1. Environment Detection

Detect and adapt to different serverless environments for optimal performance.

```typescript
const app = server();

// Detect serverless environment
app.on('request', async (req, res) => {
  const isVercel = process.env.VERCEL === '1';
  const isNetlify = process.env.NETLIFY === 'true';
  const isCloudflare = typeof caches !== 'undefined';
  
  req.data.set('environment', {
    isVercel,
    isNetlify,
    isCloudflare,
    isServerless: isVercel || isNetlify || isCloudflare
  });
  
  return true;
});
```

### 9.2. CORS Handling

Implement proper CORS handling for cross-origin requests.

```typescript
app.on('request', async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.headers.set('Access-Control-Max-Age', '86400');
    res.code = 204;
    return false; // Skip further processing
  }
  
  // Set CORS headers for all requests
  res.headers.set('Access-Control-Allow-Origin', '*');
  return true;
});
```

### 9.3. Performance Optimization

Optimize responses for serverless environments with appropriate caching.

```typescript
app.on('response', async (req, res) => {
  // Add caching headers
  if (req.method === 'GET' && res.code === 200) {
    res.headers.set('Cache-Control', 'public, max-age=3600');
    res.headers.set('ETag', `"${Date.now()}"`);
  }
  
  // Compression hint
  res.headers.set('Vary', 'Accept-Encoding');
  
  return true;
});
```

### 9.4. Security Headers

Implement security headers appropriate for serverless deployments.

```typescript
app.on('response', async (req, res) => {
  // Security headers for web responses
  if (!req.url.pathname.startsWith('/api/')) {
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-XSS-Protection', '1; mode=block');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  
  return true;
});
```