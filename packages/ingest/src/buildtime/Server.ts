//modules
import type { ServerOptions as HTTPOptions } from 'http';
import path from 'path';
import http from 'http';
import * as cookie from 'cookie';
//stackpress
import type { Method } from '@stackpress/types/dist/types';
import StatusCode from '@stackpress/types/dist/StatusCode';
//common
import type { 
  IM, 
  SR, 
  CookieOptions,
  IMRequestInitializer,
  SRResponseInitializer 
} from '../types';
import Factory from '../Factory';
import Request from '../Request';
import Response from '../Response';
import { objectFromQuery } from '../helpers';
//runtime
import type { RouteAction } from '../runtime/http/types';
import Route, { loader, dispatcher } from '../runtime/http/Route';
//local
import type { 
  UnknownNest,
  ServerOptions
} from './types';
import Router from './Router';
import { imToURL } from './helpers';

export { loader, dispatcher };

export default class Server<C extends UnknownNest = UnknownNest> 
  extends Factory<C> 
{
  /**
   * Loads the plugins and returns the factory
   */
  public static async bootstrap<C extends UnknownNest = UnknownNest>(
    options: ServerOptions = {}
  ) {
    const factory = new Server<C>(options);
    return await factory.bootstrap();
  }

  //router to handle the requests
  public readonly router: Router;
  //body size
  protected _size: number;
  //cookie options
  protected _cookie: CookieOptions;
  //tsconfig path
  protected _tsconfig: string;

  /**
   * Sets up the emitter
   */
  public constructor(options: ServerOptions = {}) {
    //extract the router from the options
    const { 
      size = 0,
      cookie = { path: '/' }, 
      router = new Router(), 
      tsconfig,
      ...config 
    } = options;
    //factory constructor
    super({ key: 'build', ...config });
    //save router
    this.router = router;
    this._size = size;
    this._cookie = cookie;
    this._tsconfig = tsconfig || path.resolve(this.loader.cwd, 'tsconfig.json');
  }

  /**
   * Shortcut to all router
   */
  public all(path: string, entry: string, priority?: number) {
    this.router.all(path, entry, priority);
    return this;
  }

  /**
   * Shortcut to connect router
   */
  public connect(path: string, entry: string, priority?: number) {
    this.router.connect(path, entry, priority);
    return this;
  }

  /**
   * Creates an HTTP server with the given options
   */
  public create(options: HTTPOptions = {}) {
    return http.createServer(options, (im, sr) => this.handle(im, sr));
  }

  /**
   * Shortcut to delete router
   */
  public delete(path: string, entry: string, priority?: number) {
    this.router.delete(path, entry, priority);
    return this;
  }

  /**
   * Shortcut to get router
   */
  public get(path: string, entry: string, priority?: number) {
    this.router.get(path, entry, priority);
    return this;
  }

  /**
   * Handles fetch requests
   */
  public async handle(im: IM, sr: SR) {
    //get the sorted entries given the route
    const entries = this.router.entries(
      im.method || 'GET', 
      imToURL(im).pathname
    );
    //if no entries, return a server style 404
    if (!entries.size) {
      sr.statusCode = StatusCode.NOT_FOUND.code;
      sr.statusMessage = StatusCode.NOT_FOUND.status;
      return sr.end();
    }
    //loop through the entries. 
    //`path` is the route. 
    //`actions` are the entry file paths
    for (const [ path, actions ] of entries.entries() ) {
      //make a new task set
      const tasks = new Set<RouteAction>(
        //for each action, create a new task callback
        Array.from(actions).map(entry => async (req, res) => {
          //import the action
          const imports = await import(entry);
          //get the action callback
          const action = imports.default;
          //delete it from the require cache so it can be processed again
          delete require.cache[require.resolve(entry)];
          //now call the action
          return await action(req, res);
        })
      );
      //create a new route (with its own client plugins and bootstrap)
      const route = new Route({ size: this._size, cookie: this._cookie });
      //handle the route
      route.handle(path, tasks, im, sr);
    }
    return sr;
  }

  /**
   * Shortcut to head router
   */
  public head(path: string, entry: string, priority?: number) {
    this.router.head(path, entry, priority);
    return this;
  }

  /**
   * Shortcut to options router
   */
  public options(path: string, entry: string, priority?: number) {
    this.router.options(path, entry, priority);
    return this;
  }

  /**
   * Shortcut to patch router
   */
  public patch(path: string, entry: string, priority?: number) {
    this.router.patch(path, entry, priority);
    return this;
  }

  /**
   * Shortcut to post router
   */
  public post(path: string, entry: string, priority?: number) {
    this.router.post(path, entry, priority);
    return this;
  }

  /**
   * Shortcut to put router
   */
  public put(path: string, entry: string, priority?: number) {
    this.router.put(path, entry, priority);
    return this;
  }

  /**
   * Sets up the request
   */
  public request(init?: IMRequestInitializer<Server<C>>) {
    if (!init) {
      return new Request<Server<C>>({ context: this });
    }
    const im = init.resource;
    //set context
    init.context = this;
    //set method
    init.method = init.method 
      || (im.method?.toUpperCase() || 'GET') as Method;
    //set the type
    init.mimetype = init.mimetype 
      || im.headers['content-type'] 
      || 'text/plain';
    //set the headers
    init.headers = init.headers || Object.fromEntries(
      Object.entries(im.headers).filter(
        ([key, value]) => typeof value !== 'undefined'
      )
    ) as Record<string, string|string[]>;
    //set session
    init.session = init.session || cookie.parse(
      im.headers.cookie as string || ''
    ) as Record<string, string>;
    //set url
    const url = imToURL(im);
    init.url = init.url || imToURL(im);
    //set query
    init.query = init.query 
      || objectFromQuery(url.searchParams.toString());
    //make request
    const req = new Request<Server<C>>(init);
    const size = this.config<number>('server', 'bodySize') || this._size;
    req.loader = loader(im, size);
    return req;
  }

  /**
   * Sets up the response
   */
  public response(init?: SRResponseInitializer) {
    if (!init) {
      return new Response();
    }
    const sr = init.resource;
    const res = new Response(init);
    const cookie = this.config<CookieOptions>('cookie') || this._cookie;
    res.dispatcher = dispatcher(sr, cookie);
    return res;
  }

  /**
   * Shortcut to trace router
   */
  public trace(path: string, entry: string, priority?: number) {
    this.router.trace(path, entry, priority);
    return this;
  }
};

export function bootstrap<C extends UnknownNest = UnknownNest>(
  options: ServerOptions = {}
) {
  return Server.bootstrap<C>(options);
};

export function server<C extends UnknownNest = UnknownNest>(
  options: ServerOptions = {}
) {
  return new Server<C>(options);
};