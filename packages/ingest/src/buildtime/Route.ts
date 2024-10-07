//framework
import type { ActionFile } from '../framework/types';
import FrameworkRoute from '../framework/Route';
//payload
import type Request from '../payload/Request';
import type Response from '../payload/Response';
//general
import { routeParams } from '../helpers';

export default class Route 
  extends FrameworkRoute<ActionFile, Request, Response> 
{
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
}