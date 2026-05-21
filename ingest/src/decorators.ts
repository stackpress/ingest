//stackpress
import type { Method } from '@stackpress/lib/types';
//client
import type Router from './Router.js';
import type {
  ControllerClass,
  ControllerEventDefinition,
  ControllerHandler,
  ControllerInstance,
  ControllerMetadata,
  ControllerMountable,
  ControllerRouteDefinition
} from './types.js';

const CONTROLLER = Symbol('ingest.controller');

/**
 * Load or create the controller metadata on the class constructor 
 * so every decorator writes into the same registration record.
 */
export function metadataOf(target: Function) {
  const metadata = (target as unknown as Record<symbol, ControllerMetadata>)
    [CONTROLLER];
  if (metadata) {
    return metadata;
  }
  const initial: ControllerMetadata = { basePath: '', routes: [], events: [] };
  Object.defineProperty(target, CONTROLLER, {
    value: initial,
    writable: true
  });
  return initial;
};

/**
 * Skip duplicate registrations so standard decorator initializers can 
 * safely run per instance without stacking the same route definitions 
 * over time.
 */
export function hasRoute(
  metadata: ControllerMetadata,
  definition: ControllerRouteDefinition
) {
  return metadata.routes.some(route => route.method === definition.method
    && route.path === definition.path
    && route.property === definition.property
    && route.priority === definition.priority);
};

/**
 * Skip duplicate event hooks for the same reason as routes so repeated 
 * controller instantiation does not multiply listeners unexpectedly.
 */
export function hasEvent(
  metadata: ControllerMetadata,
  definition: ControllerEventDefinition
) {
  return metadata.events.some(event => event.event === definition.event
    && event.property === definition.property
    && event.priority === definition.priority);
};

/**
 * Append a route definition only when this class has 
 * not already recorded the same decorator output.
 */
export function addRoute(target: Function, definition: ControllerRouteDefinition) {
  const metadata = metadataOf(target);
  if (!hasRoute(metadata, definition)) {
    metadata.routes.push(definition);
  }
};

/**
 * Append an event definition only when this class 
 * has not already recorded the same decorator output.
 */
export function addEvent(target: Function, definition: ControllerEventDefinition) {
  const metadata = metadataOf(target);
  if (!hasEvent(metadata, definition)) {
    metadata.events.push(definition);
  }
};

/**
 * Normalize nested controller and route segments into the exact path 
 * string that the existing router registration methods already expect.
 */
export function normalizePath(...parts: string[]) {
  const combined = parts
    .filter(part => typeof part === 'string' && part.length > 0)
    .join('/');
  if (!combined.length) {
    return '';
  }
  const normalized = combined.replace(/\/{2,}/g, '/');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

/**
 * Build each HTTP decorator from the same registration path so route 
 * metadata stays consistent regardless of which method alias the user 
 * chooses.
 */
export function routeDecorator(method: Method|'ALL') {
  return function(path: string, priority = 0): MethodDecorator {
    return function(...args) {
      //Support legacy decorators by writing directly to the prototype's
      //constructor when TypeScript emits the older decorator shape.
      if (args.length >= 2 
        && (typeof args[1] !== 'object' || args[1] === null)) {
        const [ target, propertyKey ] = args as unknown as [
          object,
          string|symbol,
          PropertyDescriptor?
        ];
        if (typeof target === 'function') {
          throw new TypeError(
            `Decorator "${String(propertyKey)}" must be an instance method`
          );
        }
        addRoute(target.constructor, {
          method,
          path,
          property: propertyKey,
          priority
        });
        return;
      }

      //Support standard decorators by delaying metadata registration until an
      //instance exists, then dedupe repeated constructor initializations.
      const [ value, context ] = args as unknown as [
        unknown,
        ClassMethodDecoratorContext
      ];
      void value;
      if (context.kind !== 'method' || context.static) {
        throw new TypeError(
          `Decorator "${String(context.name)}" must be an instance method`
        );
      }
      context.addInitializer(function(this: unknown) {
        addRoute((this as { constructor: Function }).constructor, {
          method,
          path,
          property: context.name,
          priority
        });
      });
    };
  };
};

/**
 * Ensure the mounted member is actually callable before 
 * passing it through the existing router registration flow.
 */
export function assertHandler(
  controller: object,
  property: string|symbol
) {
  const handler = (controller as Record<string|symbol, unknown>)[property];
  if (typeof handler !== 'function') {
    throw new TypeError(
      `Controller member "${String(property)}" is not a function`
    );
  }
  return handler as ControllerHandler;
};

/**
 * Normalize class and instance inputs into a concrete controller 
 * instance so mounting can stay explicit while supporting both call 
 * styles.
 */
export function controllerOf(mountable: ControllerMountable) {
  if (typeof mountable === 'function') {
    const Controller = mountable as ControllerClass;
    return new Controller();
  }
  return mountable as ControllerInstance;
};

/**
 * Register the decorated route against the existing router 
 * surface instead of introducing a parallel execution path.
 */
export function registerRoute<
  X extends Router<any, any> = Router<any, any>
>(
  router: X,
  controller: object,
  basePath: string,
  route: ControllerRouteDefinition
) {
  const handler = assertHandler(controller, route.property);
  router.route(
    route.method,
    normalizePath(basePath, route.path),
    handler.bind(controller) as ControllerHandler,
    route.priority
  );
};

/**
 * Register the decorated event hook through the same 
 * event API that manual listeners already use today.
 */
export function registerEvent<
  X extends Router<any, any> = Router<any, any>
>(
  router: X,
  controller: object,
  event: ControllerEventDefinition
) {
  const handler = assertHandler(controller, event.property);
  router.on(
    event.event,
    handler.bind(controller) as ControllerHandler,
    event.priority
  );
};

/**
 * Records a base path for the decorated controller class
 */
export function Controller(basePath = ''): ClassDecorator {
  return function(target, context?: ClassDecoratorContext) {
    void context;
    const metadata = metadataOf(target);
    metadata.basePath = basePath;
  };
};

/**
 * Decorates a handler for all methods
 */
export function All(path: string, priority = 0) {
  return routeDecorator('ALL')(path, priority);
};

/**
 * Decorates a handler for the CONNECT method
 */
export function Connect(path: string, priority = 0) {
  return routeDecorator('CONNECT')(path, priority);
};

/**
 * Decorates a handler for the DELETE method
 */
export function Delete(path: string, priority = 0) {
  return routeDecorator('DELETE')(path, priority);
};

/**
 * Decorates a handler for the GET method
 */
export function Get(path: string, priority = 0) {
  return routeDecorator('GET')(path, priority);
};

/**
 * Decorates a handler for the HEAD method
 */
export function Head(path: string, priority = 0) {
  return routeDecorator('HEAD')(path, priority);
};

/**
 * Decorates a handler for the given event expression
 */
export function On(event: string|RegExp, priority = 0): MethodDecorator {
  return function(...args) {
    //Support legacy decorators by writing directly to the prototype's
    //constructor when TypeScript emits the older decorator shape.
    if (args.length >= 2 
      && (typeof args[1] !== 'object' || args[1] === null)) {
      const [ target, propertyKey ] = args as unknown as [
        object,
        string|symbol,
        PropertyDescriptor?
      ];
      if (typeof target === 'function') {
        throw new TypeError(
          `Decorator "${String(propertyKey)}" must be an instance method`
        );
      }
      addEvent(target.constructor, {
        event,
        property: propertyKey,
        priority
      });
      return;
    }

    //Support standard decorators by delaying metadata registration until an
    //instance exists, then dedupe repeated constructor initializations.
    const [ value, context ] = args as unknown as [
      unknown,
      ClassMethodDecoratorContext
    ];
    void value;
    if (context.kind !== 'method' || context.static) {
      throw new TypeError(
        `Decorator "${String(context.name)}" must be an instance method`
      );
    }
    context.addInitializer(function(this: unknown) {
      addEvent((this as { constructor: Function }).constructor, {
        event,
        property: context.name,
        priority
      });
    });
  };
};

/**
 * Decorates a handler for the OPTIONS method
 */
export function Options(path: string, priority = 0) {
  return routeDecorator('OPTIONS')(path, priority);
};

/**
 * Decorates a handler for the PATCH method
 */
export function Patch(path: string, priority = 0) {
  return routeDecorator('PATCH')(path, priority);
};

/**
 * Decorates a handler for the POST method
 */
export function Post(path: string, priority = 0) {
  return routeDecorator('POST')(path, priority);
};

/**
 * Decorates a handler for the PUT method
 */
export function Put(path: string, priority = 0) {
  return routeDecorator('PUT')(path, priority);
};

/**
 * Decorates a handler for the TRACE method
 */
export function Trace(path: string, priority = 0) {
  return routeDecorator('TRACE')(path, priority);
};

/**
 * Mounts one or more decorated controllers onto a router or server
 */
export function mount<
  X extends Router<any, any> = Router<any, any>
>(
  router: X,
  ...controllers: ControllerMountable[]
) {
  for (const mountable of controllers) {
    const controller = controllerOf(mountable);
    const metadata = metadataOf(controller.constructor);
    for (const route of metadata.routes) {
      registerRoute<X>(
        router,
        controller,
        metadata.basePath,
        route
      );
    }
    for (const event of metadata.events) {
      registerEvent<X>(router, controller, event);
    }
  }
  return router;
};
