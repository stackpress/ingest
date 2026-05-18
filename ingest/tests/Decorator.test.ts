import { describe, it } from 'mocha';
import { expect } from 'chai';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Router from '../src/Router.js';
import Server from '../src/Server.js';
import Request from '../src/Request.js';
import Response from '../src/Response.js';
import type { ActionRouteProps } from '../src/types.js';
import { Controller, Get, On, Post, mount } from '../src/decorators.js';

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
        res.setBody('text/plain', 'list');
      }

      @Post('/users/:id')
      public create({ req, res }: TestRouterProps) {
        res.setBody('text/plain', `${req.data('id')}:create`);
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
        res.setBody('text/plain', this.prefix);
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
        res.setBody('text/plain', 'users');
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
});
