# Installation

This guide will help you get started with installing Ingest in your project.

## Prerequisites

Before installing Ingest, make sure you have:
- Node.js (version 16.14 or higher)
- npm or yarn package manager

## Installation Steps

1. Create a new project or navigate to your existing project directory:
```bash
mkdir my-ingest-project
cd my-ingest-project
```

2. Initialize your project (if it's new):
```bash
npm init -y
# or
yarn init -y
```

3. Install Ingest:
```bash
npm install @your-org/ingest
# or
yarn add @your-org/ingest
```

## Verifying Installation

Create a simple test file to verify your installation:

```javascript
import { createIngest } from '@your-org/ingest';

const ingest = createIngest({
  // Basic configuration
  name: 'my-first-ingest'
});

console.log('Ingest initialized successfully!');
```

## Next Steps

- Check out the [Quick Start Guide](quick-start) to create your first ingest pipeline
- Learn about [Core Concepts](../core-concepts/overview)
- Explore [Examples](../examples/with-entries) to see Ingest in action
