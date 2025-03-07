//modules
import { createServer } from 'node:http';
//stackpress
import type { 
  CallableMap, 
  CallableNest, 
  UnknownNest 
} from '@stackpress/lib';
import map from '@stackpress/lib/dist/data/map';
import { nest } from '@stackpress/lib/dist/data/Nest';
//local
import type { 
  RequestInitializer,
  ResponseInitializer,
  ServerGateway,
  ServerHandler,
  ServerOptions,
  NodeServerOptions
} from './types';
import Router from './Router';
import Request from './Request';
import Response from './Response';
import { PluginLoader } from './Loader';
import { isHash } from './helpers';

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
  extends Router<R, S, Server<C, R, S>>
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
   * Returns a response object given the event and request
   */
  public async call<T = unknown>(
    event: string, 
    request?: Request<R, Server<C, R, S>>|Record<string, any>,
    response?: Response<S>
  ) {
    if (!request) {
      request = this.request();
    } else if (isHash(request)) {
      const data = request as Record<string, any>;
      request = this.request({ data });
    }
    const req = request as Request<R, Server<C, R, S>>;
    const res = response || this.response();
    await this.emit(event, req, res);  
    return res.toStatusResponse<T>();
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

  /**
   * Creates a new request
   */
  public request(init: Partial<RequestInitializer<R, Server<C, R, S>>> = {}) {
    init.context = this;
    return new Request<R, Server<C, R, S>>(init);
  }

  /**
   * Creates a new response
   */
  public response(init: Partial<ResponseInitializer<S>> = {}) {
    return new Response<S>(init);
  }

  /**
   * Routes to another route
   */
  public async routeTo(
    method: string, 
    path: string, 
    request?: Request<R, Server<C, R, S>>|Record<string, any>,
    response?: Response<S>
  ) {
    const event = `${method.toUpperCase()} ${path}`;
    return await this.call(event, request, response);  
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
>(ctx: Server<C, R, S>, req: R, res: S) {
  return res;
};