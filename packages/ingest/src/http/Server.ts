import type { ServerOptions } from 'http';
import type { IM, SR } from './helpers';
import type { BuildResult } from '../buildtime/types';
import type FileLoader from '../buildtime/filesystem/FileLoader';
import type TaskQueue from '../runtime/TaskQueue';

import http from 'http';
import Exception from '../Exception';
import StatusCode from '../runtime/StatusCode';
import Context from '../runtime/Context';
import Request from '../payload/Request';
import Response from '../payload/Response';
import { loader, dispatcher, imToURL } from './helpers';

export default class Server {
  //runtime context shareable to all endpoints
  public readonly context = new Context();

  /**
   * Sets up the server with the given manifest
   */
  public constructor(manifest: string, loader: FileLoader) {
    //check if the manifest exists
    if (!loader.fs.existsSync(manifest)) return;
    //get the manifest
    const contents = loader.fs.readFileSync(manifest, 'utf8');
    //parse the manifest
    const results = JSON.parse(contents) as BuildResult[];
    //make sure build is an array
    if (!Array.isArray(results)) return;
    //loop through the manifest
    results.forEach(({ pattern, entry, event }) => {
      const regex = pattern?.toString() || '';
      const listener = pattern ? new RegExp(
        // pattern,
        regex.substring(
          regex.indexOf('/') + 1,
          regex.lastIndexOf('/')
        ),
        // flag
        regex.substring(
          regex.lastIndexOf('/') + 1
        )
      ) : event;
      //and add the routes
      this.context.on(listener, async (req, res, ctx) => {
        const { queue } = await import(entry) as { queue: TaskQueue };
        await queue.run(req, res, ctx);
      });
    });
  }

  /**
   * Creates an HTTP server with the given options
   */
  public create(options: ServerOptions = {}) {
    return http.createServer(options, (im, sr) => this.handle(im, sr));
  }

  /**
   * 3. Runs the 'response' event and interprets
   */
  public async dispatch(req: Request, res: Response) {
    //emit a response event
    const status = await this.context.emit('response', req, res);
    //if the status was incomplete (308)
    return status.code !== StatusCode.ABORT.code;
  }

  /**
   * Handles a payload using events
   */
  public async emit(event: string, req: Request, res: Response) {
    //try to trigger request pre-processors
    if (!await this.prepare(req, res)) {
      //if the request exits, then stop
      return false;
    }
    // from here we can assume that it is okay to
    // continue with processing the routes
    if (!await this.process(event, req, res)) {
      //if the request exits, then stop
      return false;
    }
    //last call before dispatch
    if (!await this.dispatch(req, res)) {
      //if the dispatch exits, then stop
      return false;
    }
    //anything else?
    return true;
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
      await this.context.emit('error', req, res);
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
    const req = new Request();
    req.loader = loader(im);
    const res = new Response();
    res.dispatcher = dispatcher(sr);
    const event = im.method + ' ' + imToURL(im).pathname;
    return { event, req, res };
  }

  /**
   * 1. Runs the 'request' event and interprets
   */
  public async prepare(req: Request, res: Response) {
    const status = await this.context.emit('request', req, res);
    //if the status was incomplete (308)
    return status.code !== StatusCode.ABORT.code;
  }

  /**
   * 2. Runs the route event and interprets
   */
  public async process(event: string, req: Request, res: Response) {
    const status = await this.context.emit(event, req, res);
    //if the status was incomplete (308)
    if (status.code === StatusCode.ABORT.code) {
      //the callback that set that should have already processed
      //the request and is signaling to no longer continue
      return false;
    }

    //if no body and status code
    //NOTE: it's okay if there is no body as 
    //      long as there is a status code
    //ex. like in the case of a redirect
    if (!res.body && !res.code) {
      res.code = StatusCode.NOT_FOUND.code;
      throw Exception
        .for(StatusCode.NOT_FOUND.message)
        .withCode(StatusCode.NOT_FOUND.code);
    }

    //if no status was set
    if (!res.code || !res.status) {
      //make it okay
      res.code = StatusCode.OK.code;
      res.status = StatusCode.OK.message;
    }

    //if the status was incomplete (308)
    return status.code !== StatusCode.ABORT.code;
  }
}