# Decorators

The decorators module adds optional controller-style registration on top of Ingest's existing router APIs. It does not introduce automatic discovery, dependency injection, or a separate execution model.

```typescript
import {
  Controller,
  Get,
  On,
  mount
} from '@stackpress/ingest/http';
```

You can import the same decorators from:

- `@stackpress/ingest`
- `@stackpress/ingest/http`
- `@stackpress/ingest/whatwg`

 1. [Exports](#1-exports)
 2. [Controller](#2-controller)
 3. [Route Decorators](#3-route-decorators)
 4. [Event Decorator](#4-event-decorator)
 5. [Mount Helper](#5-mount-helper)
 6. [Integration Notes](#6-integration-notes)

## 1. Exports

The decorators module exports:

- `Controller`
- `All`, `Connect`, `Delete`, `Get`, `Head`, `Options`, `Patch`, `Post`, `Put`, `Trace`
- `On`
- `mount`

## 2. Controller

`Controller(basePath?)` records a base path on a controller class. Route decorators mounted from that class use the base path as a prefix.

```typescript
@Controller('/api')
class UserController {}
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `basePath` | `string` | Optional path prefix applied to route decorators on the class. Defaults to `''`. |

**Returns**

A class decorator.

## 3. Route Decorators

The route decorators register instance methods as router actions for a specific HTTP method.

```typescript
import {
  Controller,
  Get,
  Post,
  type HttpAction
} from '@stackpress/ingest/http';

type HttpProps = Parameters<HttpAction>[0];

@Controller('/api')
class UserController {
  @Get('/users')
  public list({ res }: HttpProps) {
    res.setJSON([{ id: 1 }]);
  }

  @Post('/users', 10)
  public create({ res }: HttpProps) {
    res.code = 201;
  }
}
```

Supported route decorators:

- `All(path, priority?)`
- `Connect(path, priority?)`
- `Delete(path, priority?)`
- `Get(path, priority?)`
- `Head(path, priority?)`
- `Options(path, priority?)`
- `Patch(path, priority?)`
- `Post(path, priority?)`
- `Put(path, priority?)`
- `Trace(path, priority?)`

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `path` | `string` | Route path segment for the decorated method. |
| `priority` | `number` | Optional route priority. Higher numbers run first. Defaults to `0`. |

**Returns**

A method decorator.

## 4. Event Decorator

`On(event, priority?)` registers an instance method as a listener on the router event system.

```typescript
import { On, type HttpAction } from '@stackpress/ingest/http';

type HttpProps = Parameters<HttpAction>[0];

class AuditController {
  @On('GET /api/users', 10)
  public log({ req, res }: HttpProps) {
    res.headers.set('x-path', req.url.pathname);
  }
}
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `event` | `string \| RegExp` | Event name or event pattern to listen for. |
| `priority` | `number` | Optional listener priority. Higher numbers run first. Defaults to `0`. |

**Returns**

A method decorator.

## 5. Mount Helper

`mount(router, ...controllers)` turns controller metadata into active routes and listeners on a [Router](./Router.md) or [Server](./Server.md).

```typescript
import {
  Controller,
  Get,
  Router,
  mount,
  type HttpAction
} from '@stackpress/ingest/http';

type HttpProps = Parameters<HttpAction>[0];

@Controller('/api')
class UserController {
  @Get('/users')
  public list({ res }: HttpProps) {
    res.setBody('text/plain', 'list');
  }
}

const router = new Router();
mount(router, UserController);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `router` | `Router<any, any, any, any>` | Router or Server instance that should receive the registrations. |
| `controllers` | `ControllerMountable[]` | Controller classes or controller instances to mount. |

**Returns**

The same router instance for chaining.

## 6. Integration Notes

- Decorators are optional. They only register existing `route()` and `on()` calls for you.
- Mounting is explicit. Ingest does not scan files or bootstrap controllers automatically.
- `ControllerMountable` accepts either a controller class or a controller instance.
- Decorated methods should use explicit parameter types when destructuring props because decorators do not provide the same contextual typing as inline callbacks.
- Parameter decorators such as `@Body()` or `@Param()` are not part of this feature.
- `reflect-metadata` is not required.

## Related links

- [Use Decorators](../guides/use-decorators.md)
- [Router](./Router.md)
- [Server](./Server.md)
