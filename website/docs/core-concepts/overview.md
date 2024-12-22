# Core Concepts

Understanding the core concepts of Ingest will help you build better 
data pipelines. Here's an overview of the key components and concepts.

## Ingest Instance

The ingest instance is the main entry point of your data pipeline. 
It's created using the `createIngest` function and manages all aspects 
of your data ingestion process.

```javascript
const ingest = createIngest({
  name: 'my-pipeline',
  // ... configuration options
});
```

## Entries

Entries are the building blocks of your data pipeline. Each entry 
represents a data source and defines how to:
- Fetch the data
- Transform the data (optional)
- Validate the data (optional)
- Handle errors

```javascript
{
  entries: {
    myEntry: {
      fetch: async () => { /* ... */ },
      transform: (data) => { /* ... */ },
      validate: (data) => { /* ... */ }
    }
  }
}
```

## Fetchers

Fetchers are responsible for retrieving data from various sources. 
Ingest provides several built-in fetchers:
- `httpFetcher`: For HTTP/HTTPS requests
- `fileFetcher`: For reading files
- Custom fetchers: Create your own fetcher for specific needs

## Transformers

Transformers modify the fetched data before it's passed to the next stage.
They can:
- Clean data
- Format data
- Enrich data with additional information
- Filter unwanted data

## Plugins

Plugins extend Ingest's functionality. They can:
- Add new features
- Modify existing behavior
- Add global transformers
- Implement custom logging or monitoring

## Error Handling

Ingest provides robust error handling mechanisms:
- Per-entry error handling
- Global error handling
- Retry mechanisms
- Error reporting and logging

## Next Steps

- Learn about [Architecture](architecture)
- Explore [Features](../features/entries)
- Check out [API Reference](../api/core-api)
