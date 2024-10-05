import type { ServerOptions } from 'http';
import type { ActionFile } from '../event/types';
import type { IM, SR } from '../http/types';

import http from 'http';
import cookie from 'cookie';
import AbstractServer from '../event/Server';
import Request from '../payload/Request';
import Response from '../payload/Response';
import { loader, dispatcher, imToURL } from '../http/helpers';
import { objectFromQuery } from '../helpers';

export default class Server extends AbstractServer<ActionFile, IM, SR> {
  /**
   * Creates an HTTP server with the given options
   */
  public create(options: ServerOptions = {}) {
    return http.createServer(options, (im, sr) => this.handle(im, sr));
  }

  /**
   * Handles fetch requests
   */
  public async handle(im: IM, sr: SR) {
    //initialize the request
    const { event, req, res } = await this.initialize(im, sr);
    try { //to load the body
      await req.load();
      //then try to emit the event
      await this.emit(event, req, res);
    } catch(e) {
      const error = e as Error;
      res.code = res.code && res.code !== 200 
        ? res.code: 500;
      res.status = res.status && res.status !== 'OK' 
        ? res.status : error.message;
      //let middleware contribute after error
      await this.emitter.emit('error', req, res, this.cache);
    }
    //if the response was not sent by now,
    if (!res.sent) {
      //send the response
      res.dispatch();
    }
    return sr;
  }

  /**
   * Sets up the request, response and determines the event
   */
  public async initialize(im: IM, sr: SR) {
    //set the type
    const mimetype = im.headers['content-type'] || 'text/plain';
    //set the headers
    const headers = Object.fromEntries(
      Object.entries(im.headers).filter(
        ([key, value]) => typeof value !== 'undefined'
      )
    ) as Record<string, string|string[]>;
    //set session
    const session = cookie.parse(im.headers.cookie as string || '');
    //set url
    const url = imToURL(im);
    //set query
    const query = objectFromQuery(url.searchParams.toString());

    const req = new Request({
      mimetype,
      headers,
      url,
      query,
      session
    });
    req.loader = loader(im);
    const res = new Response();
    res.dispatcher = dispatcher(sr);
    const event = im.method + ' ' + imToURL(im).pathname;
    return { event, req, res };
  }
}