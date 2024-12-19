# Examples

This document provides various examples of using Ingest in 
different scenarios.

## Basic HTTP Server

```javascript
// Basic HTTP server example
import { server } from '@stackpress/ingest/http';

const app = server();

app.get('/', (req, res) => {
  res.setHTML('<h1>Welcome to Ingest!</h1>');
});

app.create().listen(3000);
```

## File-Based Routing

```javascript
// src/server.ts
import path from 'node:path';
import { server } from '@stackpress/ingest/http';

const app = server();
app.get('/', path.join(__dirname, 'pages/home'));
app.get('/about', path.join(__dirname, 'pages/about'));
app.create().listen(3000);

// src/pages/home.ts
export default function HomePage(req, res) {
  res.setHTML('<h1>Home Page</h1>');
}

// src/pages/about.ts
export default function AboutPage(req, res) {
  res.setHTML('<h1>About Us</h1>');
}
```

## Using Plugins

```javascript
// Custom logger plugin
function loggerPlugin() {
  return {
    name: 'logger',
    setup(app) {
      app.use((req, res, next) => {
        console.log(`${req.method} ${req.url}`);
        next();
      });
    }
  }
}

const app = server();
app.use(loggerPlugin());
```

## API Routes

```javascript
// RESTful API example
app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
  ]);
});

app.post('/api/users', async (req, res) => {
  const user = await req.json();
  // Handle user creation
  res.json({ success: true, user });
});
```

## Running Examples

You can run the example projects included in the repository:

```bash
# Development mode
yarn <example>:dev

# Build mode
yarn <example>:build
```

Available examples:
- `entries`: File-based routing
- `fetch`: API integration
- `http`: Basic HTTP server
- `plugins`: Plugin system

Each example in the `/examples` directory includes its own README with specific instructions.
