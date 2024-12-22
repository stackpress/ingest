# Fetch Examples

Learn how to use different fetching strategies in Ingest through practical examples.

## Basic Fetch

Simple data fetching example:

```javascript
import { createIngest } from '@your-org/ingest';

const ingest = createIngest({
  entries: {
    users: {
      async fetch() {
        const response = await fetch('https://api.example.com/users');
        return response.json();
      }
    }
  }
});

// Fetch data
const users = await ingest.entries.users.fetch();
```

## File Fetcher

Fetch data from files:

```javascript
import { createIngest, fileFetcher } from '@your-org/ingest';

const ingest = createIngest({
  entries: {
    config: {
      fetch: fileFetcher({
        path: './config.json',
        encoding: 'utf8'
      })
    },
    data: {
      fetch: fileFetcher({
        path: './data.csv',
        parser: (content) => {
          // Parse CSV content
          return content.split('\n').map(line => line.split(','));
        }
      })
    }
  }
});
```

## Custom Fetcher

Create a custom fetcher for specific needs:

```javascript
function databaseFetcher(config) {
  return async () => {
    const { table, query, params } = config;
    const client = await getDbClient();
    
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      await client.release();
    }
  };
}

const ingest = createIngest({
  entries: {
    users: {
      fetch: databaseFetcher({
        table: 'users',
        query: 'SELECT * FROM users WHERE active = $1',
        params: [true]
      })
    }
  }
});
```

## Parallel Fetching

Fetch multiple resources in parallel:

```javascript
const ingest = createIngest({
  entries: {
    users: {
      async fetch() {
        const response = await fetch('https://api.example.com/users');
        return response.json();
      }
    },
    posts: {
      async fetch() {
        const response = await fetch('https://api.example.com/posts');
        return response.json();
      }
    },
    comments: {
      async fetch() {
        const response = await fetch('https://api.example.com/comments');
        return response.json();
      }
    }
  }
});

// Fetch all data in parallel
const [users, posts, comments] = await Promise.all([
  ingest.entries.users.fetch(),
  ingest.entries.posts.fetch(),
  ingest.entries.comments.fetch()
]);
```

## Conditional Fetching

Fetch data based on conditions:

```javascript
const ingest = createIngest({
  entries: {
    userData: {
      async fetch(context) {
        const { userId, includeDetails } = context.params;
        
        const baseUrl = `https://api.example.com/users/${userId}`;
        const urls = [baseUrl];
        
        if (includeDetails) {
          urls.push(`${baseUrl}/details`);
        }
        
        const responses = await Promise.all(
          urls.map(url => fetch(url).then(r => r.json()))
        );
        
        return includeDetails 
          ? { ...responses[0], details: responses[1] }
          : responses[0];
      }
    }
  }
});

// Fetch with different conditions
const basicData = await ingest.entries.userData.fetch({ 
  params: { userId: 123, includeDetails: false }
});

const detailedData = await ingest.entries.userData.fetch({
  params: { userId: 123, includeDetails: true }
});
```
