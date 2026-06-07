# Use Decorators

This guide shows how to use Ingest's optional decorator support without changing the router model underneath. Decorators only register routes and event hooks. You still mount controllers explicitly, and the router still runs through the same `route()` and `on()` APIs as manual registration.

## Before you start

Decorator support depends on TypeScript decorator syntax, so enable decorators in the project that declares the controller classes.

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

Ingest does not add a bootstrap scan, metadata reflection layer, or dependency injection container around this feature. If a controller should be active, mount it yourself.

## Define a controller

The `Controller()` class decorator provides an optional base path. Method decorators register route handlers or event listeners on that controller.

```typescript
import {
  Controller,
  Get,
  On,
  Post,
  server,
  type HttpAction
} from '@stackpress/ingest/http';

type HttpProps = Parameters<HttpAction>[0];

@Controller('/api')
class UserController {
  @Get('/users')
  public list({ res }: HttpProps) {
    res.set('text/plain', 'list');
  }

  @Post('/users/:id')
  public create({ req, res }: HttpProps) {
    res.set('text/plain', `${req.data('id')}:create`);
  }

  @On('GET /api/users', 10)
  public audit({ req, res }: HttpProps) {
    res.headers.set('x-path', req.url.pathname);
  }
}

const app = server();
app.mount(UserController);
```

## Mount controllers explicitly

`mount()` is the step that turns controller metadata into active routes and listeners.

```typescript
import {
  Controller,
  Get,
  mount,
  Router,
  type HttpAction
} from '@stackpress/ingest/http';

type HttpProps = Parameters<HttpAction>[0];

@Controller('/admin')
class AdminController {
  @Get('/dashboard')
  public dashboard({ res }: HttpProps) {
    res.set('text/plain', 'ok');
  }
}

const router = new Router();
mount(router, AdminController);
```

You can mount:

- controller classes, which Ingest instantiates with `new`
- controller instances, when you want to keep instance state or setup logic
- multiple controllers in one call

`Server` inherits `Router`, so `server.mount(...)` works the same way.

## Choose the decorators

Ingest supports one class decorator, several route decorators, one event decorator, and the `mount()` helper:

- `Controller`
- `All`, `Connect`, `Delete`, `Get`, `Head`, `Options`, `Patch`, `Post`, `Put`, `Trace`
- `On`
- `mount`

Route decorators map directly to existing router methods. For example, `@Get('/users')` registers the same route you would otherwise add with `router.route('GET', '/users', handler)` or `router.get('/users', handler)`.

`@On(...)` maps to the regular event system, so it is useful for route-scoped hooks such as auditing, logging, or response header changes.

## Keep method parameters typed explicitly

Decorated class methods do not contextually type destructured parameters the same way inline callbacks do. Add an explicit parameter type on controller methods when you destructure `req`, `res`, or `ctx`.

```typescript
import { Get, type HttpAction } from '@stackpress/ingest/http';

type HttpProps = Parameters<HttpAction>[0];

class ExampleController {
  @Get('/health')
  public status({ res }: HttpProps) {
    res.json({ ok: true });
  }
}
```

This is why the decorator tests use explicit parameter types even though inline route handlers often infer them automatically.

## What decorators do not add

The decorator layer is intentionally small. It does not include:

- bootstrap discovery
- parameter decorators such as `@Body()` or `@Param()`
- dependency injection
- `reflect-metadata`

Nest-style parameter decorators are a separate feature area because they need parameter metadata and argument resolution at call time. The current Ingest decorator support stops at registration sugar for controllers, routes, and event hooks.

## Read next

- [Routing Patterns](../concepts/routing-patterns.md)
- [Router API](../api/Router.md)
- [Decorators API](../api/Decorators.md)
