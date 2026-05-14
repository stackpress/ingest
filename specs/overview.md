# Overview

Ingest is a server framework built around five ideas:

- a single server model that works across local and serverless runtimes
- an event-driven request lifecycle
- multiple ways to define routes
- optional composition through plugins and routers
- route metadata that tools can inspect

## What Ingest emphasizes

Ingest is strongest when you want to:

- keep application code close to HTTP concerns
- compose behavior through plugins instead of a large application container
- move between Node HTTP and WHATWG-style runtimes without rewriting your app model
- choose the route organization style that fits the project
- expose route structure to build or deployment tooling

## The mental model

At a high level, an Ingest app works like this:

1. Create a `server()`.
2. Register routes, hooks, and plugins.
3. Let an adapter turn runtime input into Ingest `Request` and `Response` objects.
4. Run the request through lifecycle events and route resolution.
5. Return or dispatch the response in the current runtime.

## Reading path

If you are new to the project, read in this order:

1. [Application Model](./concepts/application-model.md)
2. [Data Surfaces](./concepts/data-surfaces.md)
3. [Request Lifecycle](./concepts/request-lifecycle.md)
4. [Composition](./concepts/composition.md)
5. [Routing Patterns](./concepts/routing-patterns.md)
6. [Runtimes and Tooling](./concepts/runtimes-and-tooling.md)

Then move into [Guides](./guides/README.md) for implementation tasks or [API Reference](./api/README.md) for exact signatures.
