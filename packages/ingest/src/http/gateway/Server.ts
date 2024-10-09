//modules
import type { ServerOptions } from 'http';
import http from 'http';
//filesystem
import type FileLoader from '../../filesystem/FileLoader';
//framework
import Status from '../../framework/Status';
//buildtime
import type { BuildResult } from '../../buildtime/types';
//gateway
import type { IM, SR, GatewayAction } from './types';
import Router from './Router';
import { imToURL } from '../helpers';

/**
 * Server per endpoint
 */
export default class Gateway {
  //router to handle the requests
  public readonly router = new Router();

  /**
   * Sets up the emitter
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
    results.forEach(({ type, event, pattern, method, route, entry }) => {
      //transform the action file to an action callback
      const action = async (req: IM, res: SR) => {
        //the action here is from the bundled actions that looks like
        //function GET(request: IM, response: IM, route: GatewayRoute)
        const { 'default': action } = await import(entry) as { 
          default: GatewayAction
        };
        await action(req, res);
      };
      //if it's a route
      if (type === 'endpoint') {
        //we use the route() instead of the on()
        //this is so we know what to extract from the url
        return this.router.route(method, route, action as GatewayAction);
      }
      //it's an event
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
      this.router.on(listener, action as GatewayAction);
    });
  }

  /**
   * Creates an HTTP server with the given options
   */
  public create(options: ServerOptions = {}) {
    return http.createServer(options, async (im, sr) => {
      const event = im.method + ' ' + imToURL(im).pathname;
      await this.router.emit(event, im, sr);

      if (!sr.headersSent) {
        sr.statusCode = Status.NOT_FOUND.code;
        sr.statusMessage = Status.NOT_FOUND.message;
        sr.setHeader('Content-Type', 'text/plain');
        sr.end(`${Status.NOT_FOUND.code} ${Status.NOT_FOUND.message}`);
      }
    });
  }
}