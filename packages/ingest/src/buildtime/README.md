# Notes About Buildtime

The main purpose of buildtime is to collect all the route and event
files used in the Project and map them to route paths and listeners.
This information is extracted by services to generate endpoints for 
various serverless services.

The major files in this folder derrive from the `framework` folder. The 
generics for buildtime files are the following.

 - A - Action. `ActionFile`
 - R - Request. `Request` defined in the `payload` folder
 - S - Response. `Response` defined in the `payload` folder

Other notes about the `buildtime` folder include the following.

 - Router includes a `manifest()` function used to access the `Manifest`
   class. The Manifest class works with the Builder class to generate 
   the final entry files per endpoint. The manifest class does the 
   actual bundling of files using `esbuild`.
 - The `Builder` class is used to programmatically template the entry 
   file loosely using `ts-morph`, and you are free to use your own 
   alternative.
 - `Server` is mainly used to easily start a development environment.

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
class Server<A, R, S>
```

A generic class with helpers used as a guide for other server that 
extend from this. The Server is designed for both server and serverless, 
in that either it can be ran in a non-ending loop serving up all 
requests, or created to serve only one request before shutting down. 
The generics needed are the following.

 - A - Action. Examples of an action could be a callback function or a 
   file location of an action callback.
 - R - Request. The request object. Examples of a request could be 
   IncomingMessage, Fetch Request or the built-in `Request` defined
   in the `payload` folder. Though most of the time it should be the 
   built-in `Request` defined in the `payload` folder, we left this 
   generic to allow the `gateway` folder to re-use this class for 
   IncomingMessage.
 - S - Response. The response object. Examples of a response could be 
   ServerResponse, Fetch Response or the built-in `Response` defined
   in the `payload` folder. Though most of the time it should be the 
   built-in `Response` defined in the `payload` folder, we left this 
   generic to allow the `gateway` folder to re-use this class for 
   ServerResponse.

## 2. Router

```js
abstract class Router<A, R, S>
```

An abstract class, the router combines the functionality of listening,
emitting and routing events. The generics needed are the following.

 - A - Action. Examples of an action could be a callback function or a 
   file location of an action callback.
 - R - Request. The request object. Examples of a request could be 
   IncomingMessage, Fetch Request or the built-in `Request` defined
   in the `payload` folder. Though most of the time it should be the 
   built-in `Request` defined in the `payload` folder, we left this 
   generic to allow the `gateway` folder to re-use this class for 
   IncomingMessage.
 - S - Response. The response object. Examples of a response could be 
   ServerResponse, Fetch Response or the built-in `Response` defined
   in the `payload` folder. Though most of the time it should be the 
   built-in `Response` defined in the `payload` folder, we left this 
   generic to allow the `gateway` folder to re-use this class for 
   ServerResponse.

The abstract that needs to be defined is the emitter that will be used. 

```js
public abstract makeEmitter(): Emitter<A, R, S>;
```

## 3. Emitter

```js
abstract class Emitter<A>
```

Emitter adds sorts actions in a queue. You need to define how it emits. 
The generics needed are the following.

 - A - Action. Examples of an action could be a callback function or a 
   file location of an action callback.

The `buildtime` defines `emit()` to import an action file defined in the 
file router and calls it. 

`emit()` returns a `StatusCode`. These codes are useful to find out what 
happened after the `emit()` was called. For example if there are no 
actions, the `Status` will be `NOT_FOUND`. If any of the actions returns 
`false`, then the next actions won't be called and the `Status` will be 
`ABORTED`. If all actions were called and the last one did not return 
`false`, then the `Status` will be `OK`.
