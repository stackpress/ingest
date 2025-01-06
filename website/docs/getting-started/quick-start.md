# Quick Start Guide

Get up and running with Ingest in minutes. 
This guide will walk you through creating your first data ingestion pipeline.

## Basic Setup

First, make sure you have Ingest installed in your project. 
If not, check the [Installation Guide](installation).

## Creating Your First Pipeline

1. Create a new file called `ingest.js`:

```javascript
import { createIngest } from '@ingest/core';

// Create an ingest instance
const ingest = createIngest({
  name: 'quick-start-pipeline',
  entries: {
    // Define your data source
    myFirstEntry: {
      async fetch() {
        // Example: Fetch data from an API
        const response = await fetch('https://api.example.com/data');
        const data = await response.json();
        return { data };
      },
      transform(data) {
        // Example: Transform the data
        return {
          ...data,
          processedAt: new Date().toISOString()
        };
      }
    }
  }
});

// Start the pipeline
async function main() {
  try {
    await ingest.start();
    console.log('Pipeline started successfully!');
  } catch (error) {
    console.error('Error starting pipeline:', error);
  }
}

main();
```

## Adding Data Transformation

Let's enhance our pipeline with data transformation:

```javascript
const ingest = createIngest({
  name: 'quick-start-pipeline',
  entries: {
    myFirstEntry: {
      async fetch() {
        return {
          data: { message: 'Hello from Ingest!' }
        };
      },
      transform(data) {
        return {
          ...data,
          timestamp: new Date().toISOString(),
          processed: true
        };
      }
    }
  }
});
```

## Using HTTP Fetcher

Here's how to fetch data from an API:

```javascript
import { createIngest, httpFetcher } from '@ingest/core';

const ingest = createIngest({
  name: 'api-pipeline',
  entries: {
    apiData: {
      fetch: httpFetcher({
        url: 'https://api.example.com/data',
        method: 'GET'
      })
    }
  }
});
```

## Next Steps

- Learn about [Core Concepts](../core-concepts/overview)
- Explore more [Features](../features/entries)
- Check out complete [Examples](../examples/with-entries)
