import type { SoftRequest } from './types';
import EventEmitter from './EventEmitter';

import Request from '../payload/Request';
import Response from '../payload/Response';
import { isHash } from './helpers';

export default class Context extends EventEmitter {
  /**
   * Emits the event and returns the response body
   */
  public async call(event: string, req?: SoftRequest, res?: Response) {
    const data = isHash(req) ? req : {};
    //firgure out the request
    const request = typeof req === 'undefined' || isHash(req)
      ? new Request()
      : req as Request;
    request.data.set(data);
    //figure out the response
    const response = res || new Response();
    await this.emit(event, request, response);
    return response?.data.get() as Record<string, unknown>;
  }
}