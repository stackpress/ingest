import { describe, it } from 'mocha';
import { expect } from 'chai';

import Status from '@stackpress/lib/Status';

//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Route from '../src/Route';
import Request from '../src/Request';
import Response from '../src/Response';

type TestRequest = Request<unknown>;
type TestResponse = Response<unknown>;
type EventHandler = (
  req: TestRequest,
  res: TestResponse
) => void | typeof Status.OK | Promise<void | typeof Status.OK>;
type RouteProps = {
  request: TestRequest,
  response: TestResponse,
  context: TestContext,
  req: TestRequest,
  res: TestResponse,
  ctx: TestContext
};

class TestContext {
  public readonly calls: string[] = [];
  protected readonly handlers = new Map<string, EventHandler>();

  public on(event: string, handler: EventHandler) {
    this.handlers.set(event, handler);
    return this;
  }

  public props(req: TestRequest, res: TestResponse): RouteProps {
    return {
      request: req,
      response: res,
      context: this,
      req,
      res,
      ctx: this
    };
  }

  public async emit(event: string, req: TestRequest, res: TestResponse) {
    this.calls.push(event);
    const handler = this.handlers.get(event);
    if (!handler) {
      return Status.OK;
    }

    const result = await handler(req, res);
    return result || Status.OK;
  }
}

function makeRequest(pathname = '/test') {
  return new Request({
    method: 'GET',
    url: new URL(`http://localhost${pathname}`)
  });
}

describe('Route Tests', () => {
  it('should stop when request hooks abort the lifecycle', async () => {
    const context = new TestContext().on('request', () => Status.ABORT);
    const route = new Route('GET /abort', makeRequest('/abort'),
      new Response(), context as never);

    //Confirm the request hook can short-circuit the lifecycle before
    //the route action or response hook is even considered.
    const result = await route.emit();

    expect(result).to.equal(false);
    expect(context.calls).to.deep.equal([ 'request' ]);
  });

  it('should dispatch string events through the context emitter', async () => {
    const context = new TestContext()
      .on('GET /users/42', (req, res) => {
        //Make the route observable through the public response object.
        res.set('text/plain', `${req.method} ${req.url.pathname}`);
      });
    const response = new Response();
    const route = new Route(
      'GET /users/42',
      makeRequest('/users/42'),
      response,
      context as never
    );

    const result = await route.process();

    expect(result).to.equal(true);
    expect(response.body).to.equal('GET /users/42');
    expect(response.code).to.equal(200);
    expect(response.status).to.equal('OK');
  });

  it('should dispatch function events through canonical props', async () => {
    const context = new TestContext();
    const response = new Response();
    const route = new Route(
      ({ req, res, request, response, ctx, context }: RouteProps) => {
        //Check the canonical aliases first so this test covers the exact
        //props shape that production handlers receive.
        expect(req).to.equal(request);
        expect(res).to.equal(response);
        expect(ctx).to.equal(context);
        res.set('text/plain', req.url.pathname);
      },
      makeRequest('/props'),
      response,
      context as never
    );

    const result = await route.process();

    expect(result).to.equal(true);
    expect(response.body).to.equal('/props');
  });

  it('should convert empty route results into not found responses', async () => {
    const context = new TestContext()
      .on('noop', () => void 0)
      .on('error', (_req, res) => {
        //Let the error pipeline tag the response the same way a plugin would.
        res.headers.set('x-error-hook', 'called');
      });
    const response = new Response();
    const route = new Route('noop', makeRequest('/missing'), response,
      context as never);

    const result = await route.process();

    expect(result).to.equal(true);
    expect(response.code).to.equal(404);
    expect(response.status).to.equal('Not Found');
    expect(response.error).to.equal('Not Found');
    expect(response.headers.get('x-error-hook')).to.equal('called');
    expect(context.calls).to.deep.equal([ 'noop', 'error' ]);
  });

  it('should route thrown errors through the error event handler', async () => {
    const context = new TestContext()
      .on('request', () => void 0)
      .on('response', () => void 0)
      .on('error', (_req, res) => {
        //Mark the response so we know the route used the error pipeline.
        res.headers.set('x-caught', 'true');
      });
    const response = new Response();
    const route = new Route(
      () => {
        throw new Error('Boom');
      },
      makeRequest('/boom'),
      response,
      context as never
    );

    const result = await route.emit();

    expect(result).to.equal(true);
    expect(response.code).to.equal(500);
    expect(response.error).to.equal('Boom');
    expect(response.headers.get('x-caught')).to.equal('true');
    expect(context.calls).to.deep.equal([ 'request', 'error', 'response' ]);
  });

  it('should stop during shutdown when response hooks abort', async () => {
    const context = new TestContext()
      .on('response', () => Status.ABORT);
    const response = new Response();
    response.set('text/plain', 'done');
    const route = new Route('GET /done', makeRequest('/done'), response,
      context as never);

    const result = await route.shutdown();

    expect(result).to.equal(false);
    expect(context.calls).to.deep.equal([ 'response' ]);
  });

  it('should expose the static emit helper', async () => {
    const context = new TestContext()
      .on('GET /static', (_req, res) => {
        res.set('text/plain', 'static');
      });
    const response = new Response();

    const result = await Route.emit(
      'GET /static',
      makeRequest('/static'),
      response,
      context as never
    );

    expect(result).to.equal(true);
    expect(response.body).to.equal('static');
  });

  it('should stop the full emit flow when process aborts after an error',
    async () => {
      const context = new TestContext()
        .on('request', () => void 0)
        .on('error', () => Status.ABORT);
      const route = new Route(
        () => {
          throw new Error('Abort me');
        },
        makeRequest('/abort-process'),
        new Response(),
        context as never
      );

      const result = await route.emit();

      expect(result).to.equal(false);
      expect(context.calls).to.deep.equal([ 'request', 'error' ]);
    });

  it('should stop the full emit flow when shutdown aborts', async () => {
    const context = new TestContext()
      .on('request', () => void 0)
      .on('GET /shutdown-abort', (_req, res) => {
        res.set('text/plain', 'ready');
      })
      .on('response', () => Status.ABORT);
    const route = new Route(
      'GET /shutdown-abort',
      makeRequest('/shutdown-abort'),
      new Response(),
      context as never
    );

    const result = await route.emit();

    expect(result).to.equal(false);
    expect(context.calls).to.deep.equal([
      'request',
      'GET /shutdown-abort',
      'response'
    ]);
  });

  it('should route prepare and shutdown hook failures through the error flow',
    async () => {
      const prepareContext = new TestContext()
        .on('request', () => {
          throw new Error('prepare');
        })
        .on('error', () => void 0);
      const prepareResponse = new Response();
      const prepareRoute = new Route('GET /prepare', makeRequest('/prepare'),
        prepareResponse, prepareContext as never);

      const prepareResult = await prepareRoute.prepare();

      const shutdownContext = new TestContext()
        .on('response', () => {
          throw new Error('shutdown');
        })
        .on('error', () => void 0);
      const shutdownResponse = new Response();
      shutdownResponse.set('text/plain', 'done');
      const shutdownRoute = new Route('GET /shutdown', makeRequest('/shutdown'),
        shutdownResponse, shutdownContext as never);

      const shutdownResult = await shutdownRoute.shutdown();

      expect(prepareResult).to.equal(true);
      expect(prepareResponse.error).to.equal('prepare');
      expect(shutdownResult).to.equal(true);
      expect(shutdownResponse.error).to.equal('shutdown');
    });
});
