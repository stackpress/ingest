# Notes About Framework

The framework is a set of generic design patterns used as the base for 
all the functionality available in this library. It has 5 main patterns.

 1. **Server** - The Server is designed for both server and serverless, 
    in that either it can be ran in a non-ending loop serving up all 
    requests, or created to serve only one request before shutting down.
 2. **Router** - Server uses Router to map requests to their intended 
    actions. This is where you define your routes and action map.
 3. **Event & Route** - When Router matches requests with action, it 
    defines the relationship and organizes the metadata between the 
    triggered event string from a request and the event listener 
    (string or RegExp). This is used to axtract variables an parameters
    from the event listener.
 4. **Emitter** - Router uses Emitter to call all the actions in a 
    sorted order. It passes a Request, Response and the Event/Route to 
    each action.
 5. **Status** - The emitter returns a `StatusCode`. These codes are 
    useful to find out what happened after the `emit()` was called. 

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

## 3A. Event

```js
class Event<A, R, S>
```

An object that gets passed to an action callback. Generically, all 
actions that match an event trigger will pass the same request and
response objects. The event object is meta data that compares what 
event was triggered and what the event pattern is. For example.

`an_event` and `an_([a-z]+)` will be triggered by `an_event` and
share the same request and response, but the event object will have
different patterns. In this case we can use the event object to 
extract the `event` from `an_([a-z]+)`, but we cant do that with 
the `an_event` listener. 

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

## 3B. Route

```js
class Route<A, R, S> extends Event<A, R, S>
```

An object that is a kind of `Event` gets passed to an action callback. 
Generically, all actions that match an event trigger will pass the 
same request and response objects. The route object is meta data that 
compares what route was triggered and what the route pattern is. For 
example.

`/foo/:bar/zoo` and `/foo/bar/zoo` will be triggered by` /foo/bar/zoo` 
and share the same request and response, but the event object will 
have different patterns. In this case we can use the event object to 
extract the `:bar` from `/foo/:bar/zoo`, but we cant do that with 
`/foo/bar/zoo` listener.

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

## 4. Emitter

```js
abstract class Emitter<A, R, S>
```

An abstract class, Emitter adds sorts actions in a queue. You need to 
define how it emits. The generics needed are the following.

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

The abstract function that needs to be defined looks like the following.

```js
public abstract emit(
  req: R, 
  res: S, 
  event?: Event<A, R, S>,
  cache?: boolean
): Promise<StatusCode>;
```

The `buildtime` defines `emit()` to import an action file defined in the 
file router and calls it. The `runtime` uses `emit()` to simply call the 
action callback. The `gateway` uses `emit()` also to call the action 
callback, but passes IM, SR to the action.

`emit()` returns a `StatusCode`. These codes are useful to find out what 
happened after the `emit()` was called. For example if there are no 
actions, the `Status` will be `NOT_FOUND`. If any of the actions returns 
`false`, then the next actions won't be called and the `Status` will be 
`ABORTED`. If all actions were called and the last one did not return 
`false`, then the `Status` will be `OK`.

## 5. Status

Status Codes as return states by the `Emitter`. These codes are useful 
to find out what happened after an `Emitter.emit()` was called. For 
example if there are no actions, the `Status` will be `NOT_FOUND`. If 
any of the actions returns `false`, then the next actions won't be 
called and the `Status` will be `ABORTED`. If all actions were called 
and the last one did not return `false`, then the `Status` will be `OK`. 
The list of statuses are the following.

 - ABORT - { code: 308, message: 'Aborted' }
 - ERROR - { code: 500, message: 'Internal Error' }
 - NOT_FOUND - { code: 404, message: 'Not Found' }
 - OK - { code: 200, message: 'OK' }