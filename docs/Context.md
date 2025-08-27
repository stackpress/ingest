# Ingest

An event-driven serverless framework designed for modern web applications.

## Overview

Ingest is a lightweight, flexible server framework that brings the familiar Express.js-like API to serverless environments. Built on top of the powerful `@stackpress/lib` event system, Ingest provides a unified approach to building applications that can run anywhere - from traditional Node.js servers to serverless platforms like AWS Lambda, Vercel, and Netlify.

## Key Features

- **🚀 Serverless-First**: Designed specifically for serverless environments while maintaining compatibility with traditional servers
- **🔄 Event-Driven**: Built on a robust event system that enables reactive programming patterns
- **🛣️ Multi-Routing Interface**: Four different routing approaches in one framework
- **🔌 Plugin System**: Highly extensible with a simple plugin architecture
- **📦 Build Support**: Exposes routing information for bundlers and build tools
- **🌐 Cross-Platform**: Works with Node.js HTTP, WHATWG Fetch, and various serverless platforms

## Installation

```bash
npm install @stackpress/ingest
# or
yarn add @stackpress/ingest
```

## Quick Start

### Basic HTTP Server

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

// Traditional Express-like routing
app.get('/', (req, res) => {
  res.setHTML('<h1>Hello World!</h1>');
});

app.get('/api/users/:id', (req, res) => {
  const userId = req.data.get('id');
  res.setJSON({ id: userId, name: 'John Doe' });
});

// Start the server
app.create().listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Serverless Function (Vercel)

```typescript
import { server } from '@stackpress/ingest/whatwg';

const app = server();

app.get('/api/hello', (req, res) => {
  res.setJSON({ message: 'Hello from Vercel!' });
});

export default async function handler(request: Request) {
  return await app.handle(request, new Response());
}
```

## Multi-Routing Interface

Ingest provides four different ways to define routes, giving you flexibility in how you organize your application:

### 1. Action Router (Traditional)
Express.js-like inline route handlers:

```typescript
app.action.get('/users', (req, res) => {
  res.setJSON({ users: [] });
});
```

### 2. Entry Router (File-based)
Route to files that export default handlers:

```typescript
app.entry.get('/users', './routes/users.js');
```

### 3. Import Router (Lazy Loading)
Dynamic imports for code splitting:

```typescript
app.import.get('/users', () => import('./routes/users.js'));
```

### 4. View Router (Template-based)
Direct template rendering:

```typescript
app.view.get('/users', './views/users.hbs');
```

### Inferred Routing

Ingest can automatically determine which router to use based on your input:

```typescript
// Automatically uses action router
app.get('/users', (req, res) => { /* handler */ });

// Automatically uses import router
app.get('/users', () => import('./routes/users.js'));

// Automatically uses view router
app.get('/users', './views/users.hbs');
```

## Plugin System

Ingest features a powerful plugin system that allows you to modularize your application:

### Creating a Plugin

```typescript
// src/plugins/auth.ts
export default function authPlugin(server) {
  server.on('request', (req, res) => {
    // Add authentication logic
    if (!req.headers.get('authorization')) {
      res.setError('Unauthorized', {}, [], 401);
      return false; // Stop processing
    }
  });
}
```

### Registering Plugins

Add plugins to your `package.json`:

```json
{
  "plugins": [
    "./src/plugins/auth",
    "./src/plugins/logging",
    "@my-org/ingest-plugin"
  ]
}
```

### Bootstrapping

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

// Load all plugins
await app.bootstrap();

app.create().listen(3000);
```

## Event-Driven Architecture

Ingest is built on a powerful event system that allows for reactive programming:

```typescript
// Listen to all requests
app.on('request', (req, res) => {
  console.log(`${req.method} ${req.url.pathname}`);
});

// Listen to specific routes
app.on('GET /api/users', (req, res) => {
  // This runs for GET /api/users
});

// Priority-based listeners
app.on('request', middleware1, 10); // Higher priority
app.on('request', middleware2, 5);  // Lower priority
```

## Deployment Examples

### AWS Lambda

```typescript
import { server } from '@stackpress/ingest/whatwg';

const app = server();
app.get('/api/hello', (req, res) => {
  res.setJSON({ message: 'Hello from Lambda!' });
});

export const handler = async (event, context) => {
  const request = new Request(event.requestContext.http.sourceIp);
  const response = new Response();
  return await app.handle(request, response);
};
```

### Vercel

```typescript
import { server } from '@stackpress/ingest/whatwg';

const app = server();
app.get('/api/users', (req, res) => {
  res.setJSON({ users: [] });
});

export default async function handler(req: Request) {
  return await app.handle(req, new Response());
}
```

### Netlify

```typescript
import { server } from '@stackpress/ingest/whatwg';

const app = server();
app.get('/.netlify/functions/api', (req, res) => {
  res.setJSON({ message: 'Hello from Netlify!' });
});

export const handler = async (event, context) => {
  const request = new Request(event.rawUrl);
  const response = new Response();
  return await app.handle(request, response);
};
```

## Build Support

Ingest exposes routing information that can be used by bundlers and build tools:

```typescript
const app = server();
app.get('/users', () => import('./routes/users.js'));
app.get('/posts', () => import('./routes/posts.js'));

// Access routing information
console.log(app.routes);    // Route definitions
console.log(app.imports);   // Dynamic imports
console.log(app.entries);   // File entries
console.log(app.views);     // View templates
```

This information can be used by bundlers to:
- Pre-bundle route modules
- Generate static route manifests
- Optimize code splitting
- Create deployment artifacts

## Examples

Comprehensive examples demonstrating various use cases and deployment scenarios for the Ingest framework.

### Basic HTTP Server

#### Simple REST API

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

// Basic routes
app.get('/', (req, res) => {
  res.setHTML(`
    <h1>Welcome to Ingest API</h1>
    <p>Available endpoints:</p>
    <ul>
      <li>GET /api/users</li>
      <li>POST /api/users</li>
      <li>GET /api/users/:id</li>
    </ul>
  `);
});

// Get all users
app.get('/api/users', (req, res) => {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  res.setJSON({ users, total: users.length });
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.data.get('id'));
  const user = { id: userId, name: 'John Doe', email: 'john@example.com' };
  
  if (!userId || userId < 1) {
    res.setError('Invalid user ID', { id: 'must be a positive integer' }, [], 400);
    return;
  }
  
  res.setJSON({ user });
});

// Create new user
app.post('/api/users', async (req, res) => {
  await req.load(); // Load request body
  
  const userData = req.data.get();
  const { name, email } = userData;
  
  // Validation
  const errors = {};
  if (!name) errors.name = 'Name is required';
  if (!email) errors.email = 'Email is required';
  if (email && !email.includes('@')) errors.email = 'Invalid email format';
  
  if (Object.keys(errors).length > 0) {
    res.setError('Validation failed', errors, [], 400);
    return;
  }
  
  const newUser = { id: Date.now(), name, email };
  res.setJSON({ user: newUser }, 201, 'Created');
});

// Start server
app.create().listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

#### File Upload Handling

```typescript
import { server } from '@stackpress/ingest/http';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const app = server();

app.post('/upload', async (req, res) => {
  await req.load();
  
  const files = req.data.get('files');
  if (!files || !Array.isArray(files)) {
    res.setError('No files uploaded', {}, [], 400);
    return;
  }
  
  const uploadedFiles = [];
  
  for (const file of files) {
    const filename = `${Date.now()}-${file.name}`;
    const filepath = join('./uploads', filename);
    
    await writeFile(filepath, file.buffer);
    uploadedFiles.push({
      originalName: file.name,
      filename,
      size: file.size,
      mimetype: file.mimetype
    });
  }
  
  res.setJSON({ 
    message: 'Files uploaded successfully',
    files: uploadedFiles 
  });
});

app.create().listen(3000);
```

### Serverless Deployments

#### Vercel Deployment

```typescript
// api/index.ts
import { server } from '@stackpress/ingest/whatwg';

const app = server();

app.get('/api/hello', (req, res) => {
  res.setJSON({ 
    message: 'Hello from Vercel!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/users/:id', (req, res) => {
  const userId = req.data.get('id');
  res.setJSON({ 
    user: { id: userId, name: 'John Doe' },
    platform: 'Vercel'
  });
});

app.post('/api/contact', async (req, res) => {
  await req.load();
  
  const { name, email, message } = req.data.get();
  
  // Process contact form (send email, save to database, etc.)
  console.log('Contact form submission:', { name, email, message });
  
  res.setJSON({ 
    success: true,
    message: 'Thank you for your message!'
  });
});

export default async function handler(request: Request) {
  const response = new Response();
  return await app.handle(request, response);
}
```

#### AWS Lambda Deployment

```typescript
// index.ts
import { server } from '@stackpress/ingest/whatwg';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const app = server();

app.get('/api/health', (req, res) => {
  res.setJSON({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    platform: 'AWS Lambda'
  });
});

app.get('/api/data', (req, res) => {
  const data = [
    { id: 1, value: 'Item 1' },
    { id: 2, value: 'Item 2' },
    { id: 3, value: 'Item 3' }
  ];
  res.setJSON({ data });
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const request = new Request(event.requestContext.http?.sourceIp || 'localhost', {
      method: event.httpMethod,
      headers: event.headers,
      body: event.body
    });
    
    const response = new Response();
    const result = await app.handle(request, response);
    
    return {
      statusCode: result.code || 200,
      headers: Object.fromEntries(result.headers.entries()),
      body: JSON.stringify(result.body)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
```

#### Netlify Functions

```typescript
// netlify/functions/api.ts
import { server } from '@stackpress/ingest/whatwg';
import type { Handler } from '@netlify/functions';

const app = server();

app.get('/.netlify/functions/api/hello', (req, res) => {
  res.setJSON({ 
    message: 'Hello from Netlify!',
    platform: 'Netlify Functions'
  });
});

app.get('/.netlify/functions/api/time', (req, res) => {
  res.setJSON({ 
    time: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
});

export const handler: Handler = async (event) => {
  const request = new Request(event.rawUrl, {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body
  });
  
  const response = new Response();
  const result = await app.handle(request, response);
  
  return {
    statusCode: result.code || 200,
    headers: Object.fromEntries(result.headers.entries()),
    body: JSON.stringify(result.body)
  };
};
```

### Plugin Development

#### Authentication Plugin

```typescript
// plugins/auth.ts
import type { HttpServer } from '@stackpress/ingest';
import jwt from 'jsonwebtoken';

interface AuthConfig {
  secret: string;
  expiresIn: string;
}

export default function authPlugin(server: HttpServer) {
  // Configure plugin
  server.config.set('auth', {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: '24h'
  });
  
  // Add authentication middleware
  server.on('request', async (req, res) => {
    const url = req.url.pathname;
    
    // Skip auth for public routes
    if (url.startsWith('/public') || url === '/login') {
      return true;
    }
    
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      res.setError('Authentication required', {}, [], 401);
      return false; // Stop processing
    }
    
    try {
      const config = server.config.get('auth') as AuthConfig;
      const decoded = jwt.verify(token, config.secret);
      req.data.set('user', decoded);
      return true;
    } catch (error) {
      res.setError('Invalid token', {}, [], 401);
      return false;
    }
  }, 10); // High priority
  
  // Add login route
  server.post('/login', async (req, res) => {
    await req.load();
    const { username, password } = req.data.get();
    
    // Validate credentials (replace with real validation)
    if (username === 'admin' && password === 'password') {
      const config = server.config.get('auth') as AuthConfig;
      const token = jwt.sign(
        { username, role: 'admin' },
        config.secret,
        { expiresIn: config.expiresIn }
      );
      
      res.setJSON({ token, user: { username, role: 'admin' } });
    } else {
      res.setError('Invalid credentials', {}, [], 401);
    }
  });
  
  // Add user info route
  server.get('/me', (req, res) => {
    const user = req.data.get('user');
    res.setJSON({ user });
  });
}
```

#### Logging Plugin

```typescript
// plugins/logging.ts
import type { HttpServer } from '@stackpress/ingest';

export default function loggingPlugin(server: HttpServer) {
  // Configure logging
  server.config.set('logging', {
    enabled: true,
    level: 'info',
    format: 'combined'
  });
  
  // Request logging middleware
  server.on('request', (req, res) => {
    const start = Date.now();
    const { method, url } = req;
    
    console.log(`[${new Date().toISOString()}] ${method} ${url.pathname}`);
    
    // Log response when finished
    server.after = async () => {
      const duration = Date.now() - start;
      console.log(
        `[${new Date().toISOString()}] ${method} ${url.pathname} - ` +
        `${res.code} ${res.status} - ${duration}ms`
      );
    };
    
    return true;
  }, 5); // Medium priority
  
  // Error logging
  server.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] ERROR:`, error);
  });
}
```

#### Rate Limiting Plugin

```typescript
// plugins/rateLimit.ts
import type { HttpServer } from '@stackpress/ingest';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

export default function rateLimitPlugin(server: HttpServer) {
  const requests = new Map<string, number[]>();
  
  server.config.set('rateLimit', {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later'
  });
  
  server.on('request', (req, res) => {
    const config = server.config.get('rateLimit') as RateLimitConfig;
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    // Get or create request history for this IP
    const clientRequests = requests.get(clientIp) || [];
    
    // Remove old requests outside the window
    const validRequests = clientRequests.filter(
      time => now - time < config.windowMs
    );
    
    // Check if limit exceeded
    if (validRequests.length >= config.maxRequests) {
      res.setError(config.message, {}, [], 429);
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    requests.set(clientIp, validRequests);
    
    return true;
  }, 8); // High priority
}
```

### Template Engine Integration

#### Handlebars Integration

```typescript
// server.ts
import { server } from '@stackpress/ingest/http';
import handlebars from 'handlebars';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const app = server();

// Configure Handlebars
app.view.engine('hbs', handlebars);
app.view.render('hbs', async (template: string, data: any) => {
  const templateContent = await readFile(
    join('./views', template), 
    'utf-8'
  );
  const compiled = handlebars.compile(templateContent);
  return compiled(data);
});

// Register Handlebars helpers
handlebars.registerHelper('formatDate', (date: Date) => {
  return date.toLocaleDateString();
});

handlebars.registerHelper('uppercase', (str: string) => {
  return str.toUpperCase();
});

// Routes using templates
app.get('/', (req, res) => {
  res.setHTML(app.view.render('hbs', 'home.hbs', {
    title: 'Welcome to Ingest',
    message: 'Hello from Handlebars!',
    users: [
      { name: 'John', email: 'john@example.com' },
      { name: 'Jane', email: 'jane@example.com' }
    ]
  }));
});

app.get('/users', (req, res) => {
  const users = [
    { id: 1, name: 'John Doe', createdAt: new Date() },
    { id: 2, name: 'Jane Smith', createdAt: new Date() }
  ];
  
  res.setHTML(app.view.render('hbs', 'users.hbs', {
    title: 'Users List',
    users
  }));
});

// Direct view routing
app.view.get('/about', 'about.hbs');
app.view.get('/contact', 'contact.hbs');

app.create().listen(3000);
```

```handlebars
<!-- views/home.hbs -->
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  <h1>{{uppercase title}}</h1>
  <p>{{message}}</p>
  
  <h2>Users</h2>
  <ul>
    {{#each users}}
    <li>{{name}} - {{email}}</li>
    {{/each}}
  </ul>
</body>
</html>
```

```handlebars
<!-- views/users.hbs -->
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  <h1>{{title}}</h1>
  
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      {{#each users}}
      <tr>
        <td>{{id}}</td>
        <td>{{name}}</td>
        <td>{{formatDate createdAt}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</body>
</html>
```

### Advanced Routing

#### File-Based Routing

```typescript
// server.ts
import { server } from '@stackpress/ingest/http';

const app = server();

// Entry-based routing (file paths)
app.entry.get('/api/users', './routes/users.js');
app.entry.get('/api/posts', './routes/posts.js');
app.entry.post('/api/auth/login', './routes/auth/login.js');

// Import-based routing (dynamic imports)
app.import.get('/api/products', () => import('./routes/products.js'));
app.import.get('/api/orders', () => import('./routes/orders.js'));

app.create().listen(3000);
```

```typescript
// routes/users.js
export default async function usersHandler(req, res, server) {
  const users = await server.plugin('database').getUsers();
  res.setJSON({ users });
}
```

```typescript
// routes/products.js
export default async function productsHandler(req, res, server) {
  const { category, limit = 10 } = req.query.get();
  
  const products = await server.plugin('database').getProducts({
    category,
    limit: parseInt(limit)
  });
  
  res.setJSON({ products, total: products.length });
}
```

#### Pattern-Based Routing

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

// Wildcard patterns
app.get('/api/*', (req, res) => {
  console.log('API endpoint accessed');
  // Continue to specific handlers
});

// Parameter patterns
app.get('/users/:userId/posts/:postId', (req, res) => {
  const userId = req.data.get('userId');
  const postId = req.data.get('postId');
  
  res.setJSON({ 
    message: `User ${userId}, Post ${postId}`,
    params: { userId, postId }
  });
});

// Regex patterns
app.on(/^GET \/files\/(.+\.(jpg|png|gif))$/i, (req, res) => {
  const filename = req.event?.data.args[0];
  const extension = req.event?.data.args[1];
  
  res.setJSON({ 
    message: `Serving image file: ${filename}`,
    type: extension
  });
});

// Catch-all routes
app.get('/**', (req, res) => {
  res.setError('Not Found', {}, [], 404);
});

app.create().listen(3000);
```

### Middleware and Event Handling

#### Request Processing Pipeline

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

// CORS middleware (highest priority)
app.on('request', (req, res) => {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.code = 200;
    return false; // Stop processing for preflight
  }
  
  return true;
}, 20);

// Security headers (high priority)
app.on('request', (req, res) => {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  return true;
}, 15);

// Request logging (medium priority)
app.on('request', (req, res) => {
  console.log(`${req.method} ${req.url.pathname} - ${new Date().toISOString()}`);
  return true;
}, 10);

// Body parsing (low priority)
app.on('request', async (req, res) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    await req.load();
  }
  return true;
}, 5);

// Routes
app.get('/api/test', (req, res) => {
  res.setJSON({ message: 'Middleware pipeline working!' });
});

app.create().listen(3000);
```

#### Event-Driven Architecture

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

// Global event listeners
app.on('user-created', async (userData) => {
  console.log('New user created:', userData);
  // Send welcome email, create user directory, etc.
});

app.on('order-placed', async (orderData) => {
  console.log('New order placed:', orderData);
  // Process payment, update inventory, send confirmation
});

// Route handlers that emit events
app.post('/api/users', async (req, res) => {
  await req.load();
  const userData = req.data.get();
  
  // Create user logic here
  const newUser = { id: Date.now(), ...userData };
  
  // Emit event for other systems to react
  await app.emit('user-created', newUser);
  
  res.setJSON({ user: newUser }, 201);
});

app.post('/api/orders', async (req, res) => {
  await req.load();
  const orderData = req.data.get();
  
  // Create order logic here
  const newOrder = { id: Date.now(), ...orderData };
  
  // Emit event
  await app.emit('order-placed', newOrder);
  
  res.setJSON({ order: newOrder }, 201);
});

app.create().listen(3000);
```

### Error Handling

#### Global Error Handling

```typescript
import { server, Exception } from '@stackpress/ingest/http';

const app = server();

// Global error handler
app.on('error', (error, req, res) => {
  console.error('Global error:', error);
  
  if (!res.sent) {
    if (error instanceof Exception) {
      res.fromStatusResponse(error.toResponse());
    } else {
      res.setError('Internal Server Error', {}, [], 500);
    }
  }
});

// Routes with error handling
app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = req.data.get('id');
    
    if (!userId) {
      throw Exception.for('User ID is required').withCode(400);
    }
    
    if (isNaN(parseInt(userId))) {
      throw Exception.for('User ID must be a number').withCode(400);
    }
    
    // Simulate database error
    if (userId === '999') {
      throw new Error('Database connection failed');
    }
    
    const user = { id: userId, name: 'John Doe' };
    res.setJSON({ user });
    
  } catch (error) {
    await app.emit('error', error, req, res);
  }
});

// Validation errors
app.post('/api/users', async (req, res) => {
  try {
    await req.load();
    const { name, email, age } = req.data.get();
    
    const errors = {};
    if (!name) errors.name = 'Name is required';
    if (!email) errors.email = 'Email is required';
    if (email && !email.includes('@')) errors.email = 'Invalid email format';
    if (age && (age < 18 || age > 120)) errors.age = 'Age must be between 18 and 120';
    
    if (Object.keys(errors).length > 0) {
      throw Exception.forErrors(errors);
    }
    
    const user = { id: Date.now(), name, email, age };
    res.setJSON({ user }, 201);
    
  } catch (error) {
    await app.emit('error', error, req, res);
  }
});

app.create().listen(3000);
```

### Build Integration

#### Webpack Integration

```typescript
// webpack.config.js
import { server } from '@stackpress/ingest/http';

const app = server();

// Define routes with dynamic imports
app.import.get('/users', () => import('./routes/users.js'));
app.import.get('/posts', () => import('./routes/posts.js'));
app.import.get('/products', () => import('./routes/products.js'));

// Extract route information for webpack
const routes = Array.from(app.imports.entries()).map(([pattern, handlers]) => {
  const handler = Array.from(handlers)[0];
  return {
    pattern,
    import: handler.import.toString()
  };
});

export default {
  entry: './src/index.js',
  output: {
    path: './dist',
    filename: '[name].bundle.js'
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        routes: {
          test: /routes\//,
          name: 'routes',
          chunks: 'all'
        }
      }
    }
  },
  plugins: [
    new (class IngestRoutesPlugin {
      apply(compiler) {
        compiler.hooks.emit.tap('IngestRoutesPlugin', (compilation) => {
          const routeManifest = JSON.stringify(routes, null, 2);
          compilation.assets['route-manifest.json'] = {
            source: () => routeManifest,
            size: () => routeManifest.length
          };
        });
      }
    })()
  ]
};
```

#### Vite Integration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { server } from '@stackpress/ingest/http';

const app = server();
app.import.get('/api/users', () => import('./api/users.js'));
app.import.get('/api/posts', () => import('./api/posts.js'));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './src/main.ts',
        ...Object.fromEntries(
          Array.from(app.imports.entries()).map(([pattern, handlers]) => {
            const handler = Array.from(handlers)[0];
            const routeName = pattern.replace(/[^a-zA-Z0-9]/g, '_');
            return [routeName, handler.import];
          })
        )
      }
    }
  },
  plugins: [
    {
      name: 'ingest-routes',
      generateBundle() {
        const routes = Array.from(app.routes.entries()).map(([key, route]) => ({
          pattern: route.path,
          method: route.method,
          key
        }));
        
        this.emitFile({
          type: 'asset',
          fileName: 'routes.json',
          source: JSON.stringify(routes, null, 2)
        });
      }
    }
  ]
});
```

These examples demonstrate the flexibility and power of the Ingest framework across various use cases and deployment scenarios. Each example can be adapted and extended based on your specific requirements.

## Plugin Development Guide

Learn how to create powerful plugins for the Ingest framework to extend functionality and build modular applications.

### Plugin Basics

#### What is a Plugin?

A plugin in Ingest is a function that receives the server instance and configures it by:
- Setting configuration values
- Adding event listeners (middleware)
- Registering routes
- Registering reusable components
- Extending server functionality

#### Plugin Function Signature

```typescript
import type { HttpServer } from '@stackpress/ingest';

export default function myPlugin(server: HttpServer) {
  // Plugin implementation
}
```

#### Plugin Registration

Add your plugin to the `plugins` array in `package.json`:

```json
{
  "plugins": [
    "./src/plugins/my-plugin",
    "@my-org/ingest-auth-plugin"
  ]
}
```

#### Plugin Loading

Plugins are loaded automatically when you call `server.bootstrap()`:

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();
await app.bootstrap(); // Loads all plugins
app.create().listen(3000);
```

### Plugin Structure

#### Basic Plugin Template

```typescript
// plugins/my-plugin.ts
import type { HttpServer } from '@stackpress/ingest';

interface MyPluginConfig {
  enabled: boolean;
  apiKey?: string;
  timeout: number;
}

export default function myPlugin(server: HttpServer) {
  // 1. Set default configuration
  server.config.set('myPlugin', {
    enabled: true,
    timeout: 5000
  } as MyPluginConfig);
  
  // 2. Add middleware/event listeners
  server.on('request', (req, res) => {
    const config = server.config.get('myPlugin') as MyPluginConfig;
    if (!config.enabled) return true;
    
    // Plugin logic here
    console.log('MyPlugin: Processing request');
    return true;
  });
  
  // 3. Register routes
  server.get('/my-plugin/status', (req, res) => {
    res.setJSON({ status: 'active', plugin: 'myPlugin' });
  });
  
  // 4. Register components
  server.register('myPlugin', {
    version: '1.0.0',
    utils: {
      formatData: (data: any) => JSON.stringify(data, null, 2)
    }
  });
}
```

#### TypeScript Plugin with Interfaces

```typescript
// plugins/database.ts
import type { HttpServer } from '@stackpress/ingest';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

interface DatabaseConnection {
  query: (sql: string, params?: any[]) => Promise<any>;
  close: () => Promise<void>;
}

export default function databasePlugin(server: HttpServer) {
  let connection: DatabaseConnection | null = null;
  
  // Configuration
  server.config.set('database', {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'app',
    username: process.env.DB_USER || 'user',
    password: process.env.DB_PASS || 'password',
    ssl: process.env.DB_SSL === 'true'
  } as DatabaseConfig);
  
  // Initialize connection
  server.on('server-start', async () => {
    const config = server.config.get('database') as DatabaseConfig;
    connection = await createConnection(config);
    console.log('Database connected');
  });
  
  // Close connection
  server.on('server-stop', async () => {
    if (connection) {
      await connection.close();
      console.log('Database disconnected');
    }
  });
  
  // Register database utilities
  server.register('database', {
    query: async (sql: string, params?: any[]) => {
      if (!connection) throw new Error('Database not connected');
      return await connection.query(sql, params);
    },
    
    findById: async (table: string, id: any) => {
      const result = await server.plugin('database').query(
        `SELECT * FROM ${table} WHERE id = $1`,
        [id]
      );
      return result.rows[0];
    },
    
    create: async (table: string, data: Record<string, any>) => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      
      const result = await server.plugin('database').query(
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      return result.rows[0];
    }
  });
}

async function createConnection(config: DatabaseConfig): Promise<DatabaseConnection> {
  // Implementation depends on your database library
  // This is a mock implementation
  return {
    query: async (sql: string, params?: any[]) => {
      console.log('Executing query:', sql, params);
      return { rows: [] };
    },
    close: async () => {
      console.log('Closing connection');
    }
  };
}
```

### Configuration Management

#### Setting Configuration

```typescript
export default function configPlugin(server: HttpServer) {
  // Set nested configuration
  server.config.set('app', {
    name: 'My App',
    version: '1.0.0',
    features: {
      auth: true,
      logging: true,
      metrics: false
    }
  });
  
  // Set individual values
  server.config.set('app', 'environment', process.env.NODE_ENV || 'development');
}
```

#### Reading Configuration

```typescript
export default function consumerPlugin(server: HttpServer) {
  server.on('request', (req, res) => {
    // Get entire config object
    const appConfig = server.config.get('app');
    
    // Get nested values
    const appName = server.config.get('app', 'name');
    const authEnabled = server.config.get('app', 'features', 'auth');
    
    // Use path notation
    const version = server.config.path('app.version');
    
    console.log(`${appName} v${version} - Auth: ${authEnabled}`);
    return true;
  });
}
```

#### Environment-Based Configuration

```typescript
export default function envConfigPlugin(server: HttpServer) {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      debug: true,
      logLevel: 'debug',
      database: { host: 'localhost' }
    },
    production: {
      debug: false,
      logLevel: 'error',
      database: { host: process.env.DB_HOST }
    },
    test: {
      debug: false,
      logLevel: 'silent',
      database: { host: 'localhost', database: 'test_db' }
    }
  };
  
  server.config.set('environment', env);
  server.config.set('app', configs[env] || configs.development);
}
```

### Event Handling

#### Request Middleware

```typescript
export default function middlewarePlugin(server: HttpServer) {
  // CORS middleware (high priority)
  server.on('request', (req, res) => {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.code = 200;
      return false; // Stop processing
    }
    
    return true;
  }, 20);
  
  // Authentication middleware (medium priority)
  server.on('request', async (req, res) => {
    const publicPaths = ['/login', '/register', '/health'];
    if (publicPaths.includes(req.url.pathname)) {
      return true;
    }
    
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      res.setError('Authentication required', {}, [], 401);
      return false;
    }
    
    try {
      const user = await validateToken(token);
      req.data.set('user', user);
      return true;
    } catch (error) {
      res.setError('Invalid token', {}, [], 401);
      return false;
    }
  }, 10);
  
  // Logging middleware (low priority)
  server.on('request', (req, res) => {
    const start = Date.now();
    console.log(`${req.method} ${req.url.pathname} - Started`);
    
    // Log when response is sent
    server.after = async () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.url.pathname} - ${res.code} (${duration}ms)`);
    };
    
    return true;
  }, 1);
}

async function validateToken(token: string) {
  // Mock token validation
  if (token === 'valid-token') {
    return { id: 1, username: 'user', role: 'admin' };
  }
  throw new Error('Invalid token');
}
```

#### Custom Events

```typescript
export default function eventPlugin(server: HttpServer) {
  // Listen to custom events
  server.on('user-created', async (userData) => {
    console.log('New user created:', userData);
    
    // Send welcome email
    await sendWelcomeEmail(userData.email);
    
    // Create user directory
    await createUserDirectory(userData.id);
    
    // Log to analytics
    await trackEvent('user_registration', userData);
  });
  
  server.on('order-placed', async (orderData) => {
    console.log('Order placed:', orderData);
    
    // Process payment
    await processPayment(orderData);
    
    // Update inventory
    await updateInventory(orderData.items);
    
    // Send confirmation
    await sendOrderConfirmation(orderData);
  });
  
  // Route that emits events
  server.post('/api/users', async (req, res) => {
    await req.load();
    const userData = req.data.get();
    
    // Create user
    const user = await createUser(userData);
    
    // Emit event for other plugins to handle
    await server.emit('user-created', user);
    
    res.setJSON({ user }, 201);
  });
}

// Mock functions
async function sendWelcomeEmail(email: string) { /* ... */ }
async function createUserDirectory(userId: number) { /* ... */ }
async function trackEvent(event: string, data: any) { /* ... */ }
async function processPayment(orderData: any) { /* ... */ }
async function updateInventory(items: any[]) { /* ... */ }
async function sendOrderConfirmation(orderData: any) { /* ... */ }
async function createUser(userData: any) { return { id: Date.now(), ...userData }; }
```

### Route Registration

#### Adding Routes in Plugins

```typescript
export default function apiPlugin(server: HttpServer) {
  // Basic routes
  server.get('/api/health', (req, res) => {
    res.setJSON({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  // Routes with parameters
  server.get('/api/users/:id', async (req, res) => {
    const userId = req.data.get('id');
    const db = server.plugin('database');
    
    try {
      const user = await db.findById('users', userId);
      if (!user) {
        res.setError('User not found', {}, [], 404);
        return;
      }
      
      res.setJSON({ user });
    } catch (error) {
      res.setError('Database error', {}, [], 500);
    }
  });
  
  // Protected routes
  server.post('/api/admin/users', async (req, res) => {
    const user = req.data.get('user');
    if (user?.role !== 'admin') {
      res.setError('Admin access required', {}, [], 403);
      return;
    }
    
    await req.load();
    const userData = req.data.get();
    
    const db = server.plugin('database');
    const newUser = await db.create('users', userData);
    
    res.setJSON({ user: newUser }, 201);
  });
  
  // File-based routes
  server.entry.get('/api/reports', './routes/reports.js');
  server.import.get('/api/analytics', () => import('./routes/analytics.js'));
}
```

#### Route Groups and Prefixes

```typescript
export default function routeGroupPlugin(server: HttpServer) {
  // Create a route group with common middleware
  const apiGroup = (path: string, handler: any) => {
    server.on(`request`, async (req, res) => {
      if (!req.url.pathname.startsWith('/api')) return true;
      
      // API-specific middleware
      res.headers.set('Content-Type', 'application/json');
      
      // Rate limiting for API routes
      const rateLimiter = server.plugin('rateLimiter');
      if (rateLimiter && !await rateLimiter.check(req)) {
        res.setError('Rate limit exceeded', {}, [], 429);
        return false;
      }
      
      return true;
    }, 5);
    
    server.route('GET', path, handler);
  };
  
  // Use the group
  apiGroup('/api/users', async (req, res) => {
    res.setJSON({ users: [] });
  });
  
  apiGroup('/api/posts', async (req, res) => {
    res.setJSON({ posts: [] });
  });
}
```

### Component Registration

#### Registering Utilities

```typescript
export default function utilsPlugin(server: HttpServer) {
  server.register('utils', {
    // Date utilities
    formatDate: (date: Date, format = 'ISO') => {
      switch (format) {
        case 'ISO': return date.toISOString();
        case 'local': return date.toLocaleDateString();
        case 'time': return date.toLocaleTimeString();
        default: return date.toString();
      }
    },
    
    // String utilities
    slugify: (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    },
    
    // Validation utilities
    isEmail: (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    
    isStrongPassword: (password: string) => {
      return password.length >= 8 &&
             /[A-Z]/.test(password) &&
             /[a-z]/.test(password) &&
             /[0-9]/.test(password) &&
             /[^A-Za-z0-9]/.test(password);
    },
    
    // Async utilities
    delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
    
    retry: async <T>(fn: () => Promise<T>, attempts = 3): Promise<T> => {
      for (let i = 0; i < attempts; i++) {
        try {
          return await fn();
        } catch (error) {
          if (i === attempts - 1) throw error;
          await server.plugin('utils').delay(1000 * Math.pow(2, i));
        }
      }
      throw new Error('Max retries exceeded');
    }
  });
}
```

#### Service Registration

```typescript
export default function servicesPlugin(server: HttpServer) {
  // Email service
  server.register('emailService', {
    send: async (to: string, subject: string, body: string) => {
      const config = server.config.get('email');
      console.log(`Sending email to ${to}: ${subject}`);
      // Implementation depends on email provider
    },
    
    sendTemplate: async (to: string, template: string, data: any) => {
      const templates = server.plugin('templates');
      const body = await templates.render(template, data);
      return server.plugin('emailService').send(to, template, body);
    }
  });
  
  // Cache service
  server.register('cache', {
    store: new Map(),
    
    get: async (key: string) => {
      const cache = server.plugin('cache');
      return cache.store.get(key);
    },
    
    set: async (key: string, value: any, ttl = 3600) => {
      const cache = server.plugin('cache');
      cache.store.set(key, value);
      
      // Auto-expire
      setTimeout(() => {
        cache.store.delete(key);
      }, ttl * 1000);
    },
    
    delete: async (key: string) => {
      const cache = server.plugin('cache');
      return cache.store.delete(key);
    },
    
    clear: async () => {
      const cache = server.plugin('cache');
      cache.store.clear();
    }
  });
  
  // HTTP client service
  server.register('httpClient', {
    get: async (url: string, options = {}) => {
      const response = await fetch(url, { method: 'GET', ...options });
      return response.json();
    },
    
    post: async (url: string, data: any, options = {}) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        ...options
      });
      return response.json();
    }
  });
}
```

### Advanced Patterns

#### Plugin Dependencies

```typescript
// plugins/advanced-auth.ts
export default function advancedAuthPlugin(server: HttpServer) {
  // Check for required plugins
  const requiredPlugins = ['database', 'cache', 'emailService'];
  for (const plugin of requiredPlugins) {
    if (!server.plugin(plugin)) {
      throw new Error(`AdvancedAuth plugin requires ${plugin} plugin`);
    }
  }
  
  server.register('auth', {
    login: async (username: string, password: string) => {
      const db = server.plugin('database');
      const cache = server.plugin('cache');
      
      // Check cache first
      const cachedUser = await cache.get(`user:${username}`);
      if (cachedUser) {
        return validatePassword(password, cachedUser.passwordHash) ? cachedUser : null;
      }
      
      // Query database
      const user = await db.query('SELECT * FROM users WHERE username = $1', [username]);
      if (!user.rows[0]) return null;
      
      // Cache user
      await cache.set(`user:${username}`, user.rows[0], 300);
      
      return validatePassword(password, user.rows[0].passwordHash) ? user.rows[0] : null;
    },
    
    register: async (userData: any) => {
      const db = server.plugin('database');
      const emailService = server.plugin('emailService');
      
      // Hash password
      userData.passwordHash = await hashPassword(userData.password);
      delete userData.password;
      
      // Create user
      const user = await db.create('users', userData);
      
      // Send welcome email
      await emailService.sendTemplate(user.email, 'welcome', { user });
      
      return user;
    }
  });
}

async function hashPassword(password: string): Promise<string> {
  // Implementation depends on crypto library
  return 'hashed_' + password;
}

function validatePassword(password: string, hash: string): boolean {
  return hash === 'hashed_' + password;
}
```

#### Plugin Configuration Validation

```typescript
import Joi from 'joi';

const configSchema = Joi.object({
  enabled: Joi.boolean().default(true),
  apiKey: Joi.string().required(),
  timeout: Joi.number().min(1000).max(30000).default(5000),
  retries: Joi.number().min(0).max(5).default(3),
  endpoints: Joi.object({
    primary: Joi.string().uri().required(),
    fallback: Joi.string().uri().optional()
  }).required()
});

export default function validatedPlugin(server: HttpServer) {
  // Get and validate configuration
  const config = server.config.get('validatedPlugin') || {};
  const { error, value } = configSchema.validate(config);
  
  if (error) {
    throw new Error(`Invalid plugin configuration: ${error.message}`);
  }
  
  // Update config with validated values
  server.config.set('validatedPlugin', value);
  
  // Use validated config
  const validatedConfig = server.config.get('validatedPlugin');
  console.log('Plugin configured with:', validatedConfig);
}
```

#### Conditional Plugin Loading

```typescript
export default function conditionalPlugin(server: HttpServer) {
  const env = process.env.NODE_ENV;
  const features = server.config.get('features') || {};
  
  // Only load in development
  if (env === 'development') {
    server.get('/debug/config', (req, res) => {
      res.setJSON(server.config.get());
    });
    
    server.get('/debug/plugins', (req, res) => {
      const plugins = Array.from(server.plugins.keys());
      res.setJSON({ plugins });
    });
  }
  
  // Feature flags
  if (features.analytics) {
    server.on('request', (req, res) => {
      // Track request
      console.log('Analytics: Request tracked');
      return true;
    });
  }
  
  if (features.monitoring) {
    server.on('error', (error) => {
      // Send to monitoring service
      console.log('Monitoring: Error reported', error.message);
    });
  }
}
```

### Testing Plugins

#### Unit Testing

```typescript
// tests/plugins/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@stackpress/ingest/http';
import authPlugin from '../src/plugins/auth';

describe('Auth Plugin', () => {
  let app: any;
  
  beforeEach(() => {
    app = server();
    authPlugin(app);
  });
  
  it('should set default configuration', () => {
    const config = app.config.get('auth');
    expect(config).toBeDefined();
    expect(config.enabled).toBe(true);
  });
  
  it('should register auth component', () => {
    const auth = app.plugin('auth');
    expect(auth).toBeDefined();
    expect(typeof auth.login).toBe('function');
  });
  
  it('should add authentication middleware', async () => {
    const req = app.request({ 
      url: 'http://localhost/protected',
      headers: { authorization: 'Bearer invalid-token' }
    });
    const res = app.response();
    
    await app.handle(req, res);
    expect(res.code).toBe(401);
  });
});
```

#### Integration Testing

```typescript
// tests/integration/plugin-integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@stackpress/ingest/http';
import authPlugin from '../src/plugins/auth';
import databasePlugin from '../src/plugins/database';

describe('Plugin Integration', () => {
  let app: any;
  
  beforeEach(async () => {
    app = server();
    
    // Load plugins in order
    databasePlugin(app);
    authPlugin(app);
    
    // Bootstrap
    await app.bootstrap();
  });
  
  it('should work with multiple plugins', async () => {
    const auth = app.plugin('auth');
    const db = app.plugin('database');
    
    expect(auth).toBeDefined();
    expect(db).toBeDefined();
    
    // Test plugin interaction
    const user = await auth.register({
      username: 'test',
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(user).toBeDefined();
    expect(user.username).toBe('test');
  });
});
```

#### Mocking Dependencies

```typescript
// tests/mocks/database.mock.ts
export function createMockDatabase() {
  const store = new Map();
  
  return {
    query: async (sql: string, params: any[] = []) => {
      // Mock implementation
      if (sql.includes('SELECT')) {
        return { rows: [{ id: 1, username: 'test' }] };
      }
      if (sql.includes('INSERT')) {
        const id = Date.now();
        return { rows: [{ id, ...params }] };
      }
      return { rows: [] };
    },
    
    findById: async (table: string, id: any) => {
      return { id, table, found: true };
    },
    
    create: async (table: string, data: any) => {
      return { id: Date.now(), ...data };
    }
  };
}

// Use in tests
import { createMockDatabase } from './mocks/database.mock';

beforeEach(() => {
  app = server();
  app.register('database', createMockDatabase());
  authPlugin(app);
});
```

### Publishing Plugins

#### Package Structure

```
my-ingest-plugin/
├── package.json
├── README.md
├── LICENSE
├── src/
│   ├── index.ts
│   ├── types.ts
│   └── utils.ts
├── dist/
│   ├── index.js
│   ├── index.d.ts
│   └── ...
└── tests/
    ├── index.test.ts
    └── ...
```

#### Package.json Configuration

```json
{
  "name": "@my-org/ingest-auth-plugin",
  "version": "1.0.0",
  "description": "Authentication plugin for Ingest framework",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "keywords": [
    "ingest",
    "plugin",
    "authentication",
    "auth",
    "serverless"
  ],
  "peerDependencies": {
    "@stackpress/ingest": "^0.6.0"
  },
  "devDependencies": {
    "@stackpress/ingest": "^0.6.0",
    "typescript": "^5.0.0"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "prepublishOnly": "npm run build"
  }
}
```

#### Plugin Entry Point

```typescript
// src/index.ts
import type { HttpServer } from '@stackpress/ingest';

export interface AuthPluginConfig {
  secret: string;
  expiresIn: string;
  algorithm: string;
}

export default function authPlugin(server: HttpServer) {
  // Plugin implementation
}

// Export types for consumers
export * from './types';
```

#### Documentation

```markdown
## @my-org/ingest-auth-plugin

Authentication plugin for the Ingest framework.

### Installation

```bash
npm install @my-org/ingest-auth-plugin
```

### Usage

Add to your `package.json`:

```json
{
  "plugins": [
    "@my-org/ingest-auth-plugin"
  ]
}
```

Configure in your server:

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();
app.config.set('auth', {
  secret: 'your-secret-key',
  expiresIn: '24h'
});

await app.bootstrap();
```

### API

#### Configuration

- `secret` (string): JWT secret key
- `expiresIn` (string): Token expiration time
- `algorithm` (string): JWT algorithm (default: 'HS256')

#### Methods

- `auth.login(username, password)`: Authenticate user
- `auth.register(userData)`: Register new user
- `auth.verify(token)`: Verify JWT token

This guide provides everything you need to create powerful, reusable plugins for the Ingest framework. Plugins are the key to building modular, maintainable applications that can be easily extended and customized. Check out the `examples/` directory for complete working examples:

- `with-http` - Basic HTTP server
- `with-vercel` - Vercel deployment
- `with-lambda` - AWS Lambda deployment
- `with-netlify` - Netlify deployment
- `with-plugins` - Plugin system usage
- `with-handlebars` - Template engine integration

## Server

The Server class is the core of the Ingest framework, extending Router with configuration management and plugin support.

### Overview

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

### Type Parameters

The Server class accepts three generic type parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `C` | `UnknownNest` | Configuration map type |
| `R` | `unknown` | Request resource type |
| `S` | `unknown` | Response resource type |

### Properties

The following properties are available when instantiating a Server.

| Property | Type | Description |
|----------|------|-------------|
| `config` | `CallableNest<C>` | Configuration object for server settings |
| `loader` | `PluginLoader` | Plugin loader instance for managing plugins |
| `plugins` | `CallableMap` | Map of registered plugin configurations |

### Methods

The following methods are available when instantiating a Server.

#### Bootstrapping Plugins

The following example shows how to load and initialize all registered plugins.

```typescript
const app = server();
await app.bootstrap();
```

**Returns**

The Server instance to allow method chaining.

#### Creating a Server Instance

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

#### Handling Requests

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

#### Plugin Management

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

### Setters

The following setters are available for customizing server behavior.

#### Setting Gateway

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

#### Setting Handler

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

### Factory Functions

The following factory functions are available for creating server instances.

#### server()

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

#### router()

Creates a new Router instance without server functionality.

```typescript
import { router } from '@stackpress/ingest';

const appRouter = router();
```

**Returns**

A new Router instance.

#### action()

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

### Configuration Management

The Server class provides a powerful configuration system through the `config` property.

#### Setting Configuration

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

#### Reading Configuration

```typescript
// Get entire config section
const dbConfig = app.config.get('database');

// Get nested values
const dbHost = app.config.get('database', 'host');

// Use path notation
const appName = app.config.path('app.name');
```

### Plugin System Integration

The Server class is designed to work seamlessly with the plugin system.

#### Plugin Loading

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

#### Plugin Access

```typescript
// Access plugin functionality
const db = app.plugin('database');
const users = await db.query('SELECT * FROM users');

const auth = app.plugin('auth');
const token = await auth.generateToken(user);
```

### Examples

#### Basic HTTP Server

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

#### Serverless Function

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

#### With Plugins

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

### Inheritance

The Server class extends the Router class, inheriting all routing functionality:

- Event-driven routing with pattern matching
- Multiple routing interfaces (action, entry, import, view)
- Request and response handling
- Event emission and listening capabilities

## Router

The Router class provides event-driven routing capabilities with pattern matching and parameter extraction.

### Overview

The Router class is the foundation of Ingest's routing system, providing:
- Event-driven routing with pattern matching
- Multiple routing interfaces (action, entry, import, view)
- HTTP method routing (GET, POST, PUT, DELETE, etc.)
- Request and response object creation
- Route resolution and event emission

```typescript
import { Router } from '@stackpress/ingest';

const router = new Router();
```

### Type Parameters

The Router class accepts two generic type parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `R` | `unknown` | Request resource type |
| `S` | `unknown` | Response resource type |

### Properties

The following properties are available when instantiating a Router.

| Property | Type | Description |
|----------|------|-------------|
| `action` | `ActionRouter<R, S, this>` | Traditional Express.js-like routing interface |
| `entry` | `EntryRouter<R, S, this>` | File-based routing interface |
| `import` | `ImportRouter<R, S, this>` | Dynamic import routing interface |
| `view` | `ViewRouter<R, S, this>` | Template-based routing interface |
| `entries` | `Map` | Map of entry-based routes |
| `expressions` | `Map` | Map of route expressions and patterns |
| `imports` | `Map` | Map of import-based routes |
| `listeners` | `object` | Event listener map |
| `routes` | `Map` | Map of route definitions |
| `views` | `Map` | Map of view-based routes |

### Methods

The following methods are available when instantiating a Router.

#### HTTP Method Routing

The following examples show how to define routes for different HTTP methods.

```typescript
// GET route
router.get('/users', (req, res) => {
  res.setJSON({ users: [] });
});

// POST route
router.post('/users', (req, res) => {
  const userData = req.data.get();
  res.setJSON({ user: userData }, 201);
});

// PUT route
router.put('/users/:id', (req, res) => {
  const userId = req.data.get('id');
  res.setJSON({ id: userId, updated: true });
});

// DELETE route
router.delete('/users/:id', (req, res) => {
  const userId = req.data.get('id');
  res.setJSON({ id: userId, deleted: true });
});

// Handle any method
router.all('/health', (req, res) => {
  res.setJSON({ status: 'healthy' });
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `path` | `string` | Route path with optional parameters |
| `action` | `AnyRouterAction<R, S, this>` | Route handler function |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The Router instance to allow method chaining.

#### Generic Route Definition

The following example shows how to define routes with specific HTTP methods.

```typescript
router.route('GET', '/users/:id', (req, res) => {
  const userId = req.data.get('id');
  res.setJSON({ id: userId });
});

router.route('PATCH', '/users/:id', (req, res) => {
  const userId = req.data.get('id');
  res.setJSON({ id: userId, patched: true });
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `method` | `Method` | HTTP method (GET, POST, PUT, DELETE, etc.) |
| `path` | `string` | Route path with optional parameters |
| `action` | `AnyRouterAction<R, S, this>` | Route handler function |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The Router instance to allow method chaining.

#### Event Handling

The following example shows how to add event listeners.

```typescript
// Listen to all requests
router.on('request', (req, res) => {
  console.log(`${req.method} ${req.url.pathname}`);
});

// Listen to specific route events
router.on('GET /api/users', (req, res) => {
  console.log('Users API accessed');
});

// Pattern-based event matching
router.on(/^GET \/api\/.*$/, (req, res) => {
  console.log('API endpoint accessed');
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string\|RegExp` | Event name or pattern |
| `action` | `AnyRouterAction<R, S, this>` | Event handler function |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The Router instance to allow method chaining.

#### Event Emission

The following example shows how to emit events manually.

```typescript
const req = router.request({ url: 'http://localhost/test' });
const res = router.response();

const status = await router.emit('custom-event', req, res);
console.log(status.code); // 200, 404, etc.
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string` | Event name to emit |
| `req` | `Request<R>` | Request object |
| `res` | `Response<S>` | Response object |

**Returns**

A promise that resolves to a Status object indicating success or failure.

#### Route Resolution

The following examples show how to resolve routes and get response data.

```typescript
// Resolve by method and path
const response = await router.resolve('GET', '/users/123');

// Resolve by event name
const response = await router.resolve('user-created', userData);

// With custom request data
const response = await router.resolve('POST', '/users', {
  name: 'John',
  email: 'john@example.com'
});
```

**Parameters for route resolution**

| Parameter | Type | Description |
|----------|------|-------------|
| `method` | `Method\|'*'` | HTTP method |
| `path` | `string` | Route path |
| `request` | `Request<R>\|Record<string, any>` | Request data (optional) |
| `response` | `Response<S>` | Response object (optional) |

**Parameters for event resolution**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string` | Event name |
| `request` | `Request<R>\|Record<string, any>` | Request data (optional) |
| `response` | `Response<S>` | Response object (optional) |

**Returns**

A promise that resolves to a partial StatusResponse object.

#### Request and Response Creation

The following examples show how to create request and response objects.

```typescript
// Create request
const req = router.request({
  url: 'http://example.com/api',
  method: 'POST',
  data: { name: 'John' },
  headers: { 'Content-Type': 'application/json' }
});

// Create response
const res = router.response({
  headers: { 'Content-Type': 'application/json' },
  data: { message: 'Success' }
});
```

**Parameters for request**

| Parameter | Type | Description |
|----------|------|-------------|
| `init` | `Partial<RequestOptions<R>>` | Request initialization options |

**Parameters for response**

| Parameter | Type | Description |
|----------|------|-------------|
| `init` | `Partial<ResponseOptions<S>>` | Response initialization options |

**Returns**

A new Request or Response instance.

#### Router Composition

The following example shows how to merge routes from other routers.

```typescript
const apiRouter = new Router();
apiRouter.get('/api/users', handler);

const mainRouter = new Router();
mainRouter.use(apiRouter); // Merges routes and listeners
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `router` | `Router<R, S>` | Another router to merge routes from |

**Returns**

The Router instance to allow method chaining.

### Routing Interfaces

The Router class provides four different routing interfaces for maximum flexibility.

#### Action Router (Traditional)

Express.js-like routing with inline handlers:

```typescript
router.action.get('/users', (req, res) => {
  res.setJSON({ users: [] });
});

router.action.post('/users', (req, res) => {
  const userData = req.data.get();
  res.setJSON(userData, 201);
});
```

#### Entry Router (File-based)

File-based routing that loads handlers from files:

```typescript
router.entry.get('/users', './routes/users.js');
router.entry.post('/users', './routes/create-user.js');
```

The target file should export a default function:

```typescript
// routes/users.js
export default function handler(req, res) {
  res.setJSON({ users: [] });
}
```

#### Import Router (Lazy Loading)

Dynamic import routing for code splitting:

```typescript
router.import.get('/users', () => import('./routes/users.js'));
router.import.post('/users', () => import('./routes/create-user.js'));
```

#### View Router (Template-based)

Template-based routing for rendering views:

```typescript
router.view.get('/users', './views/users.hbs');
router.view.get('/profile', './views/profile.hbs');
```

### Automatic Router Detection

The Router class can automatically determine which routing interface to use based on the action type:

```typescript
// Automatically uses action router (function with parameters)
router.get('/users', (req, res) => { /* handler */ });

// Automatically uses import router (parameterless function)
router.get('/users', () => import('./routes/users.js'));

// Automatically uses view router (string path)
router.get('/users', './views/users.hbs');
```

### Route Patterns

The Router supports various route patterns for flexible matching:

#### Parameter Routes

```typescript
// Single parameter
router.get('/users/:id', (req, res) => {
  const userId = req.data.get('id');
  res.setJSON({ id: userId });
});

// Multiple parameters
router.get('/users/:userId/posts/:postId', (req, res) => {
  const userId = req.data.get('userId');
  const postId = req.data.get('postId');
  res.setJSON({ userId, postId });
});
```

#### Wildcard Routes

```typescript
// Single wildcard
router.get('/files/*', (req, res) => {
  const filename = req.data.get('0'); // First wildcard match
  res.setJSON({ filename });
});

// Catch-all wildcard
router.get('/static/**', (req, res) => {
  const path = req.data.get('0'); // Full wildcard match
  res.setJSON({ path });
});
```

#### Regular Expression Routes

```typescript
// Regex pattern matching
router.on(/^GET \/api\/v(\d+)\/users$/, (req, res) => {
  const version = req.event?.data.args[0]; // Captured group
  res.setJSON({ version, users: [] });
});
```

### Event System Integration

The Router is built on a powerful event system that enables reactive programming:

#### Priority-Based Execution

```typescript
// Higher priority executes first
router.on('request', middleware1, 10);
router.on('request', middleware2, 5);
router.on('request', middleware3, 1);
```

#### Event Hooks

```typescript
// Before hook
router.action.before = async (event) => {
  console.log('Before:', event.event);
  return true; // Continue execution
};

// After hook
router.action.after = async (event) => {
  console.log('After:', event.event);
};
```

### Examples

#### Basic REST API

```typescript
const router = new Router();

// List users
router.get('/users', (req, res) => {
  const users = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
  ];
  res.setJSON({ users });
});

// Get user by ID
router.get('/users/:id', (req, res) => {
  const userId = req.data.get('id');
  const user = { id: userId, name: 'John' };
  res.setJSON({ user });
});

// Create user
router.post('/users', async (req, res) => {
  await req.load();
  const userData = req.data.get();
  const user = { id: Date.now(), ...userData };
  res.setJSON({ user }, 201);
});

// Update user
router.put('/users/:id', async (req, res) => {
  await req.load();
  const userId = req.data.get('id');
  const userData = req.data.get();
  const user = { id: userId, ...userData };
  res.setJSON({ user });
});

// Delete user
router.delete('/users/:id', (req, res) => {
  const userId = req.data.get('id');
  res.setJSON({ id: userId, deleted: true });
});
```

#### Middleware Pattern

```typescript
const router = new Router();

// Global middleware
router.on('request', (req, res) => {
  console.log(`${req.method} ${req.url.pathname}`);
  return true; // Continue processing
}, 10);

// Authentication middleware
router.on('request', (req, res) => {
  const token = req.headers.get('authorization');
  if (!token && req.url.pathname.startsWith('/protected')) {
    res.setError('Authentication required', {}, [], 401);
    return false; // Stop processing
  }
  return true;
}, 5);

// Protected route
router.get('/protected/data', (req, res) => {
  res.setJSON({ data: 'secret information' });
});
```

#### File-Based Routing

```typescript
const router = new Router();

// Entry-based routes
router.entry.get('/api/users', './routes/users.js');
router.entry.post('/api/users', './routes/create-user.js');

// Import-based routes for code splitting
router.import.get('/api/products', () => import('./routes/products.js'));
router.import.get('/api/orders', () => import('./routes/orders.js'));

// View-based routes for templates
router.view.get('/users', './views/users.hbs');
router.view.get('/profile', './views/profile.hbs');
```

### Build Integration

The Router exposes routing information that can be used by bundlers:

```typescript
const router = new Router();
router.import.get('/users', () => import('./routes/users.js'));
router.import.get('/posts', () => import('./routes/posts.js'));

// Access build information
console.log(router.routes);      // Route definitions
console.log(router.imports);     // Dynamic imports
console.log(router.entries);     // File entries
console.log(router.views);       // View templates
console.log(router.expressions); // Route patterns
```

This information can be used to:
- Generate static route manifests
- Pre-bundle route modules
- Optimize code splitting
- Create deployment artifacts

## Request

The Request class provides a generic wrapper for handling HTTP requests across different platforms.

### Overview

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

### Type Parameters

The Request class accepts one generic type parameter:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `R` | `any` | Request resource type (e.g., IncomingMessage, Request) |

### Properties

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

### Methods

The following methods are available when instantiating a Request.

#### Loading Request Body

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

### Data Access

The Request class provides multiple ways to access request data:

#### Combined Data Access

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

#### Query Parameters

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

#### POST Data

Access POST request body data:

```typescript
// For POST requests with form data or JSON
await req.load(); // Load the body first

const name = req.post.get('name');
const email = req.post.get('email');

// Get all POST data
const allPost = req.post.get();
```

#### Headers

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

#### Session Data

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

### Request Creation

#### Basic Request Creation

```typescript
import { Request } from '@stackpress/ingest';

const req = new Request({
  url: 'http://example.com/api/users',
  method: 'GET'
});
```

#### Request with Headers

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

#### Request with Data

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

#### Request with Session

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

### Body Loading

The Request class supports asynchronous body loading for different content types:

#### JSON Body

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

#### Form Data

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

#### URL Encoded Data

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

### Platform Compatibility

The Request class works across different platforms:

#### Node.js HTTP

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

#### WHATWG Fetch (Serverless)

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

### Examples

#### Route Handler with Request Processing

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

#### Authentication Middleware

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

#### File Upload Handling

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

### Type Safety

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

## Response

The Response class provides a generic wrapper for handling HTTP responses across different platforms.

### Overview

The Response class provides:
- Cross-platform compatibility (Node.js HTTP and WHATWG Fetch)
- Multiple response types (JSON, HTML, errors, redirects)
- Header management
- Session handling
- Status code management

```typescript
import { Response } from '@stackpress/ingest';

const res = new Response({
  headers: { 'Content-Type': 'application/json' }
});
```

### Type Parameters

The Response class accepts one generic type parameter:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `S` | `any` | Response resource type (e.g., ServerResponse, Response) |

### Properties

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

### Methods

The following methods are available when instantiating a Response.

#### Setting JSON Response

The following example shows how to set a JSON response.

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

#### Setting HTML Response

The following example shows how to set an HTML response.

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

#### Setting Error Response

The following example shows how to set an error response.

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

#### Setting Results Response

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

#### Setting Rows Response

The following example shows how to set a collection response with total count.

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

#### Redirecting

The following example shows how to redirect the response.

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

#### Dispatching Response

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

#### Converting to Status Response

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

### Header Management

The Response class provides comprehensive header management:

#### Setting Headers

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

#### Getting Headers

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

#### Common Headers

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

### Session Management

The Response class integrates with session management:

#### Setting Session Data

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

#### Reading Session Data

```typescript
const userId = res.session.get('userId');
const username = res.session.get('username');

// Get all session data
const sessionData = res.session.get();
```

#### Session Cookies

```typescript
// Session cookies are automatically managed
// but you can customize them
res.headers.set('Set-Cookie', [
  'session=abc123; HttpOnly; Secure; SameSite=Strict',
  'csrf=xyz789; HttpOnly; Secure'
]);
```

### Response Creation

#### Basic Response Creation

```typescript
import { Response } from '@stackpress/ingest';

const res = new Response();
```

#### Response with Headers

```typescript
const res = new Response({
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': '1.0'
  }
});
```

#### Response with Data

```typescript
const res = new Response({
  data: {
    timestamp: Date.now(),
    version: '1.0.0'
  }
});
```

#### Response with Resource

```typescript
import type { ServerResponse } from 'node:http';

const res = new Response<ServerResponse>({
  resource: serverResponse
});
```

### Platform Compatibility

The Response class works across different platforms:

#### Node.js HTTP

```typescript
import { createServer } from 'node:http';
import { Response } from '@stackpress/ingest';

createServer((req, serverResponse) => {
  const res = new Response({ resource: serverResponse });
  
  res.setJSON({ message: 'Hello from Node.js' });
  res.dispatch(); // Sends response
});
```

#### WHATWG Fetch (Serverless)

```typescript
// Vercel, Netlify, etc.
export default async function handler(request: Request) {
  const res = new Response();
  
  res.setJSON({ message: 'Hello from serverless' });
  
  return await res.dispatch(); // Returns Response object
}
```

### Examples

#### API Route Handler

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
```

#### Paginated Results

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

#### File Download

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

#### Authentication Response

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

#### Error Handling Middleware

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

### Type Safety

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

## Route

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

### Static Methods

The following methods can be accessed directly from Route itself.

#### Emitting Route Events

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

### Properties

The following properties are available when instantiating a Route.

| Property | Type | Description |
|----------|------|-------------|
| `event` | `ServerAction<C, R, S>\|string` | The route action or event name |
| `request` | `Request<R>` | Request object (readonly) |
| `response` | `Response<S>` | Response object (readonly) |
| `context` | `Server<C, R, S>` | Server context (readonly) |

### Methods

The following methods are available when instantiating a Route.

#### Emitting the Route

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

#### Preparing the Request

The following example shows how to run the request preparation phase.

```typescript
const success = await route.prepare();
// Emits 'request' event and handles any errors
```

**Returns**

A promise that resolves to `true` if preparation succeeded, `false` if aborted.

#### Processing the Route

The following example shows how to execute the main route processing.

```typescript
const success = await route.process();
// Executes the route action and handles errors/404s
```

**Returns**

A promise that resolves to `true` if processing succeeded, `false` if aborted.

#### Shutting Down the Route

The following example shows how to run the response finalization phase.

```typescript
const success = await route.shutdown();
// Emits 'response' event and handles any errors
```

**Returns**

A promise that resolves to `true` if shutdown succeeded, `false` if aborted.

### Route Lifecycle

The Route class manages a three-phase lifecycle for request processing:

#### 1. Preparation Phase (`prepare`)

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

#### 2. Processing Phase (`process`)

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

#### 3. Shutdown Phase (`shutdown`)

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

### Error Handling

Route provides comprehensive error handling throughout the lifecycle:

#### Automatic Error Conversion

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

#### Error Event Handling

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

#### Abort Handling

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

### Integration with Server

Route is typically used internally by the Server class but can be used directly:

#### Direct Usage

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

#### Server Integration

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

### Best Practices

#### Lifecycle Hook Organization

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

#### Error Recovery

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

#### Conditional Processing

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

#### Performance Monitoring

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

## ActionRouter

Event-driven routing system that provides multiple routing interfaces for handling HTTP requests with function-based actions.

```typescript
import ActionRouter from '@stackpress/ingest/plugin/ActionRouter';

const router = new ActionRouter(context);

// Function-based routing
router.get('/users', async (req, res, ctx) => {
  const users = await getUsers();
  res.setResults(users);
});

// Entry-based routing
router.entry.get('/users/:id', './routes/user.js');

// Import-based routing
router.import.post('/users', () => import('./routes/create-user.js'));

// View-based routing
router.view.get('/profile', './views/profile.hbs');
```

### Properties

The following properties are available when instantiating an ActionRouter.

| Property | Type | Description |
|----------|------|-------------|
| `context` | `X` | Context object passed to route actions (readonly) |
| `routes` | `Map<string, Route>` | Map of event names to route definitions (readonly) |
| `entry` | `EntryRouter<R, S, X>` | Entry-based routing interface (readonly) |
| `import` | `ImportRouter<R, S, X>` | Import-based routing interface (readonly) |
| `view` | `ViewRouter<R, S, X>` | View-based routing interface (readonly) |

### Methods

The following methods are available when instantiating an ActionRouter.

#### HTTP Method Routing

The following examples show how to define routes for different HTTP methods.

```typescript
// GET routes
router.get('/users', async (req, res, ctx) => {
  const users = await getUsers();
  res.setResults(users);
});

// POST routes
router.post('/users', async (req, res, ctx) => {
  const userData = req.data.get();
  const user = await createUser(userData);
  res.setResults(user, 201);
});

// PUT routes
router.put('/users/:id', async (req, res, ctx) => {
  const id = req.data.get('id');
  const userData = req.data.get();
  const user = await updateUser(id, userData);
  res.setResults(user);
});

// DELETE routes
router.delete('/users/:id', async (req, res, ctx) => {
  const id = req.data.get('id');
  await deleteUser(id);
  res.setJSON({ success: true });
});

// Handle any method
router.all('/health', async (req, res, ctx) => {
  res.setJSON({ status: 'ok', timestamp: Date.now() });
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `path` | `string` | Route path with optional parameters (:id) |
| `action` | `ActionRouterAction<R, S, X>` | Route handler function |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

Route information object with method, path, and event details.

#### Emitting Route Events

The following example shows how to emit route events directly.

```typescript
const status = await router.emit('GET /users/123', request, response);
if (status.code === 404) {
  console.log('Route not found');
} else if (status.code === 200) {
  console.log('Route executed successfully');
}
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string` | Route event name (e.g., 'GET /users/123') |
| `req` | `Request<R>` | Request object |
| `res` | `Response<S>` | Response object |

**Returns**

A promise that resolves to a Status object indicating success or failure.

#### Event Name Generation

The following example shows how to generate event names from routes.

```typescript
// Generate event name from method and path
const eventName = router.eventName('GET', '/users/:id');
// Returns: 'GET /users/:id' or regex pattern for dynamic routes

// Generate event name from pattern
const regexEvent = router.eventName(/^GET \/api\/.+$/);
// Returns: string representation of the regex
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `method` | `Method\|string\|RegExp` | HTTP method or pattern |
| `path` | `string` | Route path (optional for regex patterns) |

**Returns**

The generated event name string.

#### Using Other Routers

The following example shows how to merge routes from another router.

```typescript
const apiRouter = new ActionRouter(context);
apiRouter.get('/api/users', userHandler);

const mainRouter = new ActionRouter(context);
mainRouter.use(apiRouter); // Merges routes and listeners
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `emitter` | `EventEmitter<ActionRouterMap<R, S, X>>` | Another router to merge |

**Returns**

The ActionRouter instance to allow method chaining.

### Multi-Routing Interface

ActionRouter provides four different routing approaches:

#### 1. Action Router (Function-based)

Direct function routing for inline handlers:

```typescript
router.get('/users', async (req, res, ctx) => {
  // Direct function implementation
  const users = await getUsers();
  res.setResults(users);
});
```

#### 2. Entry Router (File-based)

Route to file paths that export default functions:

```typescript
router.entry.get('/users/:id', './routes/user.js');

// ./routes/user.js
export default async function(req, res, ctx) {
  const id = req.data.get('id');
  const user = await getUser(id);
  res.setResults(user);
}
```

#### 3. Import Router (Lazy Loading)

Route to dynamic imports for code splitting:

```typescript
router.import.post('/users', () => import('./routes/create-user.js'));

// Enables code splitting and lazy loading
router.import.get('/admin/*', () => import('./routes/admin/index.js'));
```

#### 4. View Router (Template-based)

Route to template files for server-side rendering:

```typescript
// Configure template engine
router.view.engine = async (filePath, req, res, ctx) => {
  const html = await renderTemplate(filePath, req.data.get());
  res.setHTML(html);
};

router.view.get('/profile', './views/profile.hbs');
```

### Route Parameters

ActionRouter supports Express-like route parameters:

#### Parameter Extraction

```typescript
router.get('/users/:id/posts/:postId', async (req, res, ctx) => {
  const userId = req.data.get('id');
  const postId = req.data.get('postId');
  
  // Parameters are automatically added to request data
  const post = await getPost(userId, postId);
  res.setResults(post);
});
```

#### Wildcard Routes

```typescript
// Single wildcard
router.get('/files/*', async (req, res, ctx) => {
  const args = req.data.get(); // Contains wildcard matches
  const filePath = args[0]; // First wildcard match
  res.setJSON({ file: filePath });
});

// Catch-all wildcard
router.get('/api/**', async (req, res, ctx) => {
  // Handles any path under /api/
  res.setJSON({ path: req.url.pathname });
});
```

#### Pattern Matching

```typescript
// Regex patterns
router.on(/^GET \/api\/v(\d+)\/users$/, async (req, res, ctx) => {
  const version = req.data.get()[0]; // First capture group
  res.setJSON({ version, users: await getUsers() });
});
```

### Event-Driven Architecture

ActionRouter extends ExpressEmitter for pattern-based event handling:

#### Event Hooks

```typescript
// Before hook - runs before each route action
router.before = async (event) => {
  console.log(`Executing: ${event.event}`);
  return true; // Continue execution
};

// After hook - runs after each route action
router.after = async (event) => {
  console.log(`Completed: ${event.event}`);
  return true; // Continue execution
};
```

#### Priority-Based Execution

```typescript
// Higher priority executes first
router.get('/users', handler1, 1);      // Lower priority
router.get('/users', handler2, 10);     // Higher priority
router.get('/users', handler3, 5);      // Medium priority

// Execution order: handler2, handler3, handler1
```

#### Event Data Access

```typescript
router.get('/users/:id', async (req, res, ctx) => {
  // Access current event information
  const event = router.event;
  console.log('Event:', event.event);        // 'GET /users/123'
  console.log('Pattern:', event.pattern);    // 'GET /users/:id'
  console.log('Params:', event.data.params); // { id: '123' }
  console.log('Args:', event.data.args);     // ['users', '123']
});
```

### Integration with Server

ActionRouter is typically used within the Server class:

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

// Server provides ActionRouter interface
app.get('/users', async (req, res, ctx) => {
  // ctx is the server instance
  const users = await getUsers();
  res.setResults(users);
});

// Access the underlying ActionRouter
const router = app.router;
console.log(router.routes); // Map of all routes
```

### Best Practices

#### Route Organization

```typescript
// Group related routes
const userRoutes = (router: ActionRouter) => {
  router.get('/users', listUsers);
  router.get('/users/:id', getUser);
  router.post('/users', createUser);
  router.put('/users/:id', updateUser);
  router.delete('/users/:id', deleteUser);
};

// Apply route groups
userRoutes(router);
```

#### Error Handling

```typescript
router.get('/users/:id', async (req, res, ctx) => {
  try {
    const id = req.data.get('id');
    const user = await getUser(id);
    
    if (!user) {
      res.setError('User not found', {}, [], 404);
      return false; // Abort further processing
    }
    
    res.setResults(user);
    return true; // Continue processing
  } catch (error) {
    res.setError('Internal server error', {}, [], 500);
    return false;
  }
});
```

#### Middleware Pattern

```typescript
// Authentication middleware
const requireAuth = async (req, res, ctx) => {
  const token = req.headers.get('authorization');
  if (!token) {
    res.setError('Unauthorized', {}, [], 401);
    return false;
  }
  
  const user = await validateToken(token);
  req.data.set('user', user);
  return true;
};

// Apply middleware with priority
router.get('/protected', requireAuth, 10);  // High priority
router.get('/protected', protectedHandler, 0); // Lower priority
```

#### Code Splitting

```typescript
// Use import router for large route handlers
router.import.get('/dashboard/*', () => import('./routes/dashboard'));
router.import.get('/admin/*', () => import('./routes/admin'));

// Conditional imports
router.import.get('/dev/*', () => {
  if (process.env.NODE_ENV === 'development') {
    return import('./routes/dev-tools');
  }
  throw new Error('Dev routes not available in production');
});
```

## EntryRouter

File-based routing system that routes to file paths containing exported route handlers, enabling modular route organization and build-time optimization.

```typescript
import EntryRouter from '@stackpress/ingest/plugin/EntryRouter';

const router = new EntryRouter(actionRouter, listen);

// Route to file exports
router.get('/users/:id', './routes/user.js');
router.post('/users', './routes/create-user.js');

// Event-based routing
router.on('user-created', './handlers/user-created.js');
```

### Properties

The following properties are available when instantiating an EntryRouter.

| Property | Type | Description |
|----------|------|-------------|
| `entries` | `Map<string, Set<EntryRouterTaskItem>>` | Map of event names to entry file configurations (readonly) |

### Methods

The following methods are available when instantiating an EntryRouter.

#### HTTP Method Routing

The following examples show how to define file-based routes for different HTTP methods.

```typescript
// GET routes
router.get('/users', './routes/users/list.js');
router.get('/users/:id', './routes/users/get.js');

// POST routes
router.post('/users', './routes/users/create.js');

// PUT routes
router.put('/users/:id', './routes/users/update.js');

// DELETE routes
router.delete('/users/:id', './routes/users/delete.js');

// Handle any method
router.all('/health', './routes/health.js');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `path` | `string` | Route path with optional parameters (:id) |
| `action` | `string` | File path to the route handler |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The EntryRouter instance to allow method chaining.

#### Event-Based Routing

The following example shows how to route events to file handlers.

```typescript
// Route custom events to files
router.on('user-login', './handlers/user-login.js');
router.on('data-updated', './handlers/data-updated.js');

// Route with regex patterns
router.on(/^email-.+$/, './handlers/email-handler.js');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string\|RegExp` | Event name or pattern |
| `entry` | `string` | File path to the event handler |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The EntryRouter instance to allow method chaining.

#### Creating Actions from Entries

The following example shows how entry files are converted to executable actions.

```typescript
// Internal method - creates action from file path
const action = router.action('GET /users', './routes/users.js', 0);

// The action dynamically imports and executes the file
await action(request, response, context);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string` | Event name for tracking |
| `action` | `string` | File path to import |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

An async function that imports and executes the file's default export.

#### Using Other EntryRouters

The following example shows how to merge entries from another router.

```typescript
const apiRouter = new EntryRouter(actionRouter, listen);
apiRouter.get('/api/users', './api/users.js');

const mainRouter = new EntryRouter(actionRouter, listen);
mainRouter.use(apiRouter); // Merges entry configurations
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `router` | `EntryRouter<R, S, X>` | Another EntryRouter to merge entries from |

**Returns**

The EntryRouter instance to allow method chaining.

### File Structure Requirements

Entry files must export a default function that matches the route handler signature:

#### Basic Route Handler

```typescript
// ./routes/users/list.js
export default async function(req, res, ctx) {
  const users = await getUsers();
  res.setResults(users);
}
```

#### Route Handler with Parameters

```typescript
// ./routes/users/get.js
export default async function(req, res, ctx) {
  const id = req.data.get('id'); // Route parameter
  const user = await getUser(id);
  
  if (!user) {
    res.setError('User not found', {}, [], 404);
    return false;
  }
  
  res.setResults(user);
  return true;
}
```

#### Event Handler

```typescript
// ./handlers/user-login.js
export default async function(req, res, ctx) {
  const user = req.data.get('user');
  
  // Log the login
  await logUserLogin(user.id);
  
  // Send welcome email
  await sendWelcomeEmail(user.email);
  
  return true; // Continue processing
}
```

#### Complex Route Handler

```typescript
// ./routes/users/create.js
import { validateUser } from '../validators/user.js';
import { createUser } from '../services/user.js';

export default async function(req, res, ctx) {
  try {
    const userData = req.data.get();
    
    // Validate input
    const validation = await validateUser(userData);
    if (!validation.valid) {
      res.setError('Validation failed', validation.errors, [], 400);
      return false;
    }
    
    // Create user
    const user = await createUser(userData);
    
    // Emit user created event
    await ctx.emit('user-created', req, res);
    
    res.setResults(user, 201);
    return true;
  } catch (error) {
    res.setError('Failed to create user', {}, [], 500);
    return false;
  }
}
```

### Dynamic Import Process

EntryRouter uses dynamic imports to load route handlers at runtime:

#### Import Flow

1. **Route Registration**: File path is registered with the route
2. **Request Handling**: When route is matched, dynamic import is triggered
3. **Module Loading**: File is imported using `import()` statement
4. **Default Export**: The default export is extracted and executed
5. **Execution**: Handler is called with request, response, and context

#### Import Example

```typescript
// Internal implementation
async function EntryFileAction(req, res, ctx) {
  // Dynamic import of the route file
  const imports = await import('./routes/user.js');
  
  // Extract default export
  const callback = imports.default;
  
  // Execute the handler
  return await callback(req, res, ctx);
}
```

### Build Integration

EntryRouter provides build-time information for bundlers and static analysis:

#### Entry Tracking

```typescript
// Access entry configurations
console.log(router.entries);
// Map {
//   'GET /users' => Set([{ entry: './routes/users.js', priority: 0 }]),
//   'POST /users' => Set([{ entry: './routes/create.js', priority: 0 }])
// }
```

#### Bundle Optimization

```typescript
// Bundlers can analyze entry configurations to:
// 1. Pre-compile route files
// 2. Generate static route tables
// 3. Optimize code splitting
// 4. Create dependency graphs

const entries = Array.from(router.entries.values())
  .flatMap(set => Array.from(set))
  .map(item => item.entry);

console.log('Route files to bundle:', entries);
```

### Integration with ActionRouter

EntryRouter works as an extension of ActionRouter:

#### Initialization

```typescript
import ActionRouter from '@stackpress/ingest/plugin/ActionRouter';

const actionRouter = new ActionRouter(context);

// EntryRouter is automatically available
actionRouter.entry.get('/users', './routes/users.js');

// Or create standalone
const entryRouter = new EntryRouter(actionRouter, listen);
```

#### Shared Event System

```typescript
// Both routers share the same event system
actionRouter.get('/api', handlerFunction);
actionRouter.entry.get('/files', './routes/files.js');

// Both routes are available in the same router
await actionRouter.emit('GET /api', req, res);
await actionRouter.emit('GET /files', req, res);
```

### Best Practices

#### File Organization

```typescript
// Organize by feature
router.get('/users', './routes/users/index.js');
router.get('/users/:id', './routes/users/get.js');
router.post('/users', './routes/users/create.js');
router.put('/users/:id', './routes/users/update.js');
router.delete('/users/:id', './routes/users/delete.js');

// Organize by HTTP method
router.get('/posts', './routes/get/posts.js');
router.post('/posts', './routes/post/posts.js');
router.put('/posts/:id', './routes/put/posts.js');
```

#### Error Handling

```typescript
// ./routes/error-example.js
export default async function(req, res, ctx) {
  try {
    const result = await riskyOperation();
    res.setResults(result);
    return true;
  } catch (error) {
    // Log error
    console.error('Route error:', error);
    
    // Set appropriate error response
    if (error.code === 'VALIDATION_ERROR') {
      res.setError('Invalid input', error.details, [], 400);
    } else {
      res.setError('Internal server error', {}, [], 500);
    }
    
    return false; // Abort processing
  }
}
```

#### Shared Utilities

```typescript
// ./routes/shared/auth.js
export async function requireAuth(req, res) {
  const token = req.headers.get('authorization');
  if (!token) {
    res.setError('Unauthorized', {}, [], 401);
    return null;
  }
  
  return await validateToken(token);
}

// ./routes/users/protected.js
import { requireAuth } from '../shared/auth.js';

export default async function(req, res, ctx) {
  const user = await requireAuth(req, res);
  if (!user) return false; // Auth failed
  
  // Continue with protected logic
  res.setResults({ user });
  return true;
}
```

#### Development vs Production

```typescript
// Use different files for different environments
const isDev = process.env.NODE_ENV === 'development';

router.get('/debug', isDev 
  ? './routes/debug/full.js' 
  : './routes/debug/minimal.js'
);

// Conditional route registration
if (isDev) {
  router.get('/dev-tools', './routes/dev/tools.js');
}
```

#### Type Safety

```typescript
// ./routes/typed-example.ts
import type { Request, Response, Server } from '@stackpress/ingest';

interface UserData {
  name: string;
  email: string;
}

export default async function(
  req: Request<any>, 
  res: Response<any>, 
  ctx: Server<any, any, any>
) {
  const userData = req.data.get() as UserData;
  
  // Type-safe operations
  const user = await createUser(userData);
  res.setResults(user);
  
  return true;
}
```

## ImportRouter

Lazy-loading routing system that routes to dynamic import functions, enabling code splitting and on-demand module loading for optimal performance.

```typescript
import ImportRouter from '@stackpress/ingest/plugin/ImportRouter';

const router = new ImportRouter(actionRouter, listen);

// Route to dynamic imports
router.get('/users/:id', () => import('./routes/user.js'));
router.post('/users', () => import('./routes/create-user.js'));

// Conditional imports
router.get('/admin/*', () => {
  if (isProduction) {
    return import('./routes/admin-prod.js');
  }
  return import('./routes/admin-dev.js');
});
```

### Properties

The following properties are available when instantiating an ImportRouter.

| Property | Type | Description |
|----------|------|-------------|
| `imports` | `Map<string, Set<ImportRouterTaskItem<R, S, X>>>` | Map of event names to import function configurations (readonly) |

### Methods

The following methods are available when instantiating an ImportRouter.

#### HTTP Method Routing

The following examples show how to define import-based routes for different HTTP methods.

```typescript
// GET routes with dynamic imports
router.get('/users', () => import('./routes/users/list.js'));
router.get('/users/:id', () => import('./routes/users/get.js'));

// POST routes
router.post('/users', () => import('./routes/users/create.js'));

// PUT routes
router.put('/users/:id', () => import('./routes/users/update.js'));

// DELETE routes
router.delete('/users/:id', () => import('./routes/users/delete.js'));

// Handle any method
router.all('/health', () => import('./routes/health.js'));
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `path` | `string` | Route path with optional parameters (:id) |
| `action` | `ImportRouterAction<R, S, X>` | Function that returns a dynamic import |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The ImportRouter instance to allow method chaining.

#### Event-Based Routing

The following example shows how to route events to dynamic imports.

```typescript
// Route custom events to imports
router.on('user-login', () => import('./handlers/user-login.js'));
router.on('data-updated', () => import('./handlers/data-updated.js'));

// Route with regex patterns
router.on(/^email-.+$/, () => import('./handlers/email-handler.js'));
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string\|RegExp` | Event name or pattern |
| `entry` | `ImportRouterAction<R, S, X>` | Function that returns a dynamic import |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

The ImportRouter instance to allow method chaining.

#### Creating Actions from Imports

The following example shows how import functions are converted to executable actions.

```typescript
// Internal method - creates action from import function
const action = router.action(
  'GET /users', 
  () => import('./routes/users.js'), 
  0
);

// The action executes the import and calls the default export
await action(request, response, context);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string` | Event name for tracking |
| `action` | `ImportRouterAction<R, S, X>` | Function that returns a dynamic import |
| `priority` | `number` | Priority level (default: 0) |

**Returns**

An async function that executes the import and calls the default export.

#### Using Other ImportRouters

The following example shows how to merge imports from another router.

```typescript
const apiRouter = new ImportRouter(actionRouter, listen);
apiRouter.get('/api/users', () => import('./api/users.js'));

const mainRouter = new ImportRouter(actionRouter, listen);
mainRouter.use(apiRouter); // Merges import configurations
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `router` | `ImportRouter<R, S, X>` | Another ImportRouter to merge imports from |

**Returns**

The ImportRouter instance to allow method chaining.

### Dynamic Import Functions

Import functions provide flexible module loading with conditional logic:

#### Basic Import Function

```typescript
router.get('/users', () => import('./routes/users.js'));

// The imported module should export a default function
// ./routes/users.js
export default async function(req, res, ctx) {
  const users = await getUsers();
  res.setResults(users);
}
```

#### Conditional Import Function

```typescript
router.get('/dashboard', () => {
  const userRole = getCurrentUserRole();
  
  if (userRole === 'admin') {
    return import('./routes/admin-dashboard.js');
  } else if (userRole === 'user') {
    return import('./routes/user-dashboard.js');
  } else {
    return import('./routes/guest-dashboard.js');
  }
});
```

#### Environment-Based Import Function

```typescript
router.get('/debug', () => {
  if (process.env.NODE_ENV === 'development') {
    return import('./routes/debug/full.js');
  } else {
    return import('./routes/debug/minimal.js');
  }
});
```

#### Feature Flag Import Function

```typescript
router.get('/new-feature', () => {
  if (isFeatureEnabled('new-ui')) {
    return import('./routes/new-feature-v2.js');
  } else {
    return import('./routes/new-feature-v1.js');
  }
});
```

#### Async Import Function

```typescript
router.get('/dynamic', async () => {
  // Can perform async operations before importing
  const config = await loadConfiguration();
  
  if (config.useNewHandler) {
    return import('./routes/new-handler.js');
  } else {
    return import('./routes/old-handler.js');
  }
});
```

### Code Splitting Benefits

ImportRouter enables automatic code splitting and lazy loading:

#### Bundle Optimization

```typescript
// Large admin panel is only loaded when needed
router.get('/admin/*', () => import('./routes/admin/index.js'));

// Heavy data processing is split into separate chunks
router.post('/process-data', () => import('./routes/data-processor.js'));

// Third-party integrations are loaded on demand
router.get('/integrations/:service', () => {
  const service = getServiceFromPath();
  return import(`./integrations/${service}.js`);
});
```

#### Performance Benefits

1. **Reduced Initial Bundle Size**: Only core routes are included in the main bundle
2. **Faster Initial Load**: Application starts faster with smaller initial payload
3. **On-Demand Loading**: Route handlers are loaded only when accessed
4. **Better Caching**: Individual route chunks can be cached separately
5. **Progressive Loading**: Users only download code for features they use

#### Build-Time Analysis

```typescript
// Bundlers can analyze import patterns for optimization
console.log(router.imports);
// Map {
//   'GET /users' => Set([{ 
//     import: () => import('./routes/users.js'), 
//     priority: 0 
//   }]),
//   'POST /users' => Set([{ 
//     import: () => import('./routes/create.js'), 
//     priority: 0 
//   }])
// }
```

### Error Handling

ImportRouter provides robust error handling for dynamic imports:

#### Import Failure Handling

```typescript
router.get('/fallback-example', async () => {
  try {
    return await import('./routes/primary.js');
  } catch (error) {
    console.warn('Primary route failed, using fallback');
    return await import('./routes/fallback.js');
  }
});
```

#### Module Validation

```typescript
router.get('/validated', async () => {
  const module = await import('./routes/example.js');
  
  if (!module.default || typeof module.default !== 'function') {
    throw new Error('Invalid route module: missing default export');
  }
  
  return module;
});
```

#### Graceful Degradation

```typescript
router.get('/optional-feature', () => {
  return import('./routes/optional.js').catch(() => {
    // Return a minimal handler if the feature module fails
    return {
      default: async (req, res, ctx) => {
        res.setError('Feature not available', {}, [], 503);
        return false;
      }
    };
  });
});
```

### Integration with ActionRouter

ImportRouter works as an extension of ActionRouter:

#### Initialization

```typescript
import ActionRouter from '@stackpress/ingest/plugin/ActionRouter';

const actionRouter = new ActionRouter(context);

// ImportRouter is automatically available
actionRouter.import.get('/users', () => import('./routes/users.js'));

// Or create standalone
const importRouter = new ImportRouter(actionRouter, listen);
```

#### Mixed Routing Approaches

```typescript
// Combine different routing approaches
actionRouter.get('/immediate', immediateHandler);
actionRouter.entry.get('/file-based', './routes/file.js');
actionRouter.import.get('/lazy', () => import('./routes/lazy.js'));
actionRouter.view.get('/template', './views/template.hbs');

// All routes work together in the same system
```

### Best Practices

#### Strategic Code Splitting

```typescript
// Split by feature boundaries
router.get('/auth/*', () => import('./features/auth/routes.js'));
router.get('/billing/*', () => import('./features/billing/routes.js'));
router.get('/analytics/*', () => import('./features/analytics/routes.js'));

// Split heavy dependencies
router.get('/pdf-export', () => import('./routes/pdf-export.js')); // Heavy PDF library
router.get('/image-process', () => import('./routes/image-process.js')); // Heavy image library
```

#### Performance Optimization

```typescript
// Preload critical routes
const criticalRoutes = [
  () => import('./routes/home.js'),
  () => import('./routes/login.js'),
  () => import('./routes/dashboard.js')
];

// Preload during idle time
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    criticalRoutes.forEach(importFn => importFn());
  });
}
```

#### Error Resilience

```typescript
// Implement retry logic
router.get('/retry-example', async () => {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      return await import('./routes/unstable.js');
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }
});
```

#### Development vs Production

```typescript
// Different strategies for different environments
const isDev = process.env.NODE_ENV === 'development';

router.get('/dev-tools', () => {
  if (isDev) {
    return import('./routes/dev-tools.js');
  } else {
    return Promise.resolve({
      default: (req, res, ctx) => {
        res.setError('Not available in production', {}, [], 404);
        return false;
      }
    });
  }
});
```

#### Type Safety

```typescript
// Type-safe import functions
interface RouteModule {
  default: (req: Request, res: Response, ctx: Context) => Promise<boolean>;
}

router.get('/typed', (): Promise<RouteModule> => {
  return import('./routes/typed.js');
});
```

#### Bundle Analysis

```typescript
// Track import patterns for optimization
const importStats = new Map();

router.get('/tracked', () => {
  const route = './routes/tracked.js';
  importStats.set(route, (importStats.get(route) || 0) + 1);
  return import(route);
});

// Log popular routes for optimization
setInterval(() => {
  console.log('Import statistics:', importStats);
}, 60000);
```

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

## WhatwgAdapter

WHATWG Fetch API adapter that bridges standard Request and Response objects with the Ingest framework, enabling seamless integration with serverless environments and modern web standards.

```typescript
import WhatwgAdapter from '@stackpress/ingest/whatwg/Adapter';

// Static usage
const response = await WhatwgAdapter.plug(context, request);

// Instance usage
const adapter = new WhatwgAdapter(context, request);
const response = await adapter.plug();
```

### Static Methods

The following methods can be accessed directly from WhatwgAdapter itself.

#### Plugging WHATWG Requests

The following example shows how to handle WHATWG requests using the static plug method.

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

### Methods

The following methods are available when instantiating a WhatwgAdapter.

#### Processing Requests

The following example shows how to process WHATWG requests through the adapter.

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

#### Creating Request Objects

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

#### Creating Response Objects

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

### Request Processing Flow

WhatwgAdapter follows a structured request processing flow:

#### 1. Request Initialization

```typescript
// Convert WHATWG Request to Ingest Request
const request = adapter.request();
// - Extracts HTTP method, URL, headers
// - Parses cookies into session data
// - Converts query parameters to nested object
// - Sets up body loader for POST data
```

#### 2. Response Setup

```typescript
// Create Ingest Response for WHATWG Response
const response = adapter.response();
// - Configures response dispatcher
// - Sets up cookie handling
// - Prepares header management
```

#### 3. Body Loading

```typescript
// Load request body asynchronously
await request.load();
// - Reads POST data from request body
// - Parses form data and JSON
// - Handles multipart uploads
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
// Create WHATWG Response
const whatwgResponse = await response.dispatch();
// - Creates new Response object
// - Sets status code and message
// - Writes cookies to Set-Cookie headers
// - Sends response headers and body
```

### Body Loading

WhatwgAdapter provides robust body loading for WHATWG requests:

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

// FormData (multipart/form-data)
// Handles file uploads and form fields
```

#### Async Body Loading

```typescript
// WHATWG Request body loading
const bodyText = await request.text();
const bodyJson = await request.json();
const bodyFormData = await request.formData();
const bodyArrayBuffer = await request.arrayBuffer();
```

### Response Dispatching

WhatwgAdapter handles various response types and formats:

#### Response Type Handling

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

### Serverless Integration Examples

#### Vercel Functions

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
```

#### Netlify Functions

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

#### Cloudflare Workers

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

#### Deno Deploy

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

#### AWS Lambda (with Response Streaming)

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

### Static Functions

WhatwgAdapter provides utility functions for request and response handling:

#### Request Body Loader

The following example shows how to create a custom body loader.

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

#### Response Dispatcher

The following example shows how to create a custom response dispatcher.

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

### Advanced Usage

#### Custom Request Processing

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

#### Stream Processing

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

#### Error Handling

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

### Best Practices

#### Environment Detection

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

#### CORS Handling

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

#### Performance Optimization

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

#### Security Headers

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

## Loader

Configuration and plugin loading utilities for the Ingest framework, providing file resolution and dynamic import capabilities.

```typescript
import { ConfigLoader, PluginLoader } from '@stackpress/ingest';

const configLoader = new ConfigLoader({
  key: 'plugins',
  extnames: ['.js', '.json', '.ts']
});

const pluginLoader = new PluginLoader({
  cwd: process.cwd(),
  plugins: ['./src/plugin.js', '@my/plugin']
});
```

### ConfigLoader

File loader specialized for configuration files with support for multiple file extensions and key extraction.

#### Properties

The following properties are available when instantiating a ConfigLoader.

| Property | Type | Description |
|----------|------|-------------|
| `cwd` | `string` | Current working directory (inherited) |
| `fs` | `FileSystem` | Filesystem interface being used (inherited) |

#### Methods

The following methods are available when instantiating a ConfigLoader.

##### Loading Configuration Files

The following example shows how to load configuration files with fallback defaults.

```typescript
const config = await loader.load('./config.json', { 
  default: 'value' 
});

// Load with automatic key extraction
const plugins = await loader.load('./package.json'); 
// Extracts the 'plugins' key from package.json
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `filepath` | `string` | Path to the configuration file |
| `defaults` | `T` | Default value if file cannot be loaded (optional) |

**Returns**

A promise that resolves to the loaded configuration data or defaults.

##### Resolving Configuration Files

The following example shows how to resolve configuration files with multiple extension support.

```typescript
const resolved = await loader.resolveFile('./config');
// Tries: ./config/plugins.js, ./config/plugins.json, 
//        ./config/package.json, ./config/plugins.ts, 
//        ./config.js, ./config.json, ./config.ts
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `filepath` | `string` | Path to resolve (default: current working directory) |

**Returns**

A promise that resolves to the resolved file path or null if not found.

#### Configuration Options

ConfigLoader accepts the following options during instantiation:

```typescript
const loader = new ConfigLoader({
  cwd: '/custom/working/directory',
  fs: customFileSystem,
  key: 'myPlugins',
  extnames: ['/custom.js', '.custom.json']
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cwd` | `string` | `process.cwd()` | Working directory for file resolution |
| `fs` | `FileSystem` | `NodeFS` | Filesystem implementation |
| `key` | `string` | `'plugins'` | Key to extract from loaded objects |
| `extnames` | `string[]` | See below | File extensions to try |

**Default Extensions**

```typescript
[
  '/plugins.js',    // Directory-specific plugins file
  '/plugins.json',  // Directory-specific plugins config
  '/package.json',  // Package configuration
  '/plugins.ts',    // TypeScript plugins file
  '.js',           // JavaScript file
  '.json',         // JSON file
  '.ts'            // TypeScript file
]
```

### PluginLoader

Extended configuration loader specialized for plugin management and bootstrapping.

#### Properties

The following properties are available when instantiating a PluginLoader.

| Property | Type | Description |
|----------|------|-------------|
| `cwd` | `string` | Current working directory (inherited) |
| `fs` | `FileSystem` | Filesystem interface being used (inherited) |

#### Methods

The following methods are available when instantiating a PluginLoader.

##### Bootstrapping Plugins

The following example shows how to bootstrap all configured plugins.

```typescript
await pluginLoader.bootstrap(async (name, plugin) => {
  console.log(`Loading plugin: ${name}`);
  
  if (typeof plugin === 'function') {
    // Plugin is a function, call it with context
    await plugin(server);
  } else {
    // Plugin is a configuration object
    server.configure(plugin);
  }
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `loader` | `(name: string, plugin: unknown) => Promise<void>` | Function to handle each loaded plugin |

**Returns**

The PluginLoader instance to allow method chaining.

##### Getting Plugin List

The following example shows how to get the list of configured plugins.

```typescript
const plugins = await pluginLoader.plugins();
// Returns: ['./src/plugin.js', '@my/plugin', 'local-plugin']
```

**Returns**

A promise that resolves to an array of plugin paths.

#### Plugin Configuration

PluginLoader accepts the following options during instantiation:

```typescript
const loader = new PluginLoader({
  cwd: process.cwd(),
  plugins: ['./plugin1.js', '@scope/plugin2'],
  modules: '/path/to/node_modules'
});
```

| Option | Type | Description |
|--------|------|-------------|
| `cwd` | `string` | Working directory for file resolution |
| `fs` | `FileSystem` | Filesystem implementation |
| `plugins` | `string[]` | Array of plugin paths (optional) |
| `modules` | `string` | Path to node_modules directory (optional) |
| `key` | `string` | Key to extract from configuration files |
| `extnames` | `string[]` | File extensions to try |

#### Plugin Resolution

PluginLoader supports various plugin path formats:

##### Local Plugins

```typescript
const plugins = [
  './src/plugins/auth.js',      // Relative path
  '/absolute/path/plugin.js',   // Absolute path
  './plugins'                   // Directory with plugins config
];
```

##### NPM Packages

```typescript
const plugins = [
  '@my-org/auth-plugin',        // Scoped package
  'express-session',            // Regular package
  'local-plugin/dist/index.js'  // Package with specific entry
];
```

##### Nested Plugin Configurations

```typescript
// plugins.json
{
  "plugins": [
    "./auth-plugin",
    {
      "plugins": ["./nested-plugin1", "./nested-plugin2"]
    }
  ]
}
```

#### Bootstrap Process

The bootstrap process follows these steps:

1. **Load Plugin List**: Resolves the plugins array from configuration
2. **Process Each Plugin**: Iterates through each plugin path
3. **Handle Nested Configs**: Recursively processes nested plugin arrays
4. **Resolve Plugin Path**: Converts relative paths to absolute paths
5. **Extract Plugin Name**: Generates a clean name for the plugin
6. **Call Loader Function**: Invokes the provided loader with name and plugin

#### Error Handling

PluginLoader provides clear error messages for common issues:

```typescript
try {
  await pluginLoader.bootstrap(loader);
} catch (error) {
  // Handles missing files, invalid configurations, etc.
  console.error('Plugin loading failed:', error.message);
}
```

#### Integration with Server

PluginLoader is typically used with the Server class for automatic plugin loading:

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

// Bootstrap plugins from package.json
await app.bootstrap();

// Or use custom plugin loader
const pluginLoader = new PluginLoader({
  plugins: ['./custom-plugin.js']
});

await pluginLoader.bootstrap(async (name, plugin) => {
  if (typeof plugin === 'function') {
    plugin(app);
  }
});
```

#### Best Practices

##### Plugin Organization

```typescript
// Organize plugins by functionality
const plugins = [
  './plugins/auth',      // Authentication
  './plugins/database',  // Database connection
  './plugins/logging',   // Logging setup
  '@company/shared'      // Shared company plugins
];
```

##### Error Resilience

```typescript
await pluginLoader.bootstrap(async (name, plugin) => {
  try {
    await loadPlugin(name, plugin);
    console.log(`✓ Loaded plugin: ${name}`);
  } catch (error) {
    console.error(`✗ Failed to load plugin ${name}:`, error.message);
    // Continue loading other plugins
  }
});
```

##### Development vs Production

```typescript
const isDev = process.env.NODE_ENV === 'development';

const plugins = [
  './plugins/core',
  ...(isDev ? ['./plugins/dev-tools'] : []),
  ...(process.env.ENABLE_ANALYTICS ? ['./plugins/analytics'] : [])
];
```

## Exception

Enhanced error handling with expressive error reporting and stack trace support.

### Overview

The Exception class provides:
- Template-based error messages with parameter substitution
- Validation error aggregation
- Enhanced stack trace parsing
- HTTP status code integration
- Structured error responses

```typescript
import { Exception } from '@stackpress/ingest';

const exception = new Exception('Invalid Parameters: %s', 400)
  .withErrors({
    name: 'required',
    email: 'invalid format'
  })
  .withPosition(100, 200);
```

### Static Methods

The following methods can be accessed directly from Exception itself.

#### Creating Exceptions with Templates

The following example shows how to create exceptions with template strings.

```typescript
throw Exception.for('Something %s is %s', 'good', 'bad');
// Results in: "Something good is bad"

throw Exception.for('User %s not found', userId);
// Results in: "User 123 not found"
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `message` | `string` | Template message with %s placeholders |
| `...values` | `unknown[]` | Values to replace %s placeholders |

**Returns**

A new Exception instance with the formatted message.

#### Creating Exceptions from Response Objects

The following example shows how to create exceptions from response objects.

```typescript
const response = { 
  code: 400, 
  error: 'Bad Request', 
  errors: { field: 'required' } 
};
throw Exception.forResponse(response);

// With fallback message
throw Exception.forResponse(response, 'Default error message');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `response` | `Partial<StatusResponse>` | Response object with error details |
| `message` | `string` | Fallback message if response.error is not provided |

**Returns**

A new Exception instance configured from the response object.

#### Creating Exceptions for Validation Errors

The following example shows how to create exceptions for validation errors.

```typescript
throw Exception.forErrors({
  name: 'required',
  email: 'invalid format',
  age: ['must be a number', 'must be greater than 0']
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `errors` | `NestedObject<string\|string[]>` | Object containing validation errors |

**Returns**

A new Exception instance with "Invalid Parameters" message and error details.

#### Requiring Conditions

The following example shows how to assert conditions and throw if they fail.

```typescript
Exception.require(count > 0, 'Count %s must be positive', count);
Exception.require(user.isActive, 'User %s is not active', user.id);

// Will throw if condition is false
Exception.require(false, 'This will always throw');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `condition` | `boolean` | Condition that must be true |
| `message` | `string` | Error message with %s placeholders |
| `...values` | `any[]` | Values to replace %s placeholders |

**Returns**

Void if condition is true, throws Exception if false.

#### Try-Catch Wrapper

The following example shows how to use the synchronous try-catch wrapper.

```typescript
const result = Exception
  .try(() => riskyOperation())
  .catch((error, kind) => {
    console.log('Error type:', kind); // 'Exception' or 'Error'
    return defaultValue;
  });

// With async operations
const asyncResult = await Exception
  .try(async () => await asyncRiskyOperation())
  .catch((error, kind) => {
    if (kind === 'Exception') {
      console.log('Custom exception:', error.message);
    } else {
      console.log('Standard error:', error.message);
    }
    return defaultValue;
  });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `callback` | `() => T` | Function to execute safely |

**Returns**

An object with a `catch` method for handling errors.

#### Upgrading Errors

The following example shows how to upgrade regular errors to exceptions.

```typescript
try {
  // some operation that might throw a regular Error
  JSON.parse(invalidJson);
} catch (error) {
  throw Exception.upgrade(error, 400);
}

// Upgrade with custom message
try {
  await databaseOperation();
} catch (error) {
  const upgraded = Exception.upgrade(error, 500);
  upgraded.message = 'Database operation failed';
  throw upgraded;
}
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `error` | `Error` | The error to upgrade |
| `code` | `number` | HTTP status code (default: 500) |

**Returns**

An Exception instance (returns original if already an Exception).

### Properties

The following properties are available when instantiating an Exception.

| Property | Type | Description |
|----------|------|-------------|
| `code` | `number` | HTTP status code |
| `end` | `number` | Ending character position of the error |
| `errors` | `object` | Validation errors object |
| `start` | `number` | Starting character position of the error |
| `type` | `string` | Exception type name |

### Methods

The following methods are available when instantiating an Exception.

#### Setting Error Code

The following example shows how to set the HTTP status code.

```typescript
const exception = new Exception('User not found');
exception.withCode(404);

// Method chaining
throw new Exception('Validation failed')
  .withCode(400)
  .withErrors({ name: 'required' });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `code` | `number` | HTTP status code |

**Returns**

The Exception instance to allow method chaining.

#### Adding Validation Errors

The following example shows how to add validation errors.

```typescript
const exception = new Exception('Validation failed');
exception.withErrors({
  name: 'required',
  email: ['required', 'invalid format'],
  age: 'must be a number'
});

// Method chaining
throw new Exception('Invalid input')
  .withErrors({
    username: 'already exists',
    password: ['too short', 'must contain numbers']
  })
  .withCode(400);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `errors` | `NestedObject<string\|string[]>` | Validation errors object |

**Returns**

The Exception instance to allow method chaining.

#### Setting Position Information

The following example shows how to set character position information.

```typescript
const exception = new Exception('Syntax error');
exception.withPosition(100, 200);

// For parsing errors
throw new Exception('Invalid JSON')
  .withPosition(line * 80 + column, line * 80 + column + tokenLength)
  .withCode(400);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `start` | `number` | Starting character position |
| `end` | `number` | Ending character position |

**Returns**

The Exception instance to allow method chaining.

#### Converting to Response Object

The following example shows how to convert the exception to a response object.

```typescript
const exception = new Exception('User not found')
  .withCode(404)
  .withErrors({ id: 'does not exist' });

const response = exception.toResponse();
console.log(response);
// Returns: { 
//   code: 404, 
//   status: 'Not Found', 
//   error: 'User not found',
//   errors: { id: 'does not exist' },
//   stack: [...] 
// }

// With custom stack trace range
const response = exception.toResponse(1, 5); // Skip first frame, show 4 frames
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `start` | `number` | Starting index for stack trace (default: 0) |
| `end` | `number` | Ending index for stack trace (default: 0) |

**Returns**

An ErrorResponse object with all exception details.

#### Converting to JSON

The following example shows how to convert the exception to JSON.

```typescript
const exception = new Exception('Database error')
  .withCode(500)
  .withErrors({ connection: 'timeout' });

const json = exception.toJSON();
console.log(json); // Pretty-printed JSON string

// Use in API responses
res.setHeader('Content-Type', 'application/json');
res.end(exception.toJSON());
```

**Returns**

A formatted JSON string representation of the exception.

#### Getting Stack Trace

The following example shows how to get the parsed stack trace.

```typescript
const exception = new Exception('Something went wrong');
const trace = exception.trace();

trace.forEach((frame, index) => {
  console.log(`${index}: ${frame.method} at ${frame.file}:${frame.line}:${frame.char}`);
});

// Get limited stack trace
const limitedTrace = exception.trace(1, 3); // Skip first frame, show 2 frames
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `start` | `number` | Starting index for stack trace (default: 0) |
| `end` | `number` | Ending index for stack trace (default: 0) |

**Returns**

An array of Trace objects with method, file, line, and char information.

### Usage in Route Handlers

#### Basic Error Handling

```typescript
import { server, Exception } from '@stackpress/ingest/http';

const app = server();

app.get('/api/users/:id', async (req, res) => {
  const userId = req.data.get('id');
  
  // Validate input
  if (!userId) {
    throw Exception.for('User ID is required').withCode(400);
  }
  
  if (isNaN(parseInt(userId))) {
    throw Exception.for('User ID must be a number').withCode(400);
  }
  
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      throw Exception.for('User %s not found', userId).withCode(404);
    }
    
    res.setJSON({ user });
  } catch (error) {
    if (error instanceof Exception) {
      throw error; // Re-throw custom exceptions
    }
    
    // Upgrade regular errors
    throw Exception.upgrade(error, 500);
  }
});
```

#### Validation Error Handling

```typescript
app.post('/api/users', async (req, res) => {
  await req.load();
  const userData = req.data.get();
  
  // Validate required fields
  const errors = {};
  
  if (!userData.name) {
    errors.name = 'Name is required';
  }
  
  if (!userData.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(userData.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!userData.password) {
    errors.password = 'Password is required';
  } else if (userData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  
  if (Object.keys(errors).length > 0) {
    throw Exception.forErrors(errors);
  }
  
  try {
    const user = await createUser(userData);
    res.setJSON({ user }, 201);
  } catch (error) {
    if (error.code === 'DUPLICATE_EMAIL') {
      throw Exception.for('Email %s already exists', userData.email)
        .withCode(409)
        .withErrors({ email: 'already exists' });
    }
    
    throw Exception.upgrade(error, 500);
  }
});
```

#### Global Error Handler

```typescript
app.on('error', (error, req, res) => {
  console.error('Global error:', error);
  
  if (!res.sent) {
    if (error instanceof Exception) {
      // Use the exception's response format
      const errorResponse = error.toResponse();
      res.setError(
        errorResponse.error,
        errorResponse.errors || {},
        errorResponse.stack || [],
        errorResponse.code,
        errorResponse.status
      );
    } else {
      // Convert regular errors to exceptions
      const exception = Exception.upgrade(error, 500);
      const errorResponse = exception.toResponse();
      res.setError(
        'Internal Server Error',
        {},
        errorResponse.stack || [],
        500
      );
    }
  }
});
```

#### Conditional Error Handling

```typescript
app.get('/api/admin/users', async (req, res) => {
  const user = req.data.get('user');
  
  // Check authentication
  Exception.require(user, 'Authentication required');
  
  // Check authorization
  Exception.require(
    user.role === 'admin', 
    'Admin access required for user %s', 
    user.username
  );
  
  try {
    const users = await getAllUsers();
    res.setJSON({ users });
  } catch (error) {
    throw Exception.upgrade(error, 500);
  }
});
```

#### File Processing with Position Errors

```typescript
app.post('/api/parse-csv', async (req, res) => {
  await req.load();
  const csvData = req.data.get('csv');
  
  if (!csvData) {
    throw Exception.for('CSV data is required').withCode(400);
  }
  
  try {
    const lines = csvData.split('\n');
    const results = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        const parsed = parseCSVLine(line);
        results.push(parsed);
      } catch (error) {
        const lineStart = csvData.indexOf(line);
        const lineEnd = lineStart + line.length;
        
        throw Exception.for('Parse error on line %d: %s', i + 1, error.message)
          .withCode(400)
          .withPosition(lineStart, lineEnd)
          .withErrors({ [`line_${i + 1}`]: error.message });
      }
    }
    
    res.setJSON({ results, count: results.length });
  } catch (error) {
    if (error instanceof Exception) {
      throw error;
    }
    throw Exception.upgrade(error, 500);
  }
});
```

### Integration with Response Class

The Exception class integrates seamlessly with the Response class:

```typescript
app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = req.data.get('id');
    const user = await getUserById(userId);
    
    if (!user) {
      throw Exception.for('User %s not found', userId).withCode(404);
    }
    
    res.setJSON({ user });
  } catch (error) {
    if (error instanceof Exception) {
      // Convert exception to response
      const errorResponse = error.toResponse();
      res.fromStatusResponse(errorResponse);
    } else {
      res.setError('Internal Server Error', {}, [], 500);
    }
  }
});
```

### Best Practices

#### Use Template Messages

```typescript
// Good: Template with parameters
throw Exception.for('User %s not found in organization %s', userId, orgId);

// Avoid: String concatenation
throw new Exception('User ' + userId + ' not found in organization ' + orgId);
```

#### Provide Meaningful Error Codes

```typescript
// Good: Specific HTTP status codes
throw Exception.for('User not found').withCode(404);
throw Exception.for('Access denied').withCode(403);
throw Exception.for('Invalid input').withCode(400);

// Avoid: Generic error codes
throw Exception.for('Error occurred').withCode(500);
```

#### Include Validation Details

```typescript
// Good: Detailed validation errors
throw Exception.forErrors({
  email: 'Invalid email format',
  password: ['Too short', 'Must contain numbers'],
  age: 'Must be a positive number'
});

// Avoid: Generic validation messages
throw new Exception('Validation failed');
```

#### Use Method Chaining

```typescript
// Good: Fluent interface
throw Exception.for('Invalid user data')
  .withCode(400)
  .withErrors({ name: 'required', email: 'invalid' })
  .withPosition(startPos, endPos);

// Avoid: Multiple statements
const ex = new Exception('Invalid user data');
ex.withCode(400);
ex.withErrors({ name: 'required' });
throw ex;
```

The Exception class provides a powerful and flexible way to handle errors in Ingest applications, offering structured error information that can be easily consumed by both developers and API clients.
