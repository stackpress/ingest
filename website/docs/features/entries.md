# Entries

Entries are the core building blocks of your data ingestion pipeline. 
Each entry represents a data source and defines how data should be 
fetched, transformed, and validated.

## Creating an Entry

```javascript
const ingest = createIngest({
  entries: {
    myEntry: {
      // Define how to fetch data
      async fetch() {
        return {
          data: await someDataSource()
        };
      },
      
      // Optional: Transform the fetched data
      transform(data) {
        return {
          ...data,
          timestamp: new Date().toISOString()
        };
      },
      
      // Optional: Validate the data
      validate(data) {
        return data.requiredField != null;
      }
    }
  }
});
```

## Entry Configuration Options

Each entry can have the following options:

- `fetch`: Required function that retrieves data
- `transform`: Optional function to modify the data
- `validate`: Optional function to validate the data
- `retry`: Optional retry configuration
- `timeout`: Optional timeout in milliseconds

## Example: HTTP Entry

```javascript
import { createIngest, httpFetcher } from '@your-org/ingest';

const ingest = createIngest({
  entries: {
    apiData: {
      fetch: httpFetcher({
        url: 'https://api.example.com/data',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token'
        }
      }),
      transform(data) {
        return data.items;
      }
    }
  }
});
```

## Error Handling

Entries provide built-in error handling:

```javascript
const ingest = createIngest({
  entries: {
    myEntry: {
      fetch: async () => {
        try {
          return await riskyOperation();
        } catch (error) {
          console.error('Failed to fetch:', error);
          throw error;
        }
      },
      onError: (error) => {
        // Custom error handling
        notifyAdmin(error);
      }
    }
  }
});
```
