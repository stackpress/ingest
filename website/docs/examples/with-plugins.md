# Plugin Examples

Learn how to use and create plugins in Ingest through practical examples.

## Using Built-in Plugins

Example using the logging and metrics plugins:

```javascript
import { createIngest } from '@your-org/ingest';
import { loggingPlugin } from '@your-org/ingest-plugin-logging';
import { metricsPlugin } from '@your-org/ingest-plugin-metrics';

const ingest = createIngest({
  plugins: [
    loggingPlugin({
      level: 'debug',
      format: 'json'
    }),
    metricsPlugin({
      prometheus: true
    })
  ]
});
```

## Creating a Custom Plugin

Create a plugin that adds timing information:

```javascript
function timingPlugin(options = {}) {
  return (ingest) => ({
    initialize() {
      console.log('Timing plugin initialized');
    },

    cleanup() {
      console.log('Timing plugin cleaned up');
    },

    middleware: {
      async beforeFetch(context, next) {
        context.startTime = Date.now();
        return next();
      },

      async afterFetch(context, next) {
        const duration = Date.now() - context.startTime;
        console.log(`${context.entry.name} took ${duration}ms`);
        return next();
      }
    }
  });
}

// Use the custom plugin
const ingest = createIngest({
  plugins: [
    timingPlugin()
  ],
  entries: {
    users: {
      async fetch() {
        const response = await fetch('https://api.example.com/users');
        return response.json();
      }
    }
  }
});
```

## Plugin with Custom Methods

Add new methods to the Ingest instance:

```javascript
function analyticsPlugin(options = {}) {
  return (ingest) => ({
    methods: {
      trackEvent(eventName, data) {
        console.log(`Event: ${eventName}`, data);
      },
      
      getMetrics() {
        return {
          totalFetches: 100,
          averageDuration: 250
        };
      }
    },

    middleware: {
      afterFetch(context, next) {
        this.trackEvent('fetch_completed', {
          entry: context.entry.name,
          duration: Date.now() - context.startTime
        });
        return next();
      }
    }
  });
}

// Use the plugin
const ingest = createIngest({
  plugins: [
    analyticsPlugin()
  ]
});

// Use custom methods
ingest.trackEvent('custom_event', { foo: 'bar' });
const metrics = ingest.getMetrics();
```

## Combining Multiple Plugins

Use multiple plugins together:

```javascript
const ingest = createIngest({
  plugins: [
    loggingPlugin(),
    metricsPlugin(),
    timingPlugin(),
    analyticsPlugin(),
    customPlugin()
  ],
  entries: {
    users: {
      async fetch() {
        return fetch('https://api.example.com/users').then(r => r.json());
      }
    }
  }
});
```
