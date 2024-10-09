# Notes About Buildtime

The main purpose of buildtime is to collect all the route and event
files used in the Project and map them to route paths and listeners.
This information is extracted by services to generate endpoints for 
various serverless services.

The major files in this folder derrive from the `framework` folder.

## Structure

 1. **Server** - The Server is designed for both server and serverless, 
    in that either it can be ran in a non-ending loop serving up all 
    requests, or created to serve only one request before shutting down.
 2. **Router** - Server uses Router to map requests to their intended 
    actions. This is where you define your routes and action map.
 3. **Emitter** - Router uses Emitter to call all the actions in a 
    sorted order. It passes a Request, Response and the Event/Route to 
    each action.

## 1. Server

```js
class Server
```

The buildtime server is a development server that processes route paths
to entry files, then runs the action contained within the entry file.
This development server doesn't cache the import, meaning you can edit
entry files and see the changes without restarting the server. 

## 2. Router

```js
abstract class Router
```

The router maps routes to action file paths. The router includes a 
`manifest()` function used to access the `Manifest` class. The Manifest 
class works with the Builder class to generate the final entry files per 
endpoint. The manifest class does the actual bundling of files using 
`esbuild`.

## 3. Emitter

```js
abstract class Emitter<A>
```

The buildtime emitter adds sorts actions in a queue and emits the 
actions in the entry file in the sorted order. `emit()` returns a 
`StatusCode`. These codes are useful to find out what happened after 
the `emit()` was called. For example if there are no actions, the 
`Status` will be `NOT_FOUND`. If any of the actions returns `false`, 
then the next actions won't be called and the `Status` will be 
`ABORTED`. If all actions were called and the last one did not return 
`false`, then the `Status` will be `OK`.
