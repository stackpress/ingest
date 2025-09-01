# Response

The Response class provides a generic wrapper for handling HTTP responses across different platforms with support for multiple response types, header management, and session handling.

```typescript
import { Response } from '@stackpress/ingest';

const res = new Response<ResourceType>({
  headers: { 'Content-Type': 'application/json' }
});
```

 1. [Properties](#1-properties)
 2. [Methods](#2-methods)
 3. [Header Management](#3-header-management)
 4. [Session Management](#4-session-management)
 5. [Response Creation](#5-response-creation)
 6. [Platform Compatibility](#6-platform-compatibility)
 7. [Type Parameters](#7-type-parameters)
 8. [Examples](#8-examples)
 9. [Type Safety](#9-type-safety)

## 1. Properties

The following properties are available when instantiating a Response.

| Property | Type | Description |
|----------|------|-------------|
| `headers` | `CallableMap<string, string\|string[]>` | Response headers |
| `session` | `CallableSession` | Session data |
| `errors` | `CallableNest` | Validation errors |
| `data` | `CallableNest` | Response data |
| `body` | `Body\|null` | Response body |
| `code` | `number` | HTTP status code |
| `error` | `string\|undefined` | Error message |
| `redirected` | `boolean` | Whether response is a redirect |
| `sent` | `boolean` | Whether response has been sent |
| `stack` | `Trace[]\|undefined` | Stack trace for errors |
| `status` | `string` | HTTP status message |
| `total` | `number` | Total count of results |
| `mimetype` | `string\|undefined` | Response MIME type |
| `resource` | `S` | Original response resource |
| `type` | `string` | Type of body content |
| `dispatcher` | `ResponseDispatcher<S>` | Response dispatcher function |

## 2. Methods

The following methods are available when instantiating a Response.

### 2.1. Setting JSON Response

The following example shows how to set a JSON response for API endpoints.

```typescript
// Simple JSON response
res.setJSON({ message: 'Success', data: results });

// JSON response with custom status
res.setJSON({ user: userData }, 201, 'Created');

// JSON string response
res.setJSON('{"message": "Success"}', 200, 'OK');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `body` | `string\|NestedObject` | JSON data or string |
| `code` | `number` | HTTP status code (default: 200) |
| `status` | `string` | HTTP status message (optional) |

**Returns**

The Response instance to allow method chaining.

### 2.2. Setting HTML Response

The following example shows how to set an HTML response for web pages.

```typescript
// Simple HTML response
res.setHTML('<h1>Welcome</h1>');

// HTML response with custom status
res.setHTML('<h1>Page Not Found</h1>', 404, 'Not Found');

// HTML response with template
const html = `
  <html>
    <head><title>User Profile</title></head>
    <body><h1>Welcome, ${user.name}!</h1></body>
  </html>
`;
res.setHTML(html, 200, 'OK');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `body` | `string` | HTML content |
| `code` | `number` | HTTP status code (default: 200) |
| `status` | `string` | HTTP status message (optional) |

**Returns**

The Response instance to allow method chaining.

### 2.3. Setting Error Response

The following example shows how to set an error response with validation details.

```typescript
// Simple error
res.setError('Invalid input', {}, [], 400, 'Bad Request');

// Error with validation details
res.setError('Validation failed', {
  name: 'Name is required',
  email: 'Invalid email format'
}, [], 400);

// Error with stack trace
res.setError('Database error', {}, stackTrace, 500, 'Internal Server Error');

// Error from response object
res.setError({
  code: 404,
  error: 'User not found',
  errors: { id: 'User ID does not exist' }
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `error` | `string\|ErrorResponse` | Error message or response object |
| `errors` | `NestedObject<string\|string[]>` | Validation errors (default: {}) |
| `stack` | `Trace[]` | Stack trace (default: []) |
| `code` | `number` | HTTP status code (default: 400) |
| `status` | `string` | HTTP status message (optional) |

**Returns**

The Response instance to allow method chaining.

### 2.4. Setting Results Response

The following example shows how to set a single result response.

```typescript
// Single result
res.setResults({ id: 1, name: 'John Doe' });

// Result with custom status
res.setResults({ user: newUser }, 201, 'Created');

// Complex result object
res.setResults({
  user: userData,
  permissions: userPermissions,
  settings: userSettings
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `body` | `NestedObject` | Result object |
| `code` | `number` | HTTP status code (default: 200) |
| `status` | `string` | HTTP status message (optional) |

**Returns**

The Response instance to allow method chaining.

### 2.5. Setting Rows Response

The following example shows how to set a collection response with total count for pagination.

```typescript
// Collection with total count
res.setRows([
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' }
], 100); // 2 items out of 100 total

// Collection without total
res.setRows(users);

// Empty collection
res.setRows([], 0);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `body` | `NestedObject[]` | Array of result objects |
| `total` | `number` | Total count of possible results (default: 0) |
| `code` | `number` | HTTP status code (default: 200) |
| `status` | `string` | HTTP status message (optional) |

**Returns**

The Response instance to allow method chaining.

### 2.6. Redirecting

The following example shows how to redirect the response to another URL.

```typescript
// Simple redirect
res.redirect('/login');

// Redirect with custom status
res.redirect('/dashboard', 301, 'Moved Permanently');

// External redirect
res.redirect('https://example.com', 302, 'Found');

// Conditional redirect
if (!user.isAuthenticated) {
  res.redirect('/login', 302, 'Found');
  return;
}
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `url` | `string` | Redirect URL |
| `code` | `number` | HTTP status code (default: 302) |
| `status` | `string` | HTTP status message (optional) |

**Returns**

The Response instance to allow method chaining.

### 2.7. Dispatching Response

The following example shows how to dispatch the response to the native resource.

```typescript
// Dispatch to native response
const nativeResponse = await res.dispatch();

// Use in route handler
app.get('/api/users', async (req, res) => {
  res.setJSON({ users: [] });
  return await res.dispatch(); // Send response
});
```

**Returns**

The native response resource after dispatching.

### 2.8. Converting to Status Response

The following example shows how to convert the response to a status response object.

```typescript
const statusResponse = res.toStatusResponse();
console.log(statusResponse);
// Returns: { code, status, error, errors, stack, results, total }

// Use for API responses
const apiResponse = res.toStatusResponse();
return {
  statusCode: apiResponse.code,
  body: JSON.stringify(apiResponse)
};
```

**Returns**

A StatusResponse object with all response details.

## 3. Header Management

The Response class provides comprehensive header management for HTTP responses including CORS, security, and caching headers.

### 3.1. Setting Headers

Control response headers for content negotiation and security.

```typescript
// Set individual headers
res.headers.set('Content-Type', 'application/json');
res.headers.set('Cache-Control', 'no-cache');
res.headers.set('X-API-Version', '1.0');

// Set multiple values for same header
res.headers.set('Set-Cookie', ['session=abc123', 'csrf=xyz789']);

// Set headers during response creation
const res = new Response({
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }
});
```

### 3.2. Getting Headers

Access and inspect response headers.

```typescript
const contentType = res.headers.get('content-type');
const cookies = res.headers.get('set-cookie'); // Array if multiple values

// Check if header exists
if (res.headers.has('authorization')) {
  // Header is set
}

// Get all headers
for (const [name, value] of res.headers.entries()) {
  console.log(`${name}: ${value}`);
}
```

### 3.3. Common Headers

Set frequently used headers for web applications.

```typescript
// CORS headers
res.headers.set('Access-Control-Allow-Origin', '*');
res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

// Security headers
res.headers.set('X-Content-Type-Options', 'nosniff');
res.headers.set('X-Frame-Options', 'DENY');
res.headers.set('X-XSS-Protection', '1; mode=block');

// Caching headers
res.headers.set('Cache-Control', 'public, max-age=3600');
res.headers.set('ETag', '"abc123"');
res.headers.set('Last-Modified', new Date().toUTCString());
```

## 4. Session Management

The Response class integrates with session management for user state persistence.

### 4.1. Setting Session Data

Store user data in the session for subsequent requests.

```typescript
// Set session values
res.session.set('userId', user.id);
res.session.set('username', user.username);
res.session.set('lastLogin', new Date().toISOString());

// Set multiple session values
res.session.set({
  userId: user.id,
  role: user.role,
  permissions: user.permissions
});
```

### 4.2. Reading Session Data

Access session data for user context.

```typescript
const userId = res.session.get('userId');
const username = res.session.get('username');

// Get all session data
const sessionData = res.session.get();
```

### 4.3. Session Cookies

Manage session cookies with security options.

```typescript
// Session cookies are automatically managed
// but you can customize them
res.headers.set('Set-Cookie', [
  'session=abc123; HttpOnly; Secure; SameSite=Strict',
  'csrf=xyz789; HttpOnly; Secure'
]);
```

## 5. Response Creation

The Response class supports various initialization patterns for different use cases.

### 5.1. Basic Response Creation

Create a simple response for basic HTTP operations.

```typescript
import { Response } from '@stackpress/ingest';

const res = new Response();
```

### 5.2. Response with Headers

Initialize response with custom headers.

```typescript
const res = new Response({
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': '1.0'
  }
});
```

### 5.3. Response with Data

Initialize response with default data.

```typescript
const res = new Response({
  data: {
    timestamp: Date.now(),
    version: '1.0.0'
  }
});
```

### 5.4. Response with Resource

Initialize response with platform-specific resource.

```typescript
import type { ServerResponse } from 'node:http';

const res = new Response<ServerResponse>({
  resource: serverResponse
});
```

## 6. Platform Compatibility

The Response class provides cross-platform compatibility for Node.js HTTP and WHATWG Fetch environments.

### 6.1. Node.js HTTP

Integration with Node.js HTTP server for traditional server applications.

```typescript
import { createServer } from 'node:http';
import { Response } from '@stackpress/ingest';

createServer((req, serverResponse) => {
  const res = new Response({ resource: serverResponse });
  
  res.setJSON({ message: 'Hello from Node.js' });
  res.dispatch(); // Sends response
});
```

### 6.2. WHATWG Fetch (Serverless)

Support for serverless environments like Vercel, Netlify, and Cloudflare Workers.

```typescript
// Vercel, Netlify, etc.
export default async function handler(request: Request) {
  const res = new Response();
  
  res.setJSON({ message: 'Hello from serverless' });
  
  return await res.dispatch(); // Returns Response object
}
```

## 7. Type Parameters

The Response class accepts one generic type parameter for type-safe resource handling.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `S` | `any` | Response resource type (e.g., ServerResponse, Response) |

```typescript
import type { ServerResponse } from 'node:http';

// Node.js HTTP response
const nodeRes = new Response<ServerResponse>({
  resource: serverResponse
});

// WHATWG Fetch response
const fetchRes = new Response<globalThis.Response>();

// Custom response type
interface CustomResponse {
  customProperty: string;
}

const customRes = new Response<CustomResponse>({
  resource: { customProperty: 'value' }
});
```

## 8. Examples

The following examples demonstrate common Response usage patterns and best practices for real-world applications.

### 8.1. API Route Handler

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

app.get('/api/users/:id', async (req, res) => {
  const userId = req.data.get('id');
  
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      res.setError('User not found', { id: 'User does not exist' }, [], 404);
      return;
    }
    
    // Set cache headers
    res.headers.set('Cache-Control', 'public, max-age=300');
    res.headers.set('ETag', `"user-${user.id}-${user.updatedAt}"`);
    
    res.setResults(user);
  } catch (error) {
    res.setError('Database error', {}, [], 500);
  }
});

async function getUserById(id: string) {
  // Database lookup logic
  return { id, name: 'John Doe', updatedAt: Date.now() };
}
```

### 8.2. Paginated Results

```typescript
app.get('/api/users', async (req, res) => {
  const page = parseInt(req.query.get('page') || '1');
  const limit = parseInt(req.query.get('limit') || '10');
  const offset = (page - 1) * limit;
  
  try {
    const { users, total } = await getUsersPaginated(limit, offset);
    
    // Set pagination headers
    res.headers.set('X-Total-Count', total.toString());
    res.headers.set('X-Page', page.toString());
    res.headers.set('X-Per-Page', limit.toString());
    
    // Add pagination links
    const baseUrl = `${req.url.origin}${req.url.pathname}`;
    const links = [];
    
    if (page > 1) {
      links.push(`<${baseUrl}?page=${page - 1}&limit=${limit}>; rel="prev"`);
    }
    
    if (offset + limit < total) {
      links.push(`<${baseUrl}?page=${page + 1}&limit=${limit}>; rel="next"`);
    }
    
    if (links.length > 0) {
      res.headers.set('Link', links.join(', '));
    }
    
    res.setRows(users, total);
  } catch (error) {
    res.setError('Failed to fetch users', {}, [], 500);
  }
});
```

### 8.3. File Download

```typescript
app.get('/api/files/:id/download', async (req, res) => {
  const fileId = req.data.get('id');
  
  try {
    const file = await getFileById(fileId);
    
    if (!file) {
      res.setError('File not found', {}, [], 404);
      return;
    }
    
    // Set download headers
    res.headers.set('Content-Type', file.mimetype);
    res.headers.set('Content-Length', file.size.toString());
    res.headers.set('Content-Disposition', `attachment; filename="${file.name}"`);
    
    // Stream file content
    res.body = file.stream;
    res.code = 200;
    res.status = 'OK';
    
    await res.dispatch();
  } catch (error) {
    res.setError('Failed to download file', {}, [], 500);
  }
});
```

### 8.4. Authentication Response

```typescript
app.post('/api/auth/login', async (req, res) => {
  await req.load();
  
  const { username, password } = req.data.get();
  
  try {
    const user = await authenticateUser(username, password);
    
    if (!user) {
      res.setError('Invalid credentials', {
        username: 'Invalid username or password'
      }, [], 401);
      return;
    }
    
    // Generate token
    const token = await generateToken(user);
    
    // Set session
    res.session.set('userId', user.id);
    res.session.set('username', user.username);
    
    // Set secure cookie
    res.headers.set('Set-Cookie', [
      `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
      `user=${user.username}; Secure; SameSite=Strict; Max-Age=86400`
    ]);
    
    res.setResults({
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      token,
      expiresIn: 86400
    });
  } catch (error) {
    res.setError('Authentication failed', {}, [], 500);
  }
});
```

### 8.5. Error Handling Middleware

```typescript
app.on('error', (error, req, res) => {
  console.error('Global error:', error);
  
  if (!res.sent) {
    if (error instanceof ValidationError) {
      res.setError('Validation failed', error.errors, [], 400);
    } else if (error instanceof AuthenticationError) {
      res.setError('Authentication required', {}, [], 401);
    } else if (error instanceof AuthorizationError) {
      res.setError('Access denied', {}, [], 403);
    } else {
      // Log detailed error but don't expose to client
      res.setError('Internal server error', {}, [], 500);
    }
  }
});
```

## 9. Type Safety

The Response class supports TypeScript generics for type-safe resource handling:

```typescript
import type { ServerResponse } from 'node:http';

// Node.js HTTP response
const nodeRes = new Response<ServerResponse>({
  resource: serverResponse
});

// WHATWG Fetch response
const fetchRes = new Response<globalThis.Response>();

// Custom response type
interface CustomResponse {
  customProperty: string;
}

const customRes = new Response<CustomResponse>({
  resource: { customProperty: 'value' }
});
```

The Response class provides a unified interface for handling HTTP responses across different platforms while maintaining type safety and providing convenient response formatting methods.
