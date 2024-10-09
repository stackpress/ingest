# Notes About Framework

The framework is a set of generic design patterns used as the base for 
all the functionality available in this library. It has 5 main patterns.

 1. **Router** - A server uses Router to map requests to their intended 
    actions. This is where you define your routes and action map.
 2. **Emitter** - Router uses Emitter to call all the actions in a 
    sorted order. It passes a Request, Response and the Event/Route to 
    each action.
 3. **Status** - The emitter returns a `StatusCode`. These codes are 
    useful to find out what happened after the `emit()` was called. 

## 1. Router

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
public abstract makeEmitter(): Emitter<A>;
```

## 2. Emitter

```js
abstract class Emitter<A>
```

Emitter adds sorts actions in a queue. You need to define how it emits. 
The generics needed are the following.

 - A - Action. Examples of an action could be a callback function or a 
   file location of an action callback.

## 3. Status

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