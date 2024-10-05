import type { Method, RouteData } from './types';
import type Request from '../payload/Request';
import type Router from './Router';

import { routeParams } from '../helpers';
import Event from './Event';

export default class Route<A> extends Event<A> {
  //route method
  public readonly method: Method;
  //route path
  public readonly path: string;
  //The type of event
  public readonly type: string = 'route';

  /**
   * Returns the route params
   */
  public get params() {
    return routeParams(
      this.path, 
      this.req.url.pathname
    );
  }

  /**
   * Returns data in staging
   */
  public get stage() {
    return Object.assign({}, 
      this.req.query.get(), 
      this.params.params,
      this.req.post.get()
    );
  }

  /**
   * Sets the route info and the emitter context
   */
  constructor(emitter: Router<A>, req: Request, info: RouteData) {
    super(emitter, req, info);
    this.method = info.method;
    this.path = info.path;
  }
}