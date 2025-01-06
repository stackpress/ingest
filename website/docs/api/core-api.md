# Core API Reference

This page documents the core API methods and configurations available 
in Ingest.

## createIngest()

The main function to create an Ingest instance.

```typescript
function createIngest(config: IngestConfig): IngestInstance;
```

### Configuration Options

```typescript
interface IngestConfig {
  name: string;                    // Name of your ingest pipeline
  entries?: Record<string, Entry>; // Data source entries
  plugins?: Plugin[];             // Array of plugins to use
  options?: {
    concurrent?: boolean;         // Run entries concurrently
    maxRetries?: number;         // Maximum retry attempts
    retryDelay?: number;         // Delay between retries (ms)
  };
}
```

### Entry Configuration

```typescript
interface Entry {
  fetch: () => Promise<any>;      // Required: Function to fetch data
  transform?: (data: any) => any; // Optional: Transform fetched data
  validate?: (data: any) => boolean; // Optional: Validate data
  options?: {
    timeout?: number;            // Timeout in milliseconds
    retries?: number;           // Entry-specific retry count
  };
}
```

## Instance Methods

### start()

Starts the ingest pipeline.

```typescript
async function start(): Promise<void>;
```

### stop()

Stops the ingest pipeline.

```typescript
async function stop(): Promise<void>;
```

### addEntry()

Adds a new entry to the pipeline.

```typescript
function addEntry(name: string, entry: Entry): void;
```

### removeEntry()

Removes an entry from the pipeline.

```typescript
function removeEntry(name: string): void;
```

## Built-in Fetchers

### httpFetcher()

Creates a fetcher for HTTP requests.

```typescript
function httpFetcher(config: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}): () => Promise<any>;
```

### fileFetcher()

Creates a fetcher for file operations.

```typescript
function fileFetcher(config: {
  path: string;
  encoding?: string;
}): () => Promise<any>;
```

## Error Handling

### IngestError

Base error class for Ingest-specific errors.

```typescript
class IngestError extends Error {
  constructor(message: string, options?: {
    code?: string;
    cause?: Error;
  });
}
```

## Next Steps

- Check out [Plugin API](plugins)
- View [Examples](../examples/with-entries)
- Learn about [Error Handling](../core-concepts/error-handling)
