# Working with Entries

This guide shows you how to work with entries in Ingest through practical examples.

## Basic Entry

Here's a basic entry that fetches data from an API:

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

// Use the entry
const users = await ingest.entries.users.fetch();
```

## Entry with Transform

Transform the fetched data before using it:

```javascript
const ingest = createIngest({
  entries: {
    users: {
      async fetch() {
        const response = await fetch('https://api.example.com/users');
        return response.json();
      },
      transform(users) {
        return users.map(user => ({
          id: user.id,
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email.toLowerCase()
        }));
      }
    }
  }
});

// Get transformed data
const users = await ingest.entries.users.fetch();
```

## Entry with Validation

Add validation to ensure data quality:

```javascript
const ingest = createIngest({
  entries: {
    users: {
      async fetch() {
        const response = await fetch('https://api.example.com/users');
        return response.json();
      },
      validate(users) {
        return users.every(user => 
          user.id && 
          typeof user.email === 'string' &&
          user.email.includes('@')
        );
      }
    }
  }
});
```

## Dependent Entries

Create entries that depend on other entries:

```javascript
const ingest = createIngest({
  entries: {
    users: {
      async fetch() {
        const response = await fetch('https://api.example.com/users');
        return response.json();
      }
    },
    userPosts: {
      async fetch(context) {
        const users = await context.entries.users.fetch();
        const posts = [];
        
        for (const user of users) {
          const response = await fetch(`https://api.example.com/users/${user.id}/posts`);
          posts.push(...await response.json());
        }
        
        return posts;
      }
    }
  }
});
```
