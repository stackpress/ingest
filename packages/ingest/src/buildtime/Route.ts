import type { Method } from '../runtime/types';
import Router from './Router';

/**
 * Single route handler
 */
export default class Route {
  /**
   * The event string that will be hanndled
   */
  protected event: string;

  /**
   * The router to work with
   */
  protected router: Router;
  
  /**
   * Sets the route path we are working with
   */
  public constructor(event: string, router: Router) {
    this.event = event;
    this.router = router;
  }

  /**
   * Listens for all requests matching path
   */
  public all(entry: string, priority?: number) {
    return this.on('[A-Z]+', entry, priority);
  }

  /**
   * Listens for CONNECT requests matching path
   */
  public connect(entry: string, priority?: number) {
    return this.on('CONNECT', entry, priority);
  }

  /**
   * Listens for DELETE requests matching path
   */
  public delete(entry: string, priority?: number) {
    return this.on('DELETE', entry, priority);
  }

  /**
   * Listens for GET requests matching path
   */
  public get(entry: string, priority?: number) {
    return this.on('GET', entry, priority);
  }

  /**
   * Listens for HEAD requests matching path
   */
  public head(entry: string, priority?: number) {
    return this.on('HEAD', entry, priority);
  }

  /**
   * Transform the route into an event
   */
  public on(method: Method|'[A-Z]+', entry: string, priority?: number) {
    //convert path to a regex pattern
    const pattern = this.event
      //replace the :variable-_name01
      .replace(/(\:[a-zA-Z0-9\-_]+)/g, '*')
      //replace the stars
      //* -> ([^/]+)
      //@ts-ignore Property 'replaceAll' does not exist on type 'string'
      //but it does exist according to MDN...
      .replaceAll('*', '([^/]+)')
      //** -> ([^/]+)([^/]+) -> (.*)
      .replaceAll('([^/]+)([^/]+)', '(.*)');

    //now form the event pattern
    const event = new RegExp(`^${method}\\s${pattern}/*$`, 'ig');
    this.router.routes.set(event.toString(), {
      method: method === '[A-Z]+' ? 'ALL' : method,
      route: this.event
    });
    //add to tasks
    this.router.on(event, entry, priority);
    return this;
  }

  /**
   * Listens for OPTIONS requests matching path
   */
  public options(entry: string, priority?: number) {
    return this.on('OPTIONS', entry, priority);
  }

  /**
   * Listens for PATCH requests matching path
   */
  public patch(entry: string, priority?: number) {
    return this.on('PATCH', entry, priority);
  }

  /**
   * Listens for POST requests matching path
   */
  public post(entry: string, priority?: number) {
    return this.on('POST', entry, priority);
  }

  /**
   * Listens for PUT requests matching path
   */
  public put(entry: string, priority?: number) {
    return this.on('PUT', entry, priority);
  }

  /**
   * Listens for TRACE requests matching path
   */
  public trace(entry: string, priority?: number) {
    return this.on('TRACE', entry, priority);
  }
}