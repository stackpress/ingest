import { describe, it } from 'mocha';
import { expect } from 'chai';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Router from '../src/Router.js';
import Server from '../src/Server.js';
import Request from '../src/Request.js';
import Response from '../src/Response.js';
import type { ActionRouteProps } from '../src/types.js';
import {
  All,
  Connect,
  Controller,
  Delete,
  Get,
  Head,
  On,
  Options,
  Patch,
  Post,
  Put,
  Trace,
  addEvent,
  addRoute,
  assertHandler,
  controllerOf,
  hasEvent,
  hasRoute,
  metadataOf,
  mount,
  normalizePath,
  registerEvent,
  registerRoute,
  routeDecorator
} from '../src/decorators.js';

type TestRouterProps = ActionRouteProps<
  unknown,
  unknown,
  Router,
  unknown,
  unknown
>;

type TestServerProps = ActionRouteProps<
  unknown,
  unknown,
  Server,
  unknown,
  unknown
>;

describe('Decorator Tests', () => {
  it('Should mount decorated controllers with helper', async () => {
    @Controller('/api')
    class UserController {
      @Get('/users')
      public list({ res }: TestRouterProps) {
        res.set('text/plain', 'list');
      }

      @Post('/users/:id')
      public create({ req, res }: TestRouterProps) {
        res.set('text/plain', `${req.data('id')}:create`);
      }

      @On('GET /api/users', 10)
      public auditList({ req, res }: TestRouterProps) {
        res.headers.set('x-list-path', req.url.pathname);
      }

      @On('POST /api/users/42', 10)
      public auditCreate({ req, res }: TestRouterProps) {
        res.headers.set('x-create-path', req.url.pathname);
      }
    }

    const router = new Router();
    mount(router, UserController);

    const getReq = new Request({
      method: 'GET',
      url: new URL('http://localhost/api/users')
    });
    const getRes = new Response();
    await router.emit('GET /api/users', getReq, getRes);

    const postReq = new Request({
      method: 'POST',
      url: new URL('http://localhost/api/users/42')
    });
    const postRes = new Response();
    await router.emit('POST /api/users/42', postReq, postRes);

    expect(getRes.body).to.equal('list');
    expect(getRes.headers.get('x-list-path')).to.equal('/api/users');
    expect(postRes.body).to.equal('42:create');
    expect(postRes.headers.get('x-create-path')).to.equal('/api/users/42');
  });

  it('Should mount decorated controller instances from router', async () => {
    @Controller('/admin')
    class AdminController {
      public prefix = 'panel';

      @Get('/dashboard')
      public dashboard({ res }: TestRouterProps) {
        res.set('text/plain', this.prefix);
      }
    }

    const router = new Router();
    router.mount(new AdminController());

    const req = new Request({
      method: 'GET',
      url: new URL('http://localhost/admin/dashboard')
    });
    const res = new Response();
    await router.emit('GET /admin/dashboard', req, res);

    expect(res.body).to.equal('panel');
  });

  it('Should mount multiple controllers on server', async () => {
    @Controller('/api')
    class UserController {
      @Get('/users')
      public list({ res }: TestServerProps) {
        res.set('text/plain', 'users');
      }
    }

    class HooksController {
      @On('GET /api/users')
      public hook({ res }: TestServerProps) {
        res.headers.set('x-hook', 'true');
      }
    }

    const server = new Server();
    server.mount(UserController, HooksController);

    const response = await server.resolve<string>('GET', '/api/users');
    expect(response.results).to.equal('users');

    const req = new Request({
      method: 'GET',
      url: new URL('http://localhost/api/users')
    });
    const res = new Response();
    await server.emit('GET /api/users', req, res);
    expect(res.headers.get('x-hook')).to.equal('true');
  });

  it('Should expose decorator helper utilities for direct mounting flows',
    async () => {
      class UtilityController {
        public prefix = 'utility';

        public route({ res }: TestRouterProps) {
          res.set('text/plain', this.prefix);
        }

        public event({ res }: TestRouterProps) {
          res.headers.set('x-utility', 'true');
        }
      }

      const metadata = metadataOf(UtilityController);
      addRoute(UtilityController, {
        method: 'GET',
        path: '/utility//path',
        property: 'route',
        priority: 4
      });
      addRoute(UtilityController, {
        method: 'GET',
        path: '/utility//path',
        property: 'route',
        priority: 4
      });
      addEvent(UtilityController, {
        event: 'GET /api/utility/path',
        property: 'event',
        priority: 6
      });
      addEvent(UtilityController, {
        event: 'GET /api/utility/path',
        property: 'event',
        priority: 6
      });

      const controller = controllerOf(UtilityController);
      const router = new Router();

      registerRoute(router, controller, '/api/', metadata.routes[0]);
      registerEvent(router, controller, metadata.events[0]);

      const req = new Request({
        method: 'GET',
        url: new URL('http://localhost/api/utility/path')
      });
      const res = new Response();
      await router.emit('GET /api/utility/path', req, res);

      expect(hasRoute(metadata, metadata.routes[0])).to.equal(true);
      expect(hasEvent(metadata, metadata.events[0])).to.equal(true);
      expect(normalizePath('/api/', '/utility//path')).to.equal(
        '/api/utility/path'
      );
      expect(res.body).to.equal('utility');
      expect(res.headers.get('x-utility')).to.equal('true');
    });

  it('Should reject non-function controller members when mounting', () => {
    const controller = { broken: 'nope' };

    expect(() => assertHandler(controller, 'broken')).to.throw(
      'Controller member "broken" is not a function'
    );
  });

  it('Should cover the remaining http method decorators', async () => {
    @Controller('/extra')
    class ExtraController {
      @All('/all')
      public all({ res }: TestRouterProps) {
        res.set('text/plain', 'all');
      }

      @Connect('/connect')
      public connect({ res }: TestRouterProps) {
        res.set('text/plain', 'connect');
      }

      @Delete('/delete')
      public remove({ res }: TestRouterProps) {
        res.set('text/plain', 'delete');
      }

      @Head('/head')
      public head({ res }: TestRouterProps) {
        res.set('text/plain', 'head');
      }

      @Options('/options')
      public options({ res }: TestRouterProps) {
        res.set('text/plain', 'options');
      }

      @Patch('/patch')
      public patch({ res }: TestRouterProps) {
        res.set('text/plain', 'patch');
      }

      @Put('/put')
      public put({ res }: TestRouterProps) {
        res.set('text/plain', 'put');
      }

      @Trace('/trace')
      public trace({ res }: TestRouterProps) {
        res.set('text/plain', 'trace');
      }
    }

    const router = new Router();
    mount(router, ExtraController);

    const expectations: Array<[ string, string, string ]> = [
      [ 'POST', '/extra/all', 'all' ],
      [ 'CONNECT', '/extra/connect', 'connect' ],
      [ 'DELETE', '/extra/delete', 'delete' ],
      [ 'HEAD', '/extra/head', 'head' ],
      [ 'OPTIONS', '/extra/options', 'options' ],
      [ 'PATCH', '/extra/patch', 'patch' ],
      [ 'PUT', '/extra/put', 'put' ],
      [ 'TRACE', '/extra/trace', 'trace' ]
    ];

    for (const [ method, pathname, body ] of expectations) {
      const req = new Request({
        method: method as 'POST',
        url: new URL(`http://localhost${pathname}`)
      });
      const res = new Response();
      await router.emit(`${method} ${pathname}`, req, res);
      expect(res.body).to.equal(body);
    }
  });

  it('Should support the standard decorator initializer path directly', () => {
    class StandardController {
      public handler() {
        return 'ok';
      }
    }

    let routeInitializer: ((this: StandardController) => void)|undefined;
    let eventInitializer: ((this: StandardController) => void)|undefined;

    routeDecorator('GET')('/standard', 3)(
      StandardController.prototype.handler,
      {
        addInitializer(callback) {
          routeInitializer = callback as (this: StandardController) => void;
        },
        kind: 'method',
        name: 'handler',
        static: false
      } as ClassMethodDecoratorContext
    );

    On('GET /standard', 5)(
      StandardController.prototype.handler,
      {
        addInitializer(callback) {
          eventInitializer = callback as (this: StandardController) => void;
        },
        kind: 'method',
        name: 'handler',
        static: false
      } as ClassMethodDecoratorContext
    );

    const controller = new StandardController();
    routeInitializer?.call(controller);
    eventInitializer?.call(controller);

    const metadata = metadataOf(StandardController);

    expect(metadata.routes).to.deep.equal([ {
      method: 'GET',
      path: '/standard',
      property: 'handler',
      priority: 3
    } ]);
    expect(metadata.events).to.deep.equal([ {
      event: 'GET /standard',
      property: 'handler',
      priority: 5
    } ]);
  });

  it('Should reject static standard decorator targets', () => {
    expect(() => routeDecorator('GET')('/bad')(
      () => void 0,
      {
        addInitializer() {
          return void 0;
        },
        kind: 'method',
        name: 'bad',
        static: true
      } as ClassMethodDecoratorContext
    )).to.throw('Decorator "bad" must be an instance method');

    expect(() => On('bad')(
      () => void 0,
      {
        addInitializer() {
          return void 0;
        },
        kind: 'method',
        name: 'bad',
        static: true
      } as ClassMethodDecoratorContext
    )).to.throw('Decorator "bad" must be an instance method');
  });
});
