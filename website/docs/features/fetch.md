# Data Fetching

Ingest provides flexible data fetching capabilities through its fetcher system.

## Built-in Fetchers

Ingest comes with several built-in fetchers:

### HTTP Fetcher

```javascript
import { createIngest, httpFetcher } from '@your-org/ingest';

const ingest = createIngest({
  entries: {
    api: {
      fetch: httpFetcher({
        url: 'https://api.example.com/data'
      })
    }
  }
});
```

### File Fetcher

```javascript
import { createIngest, fileFetcher } from '@your-org/ingest';

const ingest = createIngest({
  entries: {
    localData: {
      fetch: fileFetcher({
        path: './data.json',
        encoding: 'utf8'
      })
    }
  }
});
```

## Custom Fetchers

Create custom fetchers for specific data sources:

```javascript
function customFetcher(config) {
  return async () => {
    // Implementation
    const data = await someCustomLogic();
    return data;
  };
}

const ingest = createIngest({
  entries: {
    custom: {
      fetch: customFetcher({
        // Custom configuration
      })
    }
  }
});
```

## Fetch Configuration

Common fetch configuration options:

```javascript
const ingest = createIngest({
  entries: {
    data: {
      fetch: someFetcher({
        // Retry configuration
        retry: {
          attempts: 3,
          delay: 1000,
          backoff: 'exponential'
        },

        // Timeout configuration
        timeout: 5000,

        // Cache configuration
        cache: {
          ttl: 60000, // 1 minute
          key: 'custom-key'
        }
      })
    }
  }
});
```

## Error Handling

Handle fetch errors gracefully:

```javascript
const ingest = createIngest({
  entries: {
    data: {
      fetch: async () => {
        try {
          return await someFetcher();
        } catch (error) {
          // Custom error handling
          if (error.code === 'TIMEOUT') {
            return fallbackData;
          }
          throw error;
        }
      }
    }
  }
});
```
