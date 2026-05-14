//modules
import { createServer } from 'node:http';
//stackpress
import type { 
  CallableMap, 
  CallableNest, 
  UnknownNest 
} from '@stackpress/lib';
import { map } from '@stackpress/lib/Map';
import { nest } from '@stackpress/lib/Nest';
//local
import type { 
  Infer,
  KnownPlugin,
  ServerAction,
  ServerPlugin,
  ServerProps,
  ServerGateway,
  ServerHandler,
  ServerOptions,
  NodeServerOptions
} from './types.js';
import type Request from './Request.js';
import type Response from './Response.js';
import Router from './Router.js';
import { PluginLoader } from './Loader.js';

/**
 * Generic server class
 * 
 * - extends router
 * - extends event emitter
 * - has an arbitrary config map <C>
 * - has a plugin manager
 * - generic request<R> and response<S> wrappers
 * - plug in http or fetch server with handler()
 */
export default class Server<
  R = unknown, 
  S = unknown,
  C extends UnknownNest = UnknownNest,
  P extends Record<string, unknown> = Record<string, unknown>
> 
  extends Router<R, S, CallableNest<C>, ServerPlugin<P>>
{
  //arbitrary config map
  public readonly config: CallableNest<C>;
  //plugin loader
  public readonly loader: PluginLoader;
  //list of plugin configurations
  public readonly plugins: CallableMap;
  //gateway used for development or stand alone
  protected _gateway: ServerGateway;
  //handler used for API entry
  protected _handler: ServerHandler<R, S, C, P>;

  /**
   * Sets the request handler
   */
  public set gateway(callback: ServerGateway) {
    this._gateway = callback;
  }

  /**
   * Sets the request handler
   */
  public set handler(callback: ServerHandler<R, S, C, P>) {
    this._handler = callback;
  }

  /**
   * Sets up the server runtime
   *
   * The server keeps config and plugin state on the class so
   * handlers and bootstrapping share one source of truth.
   */
  public constructor(options: ServerOptions<R, S, C, P> = {}) {
    super();
    this.config = nest();
    this.plugins = map();
    this.loader = new PluginLoader(options);
    this._gateway = (options.gateway || gateway)(this);
    this._handler = options.handler || handler;
  }

  /**
   * Loads the plugins and allows them to 
   * self bootstrap and configure themselves
   */
  public async bootstrap() {
    await this.loader.bootstrap(async (name, plugin) => {
      if (typeof plugin === 'function') {
        const config = await plugin(this);
        if (config && typeof config === 'object') {
          this.register(name, config);
        }
      } else if (plugin && typeof plugin === 'object') {
        this.register(name, plugin);
      }
    });
    return this;
  }

  /**
   * Creates a new server
   */
  public create(options: NodeServerOptions = {}) {
    return this._gateway(options);
  }

  /**
   * Handles a request
   */
  public async handle(request: R, response: S) {
    //handle the request
    return await this._handler(this, request, response);
  }

  /**
   * Builds the canonical handler props object
   *
   * Centralizing props construction keeps route dispatch,
   * event dispatch, and direct action execution aligned.
   */
  public props(req: Request<R>, res: Response<S>): ServerProps<R, S, C, P> {
    const plugin = this._plugin();
    return {
      request: req,
      response: res,
      server: this,
      config: this.config,
      plugin,
      req,
      res,
      ctx: this,
      cfg: this.config,
      plg: plugin
    };
  }

  /**
   * Gets the plugin by name
   */
  public plugin<V = Infer, K extends string = string>(name: K) {
    return this.plugins.get(name) as V extends Infer
      ? KnownPlugin<P, K>
      : V;
  }

  /**
   * Registers a plugin
   *
   * Returning a narrowed server keeps plugin registration
   * ergonomic during fluent setup without changing runtime shape.
   */
  public register<K extends string, V>(name: K, config: V) {
    this.plugins.set(name, config);
    return this as unknown as Server<R, S, C, P & { [key in K]: V }>;
  }

  /**
   * Creates the plugin lookup used by handler props
   *
   * The bound function preserves the familiar `plugin(name)`
   * call shape while still sourcing data from the server.
   */
  protected _plugin(): ServerPlugin<P> {
    return this.plugin.bind(this) as ServerPlugin<P>;
  }
};

/**
 * Default server gateway
 */
export function gateway<
  R = unknown, 
  S = unknown,
  C extends UnknownNest = UnknownNest,
  P extends Record<string, unknown> = Record<string, unknown>
>(server: Server<R, S, C, P>) {
  return (options: NodeServerOptions) => createServer(
    options, 
    (im, sr) => server.handle(im as R, sr as S)
  );
};

/**
 * Default server request handler
 */
export async function handler<
  R = unknown, 
  S = unknown,
  C extends UnknownNest = UnknownNest,
  P extends Record<string, unknown> = Record<string, unknown>
>(_ctx: Server<R, S, C, P>, _req: R, res: S) {
  return res;
};

/**
 * Default server factory
 */
export function server<
  R = unknown,
  S = unknown,
  C extends UnknownNest = UnknownNest,
  P extends Record<string, unknown> = Record<string, unknown>
>(options: ServerOptions<R, S, C, P> = {}) {
  options.gateway = options.gateway || gateway;
  options.handler = options.handler || handler;
  return new Server<R, S, C, P>(options);
};

/**
 * Default router factory
 */
export function router() {
  return new Router<unknown, unknown, unknown, unknown>();
}

/**
 * Passes through a handler while preserving contextual props typing
 */
export function action<
  R = unknown,
  S = unknown,
  C extends UnknownNest = UnknownNest,
  P extends Record<string, unknown> = Record<string, unknown>
>(action: ServerAction<R, S, C, P>) {
  return action;
};
