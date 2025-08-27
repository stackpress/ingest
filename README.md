# ᗊ Ingest

[![NPM Package](https://img.shields.io/npm/v/@stackpress/ingest.svg?style=flat)](https://www.npmjs.com/package/@stackpress/ingest)
[![Tests Status](https://img.shields.io/github/actions/workflow/status/stackpress/ingest/test.yml)](https://github.com/stackpress/ingest/actions)
[![Coverage Status](https://coveralls.io/repos/github/stackpress/ingest/badge.svg?branch=main)](https://coveralls.io/github/stackpress/ingest?branch=main)
[![Commits](https://img.shields.io/github/last-commit/stackpress/ingest)](https://github.com/stackpress/ingest/commits/main/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat)](https://github.com/stackpress/ingest/blob/main/LICENSE)

An unopinionated, event driven, pluggable, server/less framework.

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

## Documentation

- [API Reference](./docs/api/README.md) - Complete API documentation
- [Examples](./docs/examples.md) - Comprehensive usage examples
- [Plugin Development](./docs/plugin-development.md) - Guide to creating plugins

## Examples

Check out the `examples/` directory for complete working examples:

- `with-http` - Basic HTTP server
- `with-vercel` - Vercel deployment
- `with-lambda` - AWS Lambda deployment
- `with-netlify` - Netlify deployment
- `with-plugins` - Plugin system usage
- `with-handlebars` - Template engine integration
