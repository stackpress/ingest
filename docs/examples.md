# Examples

Comprehensive examples demonstrating various use cases and deployment scenarios for the Ingest framework.

## Table of Contents

- [Basic HTTP Server](#basic-http-server)
- [Serverless Deployments](#serverless-deployments)
- [Plugin Development](#plugin-development)
- [Template Engine Integration](#template-engine-integration)
- [Advanced Routing](#advanced-routing)
- [Middleware and Event Handling](#middleware-and-event-handling)
- [Error Handling](#error-handling)
- [Build Integration](#build-integration)

## Basic HTTP Server

### Simple REST API

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

### File Upload Handling

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

## Serverless Deployments

### Vercel Deployment

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

### AWS Lambda Deployment

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

### Netlify Functions

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

## Plugin Development

### Authentication Plugin

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

### Logging Plugin

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

### Rate Limiting Plugin

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

## Template Engine Integration

### Handlebars Integration

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

## Advanced Routing

### File-Based Routing

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

### Pattern-Based Routing

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

## Middleware and Event Handling

### Request Processing Pipeline

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

### Event-Driven Architecture

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

## Error Handling

### Global Error Handling

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

## Build Integration

### Webpack Integration

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

### Vite Integration

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
