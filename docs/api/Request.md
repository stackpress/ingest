# Request

The Request class provides a generic wrapper for handling HTTP requests across different platforms with unified data access and asynchronous body loading capabilities.

```typescript
import { Request } from '@stackpress/ingest';

const req = new Request<ResourceType>({
  url: 'http://example.com/api',
  method: 'POST'
});
```

 1. [Properties](#1-properties)
 2. [Methods](#2-methods)
 3. [Data Access](#3-data-access)
 4. [Request Creation](#4-request-creation)
 5. [Body Loading](#5-body-loading)
 6. [Platform Compatibility](#6-platform-compatibility)
 7. [Type Parameters](#7-type-parameters)
 8. [Examples](#8-examples)
 9. [Type Safety](#9-type-safety)

## 1. Properties

The following properties are available when instantiating a Request.

| Property | Type | Description |
|----------|------|-------------|
| `data` | `CallableNest` | Combined data from query, post, and additional data |
| `headers` | `CallableMap<string, string\|string[]>` | Request headers |
| `query` | `CallableNest` | URL query parameters |
| `post` | `CallableNest` | POST body data |
| `session` | `CallableSession` | Session data |
| `url` | `URL` | Request URL object |
| `method` | `Method` | HTTP method (GET, POST, PUT, DELETE, etc.) |
| `body` | `Body\|null` | Raw request body |
| `loaded` | `boolean` | Whether the body has been loaded |
| `mimetype` | `string` | Request body MIME type |
| `resource` | `R` | Original request resource |
| `type` | `string` | Type of body content |
| `loader` | `RequestLoader<R>` | Body loader function |

## 2. Methods

The following methods are available when instantiating a Request.

### 2.1. Loading Request Body

The following example shows how to load the request body asynchronously for processing POST data and file uploads.

```typescript
const req = new Request({
  url: 'http://example.com/api',
  method: 'POST'
});

await req.load(); // Loads body using the configured loader
console.log(req.body); // Access the loaded body
console.log(req.loaded); // true
```

**Returns**

The Request instance to allow method chaining.

## 3. Data Access

The Request class provides multiple ways to access request data from different sources including query parameters, POST body, and session data.

### 3.1. Combined Data Access

The `data` property combines query parameters, POST data, and additional context for unified access.

```typescript
// URL: /users?page=1&limit=10
// POST body: { name: 'John', email: 'john@example.com' }
// Additional data: { userId: 123 }

const page = req.data.get('page');        // '1' (from query)
const name = req.data.get('name');        // 'John' (from POST)
const userId = req.data.get('userId');    // 123 (from additional data)

// Get all data
const allData = req.data.get();
// Returns: { page: '1', limit: '10', name: 'John', email: 'john@example.com', userId: 123 }
```

### 3.2. Query Parameters

Access URL query parameters directly for filtering and pagination.

```typescript
// URL: /search?q=javascript&category=programming&page=2
const query = req.query.get('q');         // 'javascript'
const category = req.query.get('category'); // 'programming'
const page = req.query.get('page');       // '2'

// Get all query parameters
const allQuery = req.query.get();
// Returns: { q: 'javascript', category: 'programming', page: '2' }
```

### 3.3. POST Data

Access POST request body data after loading the request body.

```typescript
// For POST requests with form data or JSON
await req.load(); // Load the body first

const name = req.post.get('name');
const email = req.post.get('email');

// Get all POST data
const allPost = req.post.get();
```

### 3.4. Headers

Access request headers for authentication, content negotiation, and metadata.

```typescript
const contentType = req.headers.get('content-type');
const authorization = req.headers.get('authorization');
const userAgent = req.headers.get('user-agent');

// Check if header exists
if (req.headers.has('x-api-key')) {
  const apiKey = req.headers.get('x-api-key');
}

// Get all headers
const allHeaders = req.headers.entries();
for (const [name, value] of allHeaders) {
  console.log(`${name}: ${value}`);
}
```

### 3.5. Session Data

Access and modify session data for user state management.

```typescript
// Get session data
const userId = req.session.get('userId');
const username = req.session.get('username');

// Set session data
req.session.set('lastVisit', new Date().toISOString());

// Check if session has data
if (req.session.has('isAuthenticated')) {
  // User is logged in
}

// Get all session data
const sessionData = req.session.get();
```

## 4. Request Creation

The Request class supports various initialization patterns for different use cases and platforms.

### 4.1. Basic Request Creation

Create a simple request with URL and method for basic HTTP operations.

```typescript
import { Request } from '@stackpress/ingest';

const req = new Request({
  url: 'http://example.com/api/users',
  method: 'GET'
});
```

### 4.2. Request with Headers

Include custom headers for authentication and content negotiation.

```typescript
const req = new Request({
  url: 'http://example.com/api/users',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  }
});
```

### 4.3. Request with Data

Initialize request with query parameters and POST data.

```typescript
const req = new Request({
  url: 'http://example.com/api/users',
  method: 'POST',
  data: {
    name: 'John Doe',
    email: 'john@example.com'
  },
  query: {
    include: 'profile'
  }
});
```

### 4.4. Request with Session

Include session data for user context and state management.

```typescript
const req = new Request({
  url: 'http://example.com/api/profile',
  method: 'GET',
  session: {
    userId: '123',
    username: 'john',
    role: 'admin'
  }
});
```

## 5. Body Loading

The Request class supports asynchronous body loading for different content types including JSON, form data, and file uploads.

### 5.1. JSON Body

Handle JSON request bodies for API endpoints.

```typescript
const req = new Request({
  url: 'http://example.com/api/users',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});

await req.load();
console.log(req.mimetype); // 'application/json'
console.log(req.post.get()); // { name: 'John', email: 'john@example.com' }
```

### 5.2. Form Data

Process multipart form data for file uploads and complex forms.

```typescript
const req = new Request({
  url: 'http://example.com/api/upload',
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data' }
  // body would be set by the platform (browser FormData, etc.)
});

await req.load();
console.log(req.post.get('username'));
console.log(req.post.get('file')); // File data
```

### 5.3. URL Encoded Data

Handle URL-encoded form submissions.

```typescript
const req = new Request({
  url: 'http://example.com/api/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'username=john&password=secret'
});

await req.load();
console.log(req.post.get('username')); // 'john'
console.log(req.post.get('password')); // 'secret'
```

## 6. Platform Compatibility

The Request class provides cross-platform compatibility for Node.js HTTP and WHATWG Fetch environments.

### 6.1. Node.js HTTP

Integration with Node.js HTTP server for traditional server applications.

```typescript
import { createServer } from 'node:http';
import { Request } from '@stackpress/ingest';

createServer((incomingMessage, serverResponse) => {
  const req = new Request({ resource: incomingMessage });
  
  console.log(req.method); // GET, POST, etc.
  console.log(req.url.pathname); // /api/users
  console.log(req.headers.get('user-agent'));
});
```

### 6.2. WHATWG Fetch (Serverless)

Support for serverless environments like Vercel, Netlify, and Cloudflare Workers.

```typescript
// Vercel, Netlify, etc.
export default async function handler(request: Request) {
  const req = new Request({ resource: request });
  
  console.log(req.method);
  console.log(req.url.pathname);
  console.log(req.headers.get('authorization'));
  
  return new Response('OK');
}
```

## 7. Type Parameters

The Request class accepts one generic type parameter for type-safe resource handling.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `R` | `any` | Request resource type (e.g., IncomingMessage, Request) |

```typescript
import type { IncomingMessage } from 'node:http';

// Node.js HTTP request
const nodeReq = new Request<IncomingMessage>({
  resource: incomingMessage
});

// WHATWG Fetch request
const fetchReq = new Request<globalThis.Request>({
  resource: request
});

// Custom request type
interface CustomRequest {
  customProperty: string;
}

const customReq = new Request<CustomRequest>({
  resource: { customProperty: 'value' }
});
```

## 8. Examples

The following examples demonstrate common Request usage patterns and best practices for real-world applications.

### 8.1. Route Handler with Request Processing

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

app.post('/api/users', async (req, res) => {
  // Load request body
  await req.load();
  
  // Access different data sources
  const userData = req.post.get(); // POST body data
  const includeProfile = req.query.get('include'); // Query parameter
  const currentUser = req.session.get('userId'); // Session data
  
  // Validate required fields
  if (!userData.name || !userData.email) {
    res.setError('Name and email are required', {
      name: !userData.name ? 'Name is required' : undefined,
      email: !userData.email ? 'Email is required' : undefined
    }, [], 400);
    return;
  }
  
  // Create user
  const newUser = {
    id: Date.now(),
    ...userData,
    createdBy: currentUser
  };
  
  res.setJSON({ user: newUser }, 201);
});
```

### 8.2. Authentication Middleware

```typescript
app.on('request', async (req, res) => {
  // Skip authentication for public routes
  if (req.url.pathname.startsWith('/public')) {
    return true;
  }
  
  // Check for authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.setError('Authentication required', {}, [], 401);
    return false;
  }
  
  // Extract and validate token
  const token = authHeader.substring(7);
  try {
    const user = await validateToken(token);
    
    // Store user in request data for later use
    req.data.set('user', user);
    req.session.set('userId', user.id);
    
    return true; // Continue processing
  } catch (error) {
    res.setError('Invalid token', {}, [], 401);
    return false;
  }
}, 10); // High priority

async function validateToken(token: string) {
  // Token validation logic
  return { id: 1, username: 'john', role: 'admin' };
}
```

### 8.3. File Upload Handling

```typescript
app.post('/api/upload', async (req, res) => {
  await req.load();
  
  // Check content type
  if (!req.mimetype.startsWith('multipart/form-data')) {
    res.setError('Multipart form data required', {}, [], 400);
    return;
  }
  
  // Access uploaded files
  const files = req.post.get('files');
  const description = req.post.get('description');
  
  if (!files || !Array.isArray(files)) {
    res.setError('No files uploaded', {}, [], 400);
    return;
  }
  
  // Process files
  const uploadedFiles = [];
  for (const file of files) {
    const savedFile = await saveFile(file);
    uploadedFiles.push(savedFile);
  }
  
  res.setJSON({
    message: 'Files uploaded successfully',
    files: uploadedFiles,
    description
  });
});
```

## 9. Type Safety

The Request class supports TypeScript generics for type-safe resource handling:

```typescript
import type { IncomingMessage } from 'node:http';

// Node.js HTTP request
const nodeReq = new Request<IncomingMessage>({
  resource: incomingMessage
});

// WHATWG Fetch request
const fetchReq = new Request<globalThis.Request>({
  resource: request
});

// Custom request type
interface CustomRequest {
  customProperty: string;
}

const customReq = new Request<CustomRequest>({
  resource: { customProperty: 'value' }
});
```

The Request class provides a unified interface for handling HTTP requests across different platforms while maintaining type safety and providing convenient data access methods.
