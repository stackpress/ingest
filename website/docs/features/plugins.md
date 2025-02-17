# Plugins

Ingest supports a powerful plugin system 
that allows you to extend its functionality.

## Creating a Plugin

A plugin is a function that receives the Ingest instance 
and can modify its behavior:

```javascript
function myPlugin(ingest) {
  return {
    // Plugin initialization
    initialize() {
      // Setup code
    },

    // Cleanup when plugin is removed
    cleanup() {
      // Cleanup code
    },

    // Add new methods to ingest instance
    methods: {
      newMethod() {
        // Implementation
      }
    },

    // Add middleware
    middleware: {
      beforeFetch(context, next) {
        // Pre-fetch logic
        return next();
      },
      afterFetch(context, next) {
        // Post-fetch logic
        return next();
      }
    }
  };
}
```

## Using Plugins

Register plugins when creating an Ingest instance:

```javascript
import { createIngest } from '@your-org/ingest';
import loggingPlugin from '@your-org/ingest-plugin-logging';
import metricsPlugin from '@your-org/ingest-plugin-metrics';

const ingest = createIngest({
  plugins: [
    loggingPlugin({
      level: 'debug'
    }),
    metricsPlugin()
  ]
});
```

## Built-in Plugins

Ingest comes with several built-in plugins:

- Logging Plugin: Advanced logging capabilities
- Metrics Plugin: Performance monitoring
- Cache Plugin: Data caching
- Retry Plugin: Automatic retry logic

## Example: Logging Plugin

```javascript
function loggingPlugin(options = {}) {
  return (ingest) => ({
    initialize() {
      console.log('Logging plugin initialized');
    },

    middleware: {
      beforeFetch(context, next) {
        console.log(`Fetching from ${context.entry.name}`);
        const startTime = Date.now();
        
        return next().then(result => {
          const duration = Date.now() - startTime;
          console.log(`Fetch completed in ${duration}ms`);
          return result;
        });
      }
    }
  });
}

// Usage
const ingest = createIngest({
  plugins: [
    loggingPlugin({
      level: 'debug',
      format: 'json'
    })
  ]
});
```
