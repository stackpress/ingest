# HTTP Integration

Ingest provides robust HTTP integration capabilities through 
its built-in HTTP fetcher and middleware system.

## HTTP Fetcher

The HTTP fetcher is a convenient way to fetch data from HTTP/HTTPS endpoints:

```javascript
import { createIngest, httpFetcher } from '@your-org/ingest';

const ingest = createIngest({
  entries: {
    userApi: {
      fetch: httpFetcher({
        url: 'https://api.example.com/users',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
  }
});
```

## Configuration Options

The HTTP fetcher supports various options:

```javascript
httpFetcher({
  // Basic options
  url: 'https://api.example.com',
  method: 'POST',
  headers: {},
  body: JSON.stringify({ key: 'value' }),

  // Advanced options
  timeout: 5000,
  retries: 3,
  retryDelay: 1000,
  validateStatus: (status) => status >= 200 && status < 300
});
```

## Authentication

Support for various authentication methods:

```javascript
// Bearer Token
httpFetcher({
  url: 'https://api.example.com',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Basic Auth
httpFetcher({
  url: 'https://api.example.com',
  auth: {
    username: 'user',
    password: 'pass'
  }
});
```

## Error Handling

The HTTP fetcher includes built-in error handling:

```javascript
const ingest = createIngest({
  entries: {
    api: {
      fetch: httpFetcher({
        url: 'https://api.example.com',
        onError: (error) => {
          if (error.response) {
            console.error('Server responded with:', error.response.status);
          } else if (error.request) {
            console.error('No response received');
          } else {
            console.error('Error setting up request:', error.message);
          }
        }
      })
    }
  }
});
```
