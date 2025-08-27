# Request

The Request class provides a generic wrapper for handling HTTP requests across different platforms.

## Overview

The Request class provides:
- Cross-platform compatibility (Node.js HTTP and WHATWG Fetch)
- Data aggregation from query parameters, POST data, and additional context
- Asynchronous body loading
- Session management
- Header handling

```typescript
import { Request } from '@stackpress/ingest';

const req = new Request({
  url: 'http://example.com/api',
  method: 'POST'
});
```

## Type Parameters

The Request class accepts one generic type parameter:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `R` | `any` | Request resource type (e.g., IncomingMessage, Request) |

## Properties

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

## Methods

The following methods are available when instantiating a Request.

### Loading Request Body

The following example shows how to load the request body asynchronously.

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

## Data Access

The Request class provides multiple ways to access request data:

### Combined Data Access

The `data` property combines query parameters, POST data, and additional context:

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

### Query Parameters

Access URL query parameters directly:

```typescript
// URL: /search?q=javascript&category=programming&page=2
const query = req.query.get('q');         // 'javascript'
const category = req.query.get('category'); // 'programming'
const page = req.query.get('page');       // '2'

// Get all query parameters
const allQuery = req.query.get();
// Returns: { q: 'javascript', category: 'programming', page: '2' }
```

### POST Data

Access POST request body data:

```typescript
// For POST requests with form data or JSON
await req.load(); // Load the body first

const name = req.post.get('name');
const email = req.post.get('email');

// Get all POST data
const allPost = req.post.get();
```

### Headers

Access request headers:

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

### Session Data

Access and modify session data:

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

## Request Creation

### Basic Request Creation

```typescript
import { Request } from '@stackpress/ingest';

const req = new Request({
  url: 'http://example.com/api/users',
  method: 'GET'
});
```

### Request with Headers

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

### Request with Data

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

### Request with Session

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

## Body Loading

The Request class supports asynchronous body loading for different content types:

### JSON Body

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

### Form Data

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

### URL Encoded Data

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

## Platform Compatibility

The Request class works across different platforms:

### Node.js HTTP

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

### WHATWG Fetch (Serverless)

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

## Examples

### Route Handler with Request Processing

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

### Authentication Middleware

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

### File Upload Handling

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

## Type Safety

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
