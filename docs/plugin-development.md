# Plugin Development Guide

Learn how to create powerful plugins for the Ingest framework to extend functionality and build modular applications. This guide covers everything from basic plugin structure to advanced patterns and publishing strategies.

 1. [Plugin Basics](#1-plugin-basics)
 2. [Plugin Structure](#2-plugin-structure)
 3. [Configuration Management](#3-configuration-management)
 4. [Event Handling](#4-event-handling)
 5. [Route Registration](#5-route-registration)
 6. [Component Registration](#6-component-registration)
 7. [Advanced Patterns](#7-advanced-patterns)
 8. [Testing Plugins](#8-testing-plugins)
 9. [Publishing Plugins](#9-publishing-plugins)

## 1. Plugin Basics

Plugin basics cover the fundamental concepts and requirements for creating Ingest plugins. Understanding these concepts is essential for building effective and maintainable plugins.

### 1.1. What is a Plugin?

A plugin in Ingest is a function that receives the server instance and configures it by setting configuration values, adding event listeners (middleware), registering routes, registering reusable components, and extending server functionality.

### 1.2. Plugin Function Signature

The following example shows the basic plugin function signature.

```typescript
import type { HttpServer } from '@stackpress/ingest';

export default function myPlugin(server: HttpServer) {
  // Plugin implementation
}
```

### 1.3. Plugin Registration

Add your plugin to the `plugins` array in `package.json`:

```json
{
  "plugins": [
    "./src/plugins/my-plugin",
    "@my-org/ingest-auth-plugin"
  ]
}
```

### 1.4. Plugin Loading

Plugins are loaded automatically when you call `server.bootstrap()`:

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();
await app.bootstrap(); // Loads all plugins
app.create().listen(3000);
```

## 2. Plugin Structure

Plugin structure defines the organization and implementation patterns for creating well-structured and maintainable plugins.

### 2.1. Basic Plugin Template

The following example shows a basic plugin template with configuration, middleware, routes, and component registration.

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

### 2.2. TypeScript Plugin with Interfaces

The following example demonstrates creating a TypeScript plugin with proper interfaces and type safety.

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

## 3. Configuration Management

Configuration management provides flexible ways to handle plugin settings and environment-specific configurations.

### 3.1. Setting Configuration

The following example shows how to set nested configuration values and individual properties.

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

### 3.2. Reading Configuration

The following example demonstrates various ways to read configuration values.

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

### 3.3. Environment-Based Configuration

The following example shows how to implement environment-specific configuration management.

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

## 4. Event Handling

Event handling enables plugins to implement middleware patterns and respond to application events throughout the request lifecycle.

### 4.1. Request Middleware

The following example demonstrates implementing various types of middleware with priority-based execution.

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

### 4.2. Custom Events

The following example shows how to create and handle custom events for reactive programming patterns.

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

## 5. Route Registration

Route registration allows plugins to add new endpoints and organize routes with common middleware patterns.

### 5.1. Adding Routes in Plugins

The following example demonstrates various ways to register routes within plugins.

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

### 5.2. Route Groups and Prefixes

The following example shows how to create route groups with common middleware.

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

## 6. Component Registration

Component registration enables plugins to provide reusable utilities and services that other plugins and application code can use.

### 6.1. Registering Utilities

The following example shows how to register various utility functions and helpers.

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

### 6.2. Service Registration

The following example demonstrates registering complex services with multiple methods.

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

## 7. Advanced Patterns

Advanced patterns cover sophisticated plugin development techniques including dependency management, configuration validation, and conditional loading.

### 7.1. Plugin Dependencies

The following example shows how to implement plugin dependencies and ensure required plugins are available.

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

### 7.2. Plugin Configuration Validation

The following example demonstrates implementing configuration validation using schema validation libraries.

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

### 7.3. Conditional Plugin Loading

The following example shows how to implement conditional plugin loading based on environment and feature flags.

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

## 8. Testing Plugins

Testing plugins ensures reliability and maintainability through comprehensive unit and integration testing strategies.

### 8.1. Unit Testing

The following example shows how to write unit tests for plugin functionality.

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

### 8.2. Integration Testing

The following example demonstrates testing plugin interactions and dependencies.

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

### 8.3. Mocking Dependencies

The following example shows how to create mock dependencies for testing.

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

## 9. Publishing Plugins

Publishing plugins covers the complete process of packaging, documenting, and distributing plugins for community use.

### 9.1. Package Structure

The following structure shows the recommended organization for publishable plugins.

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

### 9.2. Package.json Configuration

The following example shows the recommended package.json configuration for published plugins.

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

### 9.3. Plugin Entry Point

The following example shows the recommended structure for the main plugin entry point.

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


This guide provides everything you need to create powerful, reusable plugins for the Ingest framework. Plugins are the key to building modular, maintainable applications that can be easily extended and customized.
