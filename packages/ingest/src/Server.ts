//stackpress
import type { 
  CallableMap, 
  CallableNest, 
  UnknownNest 
} from '@stackpress/types';
import { nest } from '@stackpress/types/dist/Nest';
import { map } from '@stackpress/types/dist/helpers';
//local
import type { 
  PluginLoaderOptions,
  RequestInitializer,
  ResponseInitializer,
  ServerHandler
} from './types';
import Router from './Router';
import Request from './Request';
import Response from './Response';
import { PluginLoader } from './Loader';

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
  //handler
  protected _handler: ServerHandler<C, R, S> = (_, __, res) => res;

  /**
   * Sets the request handler
   */
  public set handler(callback: ServerHandler<C, R, S>) {
    this._handler = callback;
  }

  /**
   * Sets up the plugin loader
   */
  public constructor(options: PluginLoaderOptions = {}) {
    super();
    this.config = nest();
    this.plugins = map();
    this.loader = new PluginLoader(options);
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
}