# Getting Started with Ingest

## Installation

You can install Ingest using npm:

```bash
npm install @stackpress/ingest
```

Or using yarn:

```bash
yarn add @stackpress/ingest
```

## Quick Start

### Basic HTTP Server

Create a simple HTTP server with Ingest:

```javascript
// src/server.ts
import { server } from '@stackpress/ingest/http';

const app = server();

app.get('/', function HomePage(req, res) { 
  res.setHTML('Hello, World');
});

app.create().listen(3000);
```

### File-Based Routing

```javascript
import path from 'node:path';
import { server } from '@stackpress/ingest/http';

const app = server();
route.get('/', path.join(__dirname, 'home'));
app.create().listen(3000);
```

```javascript
// src/home.ts
export default function HomePage(req, res) { 
  res.setHTML('Hello, World');
};
```

## Project Setup

1. Initialize your project:
```bash
mkdir my-ingest-app
cd my-ingest-app
yarn init -y
```

2. Install dependencies:
```bash
yarn add @stackpress/ingest
```

3. Create your first server file and start coding!

## Development Mode

To run your application in development mode:

```bash
yarn dev
```

## Building for Production

To build your application for production:

```bash
yarn build
```

For more detailed information, check out:
- [Core Concepts](./core-concepts.md)
- [Features](./features.md)
- [Examples](./examples.md)
