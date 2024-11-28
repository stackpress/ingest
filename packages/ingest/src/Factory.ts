import type { 
  Task, 
  CallableMap, 
  CallableNest, 
  UnknownNest 
} from '@stackpress/types';
import type { 
  RequestInitializer,
  ResponseInitializer,
  PluginLoaderOptions,
  FactoryEvents
} from './types';

import EventEmitter from '@stackpress/types/dist/EventEmitter';
import { nest } from '@stackpress/types/dist/Nest';
import { map } from '@stackpress/types/dist/helpers';

import Request from './Request';
import Response from './Response';
import { PluginLoader } from './Loader';

export default class Factory<C extends UnknownNest = UnknownNest> {
  public readonly config: CallableNest<C>;
  //event emitter
  public readonly emitter: EventEmitter<FactoryEvents>;
  //plugin loader
  public readonly loader: PluginLoader;
  //list of plugin configurations
  public readonly plugins: CallableMap;

  /**
   * Sets up the plugin loader
   */
  public constructor(options: PluginLoaderOptions) {
    this.config = nest();
    this.plugins = map();
    this.emitter = new EventEmitter();
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
   * Emits an event
   */
  public async emit(event: string, request: Request, response: Response) {
    return await this.emitter.emit(event, request, response);
  }

  /**
   * Adds an event listener
   */
  public on(
    event: string | RegExp, 
    action: Task<[Request, Response]>, 
    priority?: number
  ) {
    this.emitter.on(event, action, priority);
    return this;
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
  public request(init?: RequestInitializer) {
    return new Request(init);
  }

  /**
   * Creates a new response
   */
  public response(init?: ResponseInitializer) {
    return new Response(init);
  }
}