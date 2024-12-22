# HTTP Examples

This guide provides practical examples of using HTTP features in Ingest.

## Basic HTTP Request

Simple GET request to an API:

```javascript
import { createIngest, httpFetcher } from '@your-org/ingest';

const ingest = createIngest({
  entries: {
    users: {
      fetch: httpFetcher({
        url: 'https://api.example.com/users',
        method: 'GET'
      })
    }
  }
});

// Fetch users
const users = await ingest.entries.users.fetch();
```

## POST Request with Data

Send data to an API:

```javascript
const ingest = createIngest({
  entries: {
    createUser: {
      fetch: httpFetcher({
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com'
        })
      })
    }
  }
});
```

## Authentication

Using different authentication methods:

```javascript
// Bearer Token
const ingest = createIngest({
  entries: {
    protectedApi: {
      fetch: httpFetcher({
        url: 'https://api.example.com/protected',
        headers: {
          'Authorization': 'Bearer your-token-here'
        }
      })
    }
  }
});

// Basic Auth
const ingest = createIngest({
  entries: {
    protectedApi: {
      fetch: httpFetcher({
        url: 'https://api.example.com/protected',
        auth: {
          username: 'user',
          password: 'pass'
        }
      })
    }
  }
});
```

## Error Handling

Handle HTTP errors gracefully:

```javascript
const ingest = createIngest({
  entries: {
    api: {
      fetch: httpFetcher({
        url: 'https://api.example.com/data',
        validateStatus: (status) => {
          return status < 500; // Only throw for server errors
        },
        onError: (error) => {
          if (error.response) {
            console.error(`HTTP ${error.response.status}:`, error.response.data);
          }
          throw error;
        }
      })
    }
  }
});
```

## Retry Configuration

Add retry logic for failed requests:

```javascript
const ingest = createIngest({
  entries: {
    unreliableApi: {
      fetch: httpFetcher({
        url: 'https://api.example.com/unreliable',
        retry: {
          attempts: 3,
          delay: 1000,
          backoff: 'exponential',
          conditions: [
            (error) => error.response?.status >= 500
          ]
        }
      })
    }
  }
});
```
