//modules
import { createServer } from 'node:http';
//stackpress
import type { 
  CallableMap, 
  CallableNest, 
  UnknownNest 
} from '@stackpress/lib';
import map from '@stackpress/lib/map';
import { nest } from '@stackpress/lib/Nest';
//local
import type { 
  ServerAction,
  ServerGateway,
  ServerHandler,
  ServerOptions,
  NodeServerOptions
} from './types.js';
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
  //configuration map
  C extends UnknownNest = UnknownNest, 
  //request resource
  R = unknown, 
  //response resource
  S = unknown
> 
  extends Router<R, S>
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
  protected _handler: ServerHandler<C, R, S>;

  /**
   * Sets the request handler
   */
  public set gateway(callback: ServerGateway) {
    this._gateway = callback;
  }

  /**
   * Sets the request handler
   */
  public set handler(callback: ServerHandler<C, R, S>) {
    this._handler = callback;
  }

  /**
   * Sets up the plugin loader
   */
  public constructor(options: ServerOptions<C, R, S> = {}) {
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
   * Gets the plugin by name
   */
  public plugin<T = Record<string, any> | undefined>(name: string) {
    return this.plugins.get(name) as T;
  }

  /**
   * Registers a plugin
   */
  public register(name: string, config: Record<string, any>) {
    this.plugins.set(name, config);
    return this;
  }
};

/**
 * Default server gateway
 */
export function gateway<
  C extends UnknownNest = UnknownNest, 
  R = unknown, 
  S = unknown
>(server: Server<C, R, S>) {
  return (options: NodeServerOptions) => createServer(
    options, 
    (im, sr) => server.handle(im as R, sr as S)
  );
};

/**
 * Default server request handler
 */
export async function handler<
  C extends UnknownNest = UnknownNest, 
  R = unknown, 
  S = unknown
>(_ctx: Server<C, R, S>, _req: R, res: S) {
  return res;
};

/**
 * Default server factory
 */
export function server<C extends UnknownNest = any>(
  //Any: Server<UnknownNest> not assignable to type HttpServer<Config>
  //Any: Type unknown is not assignable to type IncomingMessage
  //Any: Type unknown is not assignable to type ServerResponse
  options: ServerOptions<C, any, any> = {}
) {
  options.gateway = options.gateway || gateway;
  options.handler = options.handler || handler;
  //Any: Type unknown is not assignable to type IncomingMessage
  //Any: Type unknown is not assignable to type ServerResponse
  return new Server<C, any, any>(options);
};

/**
 * Default router factory
 */
export function router() {
  //Any: Type unknown is not assignable to type IncomingMessage
  //Any: Type unknown is not assignable to type ServerResponse
  return new Router<any, any>();
}

/**
 * Just a pass along to imply the types 
 * needed for the action arguments
 */
export function action<
  //config map
  //Any: Server<UnknownNest> not assignable to type HttpServer<Config>
  C extends UnknownNest = any, 
  //request resource
  //Any: Type unknown is not assignable to type IncomingMessage
  R = any, 
  //response resource
  //Any: Type unknown is not assignable to type ServerResponse
  S = any
>(action: ServerAction<C, R, S>) {
  return action;
};