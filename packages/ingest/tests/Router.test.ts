import { describe, it } from 'mocha';
import { expect } from 'chai';

import type { Method } from '@stackpress/lib/dist/types';
import path from 'path';
import type { RouterImport } from '../src/types';
import Router from '../src/Router';
import Request from '../src/Request';
import Response from '../src/Response';

type method = 'all' 
  | 'connect' | 'delete'  | 'get' 
  | 'head'    | 'options' | 'patch' 
  | 'post'    | 'put'     | 'trace';

const methods: method[] = [
  'connect', 'delete',  'get', 
  'head',    'options', 'patch',  
  'post',    'put',     'trace'
];

describe('Router Tests', () => {
  it('Should basic route', async () => {
    const router = new Router();
    expect(router).to.be.instanceOf(Router);
    router.get('/some/route/path', (req, res) => {
      res.setBody('text/plain', req.url.pathname);
    });

    const req = new Request({ 
      method: 'GET',
      url: new URL('http://localhost/some/route/path') 
    });
    const res = new Response();
    await router.emit('GET /some/route/path', req, res);
    expect(res.body).to.equal('/some/route/path');
  })

  it('Should route methods', async () => {
    const router = new Router();

    let tests = 0;
    for (const method of methods) {
      router[method]('/some/route/path', (req, res) => {
        res.setBody('text/plain', `${method} ${req.url.pathname}`);
      });
      const req = new Request({ 
        method: method.toUpperCase() as Method,
        url: new URL('http://localhost/some/route/path') 
      });
      const res = new Response();
      await router.emit(`${method.toUpperCase()} /some/route/path`, req, res);
      expect(res.body).to.equal(`${method} /some/route/path`);
      tests++;
    }
    expect(tests).to.equal(methods.length);
  })

  it('Should route ALL', async () => {
    const router = new Router();
    expect(router).to.be.instanceOf(Router);
    router.all('/some/route/path', (req, res) => {
      res.setBody('text/plain', req.url.pathname);
    });

    const req = new Request({ 
      method: 'POST',
      url: new URL('http://localhost/some/route/path') 
    });
    const res = new Response();
    await router.emit('POST /some/route/path', req, res);
    expect(res.body).to.equal('/some/route/path');
  })

  it('Should basic entry route', async () => {
    const router = new Router();
    expect(router).to.be.instanceOf(Router);
    router.withEntries.get(
      '/some/route/path', 
      path.join(__dirname, 'fixtures/get')
    );

    const req = new Request({ 
      method: 'GET',
      url: new URL('http://localhost/some/route/path') 
    });
    const res = new Response();
    await router.emit('GET /some/route/path', req, res);
    expect(res.body).to.equal('/some/route/path');
  })

  it('Should route entry methods', async () => {
    const router = new Router();

    let tests = 0;
    for (const method of methods) {
      const entries = router.withEntries;
      const route = entries[method].bind(entries) as (
        path: string, 
        action: string, 
        priority?: number
      ) => Router<unknown, unknown, unknown>; 
      route(
        '/some/route/path', 
        path.join(__dirname, 'fixtures/any')
      );
      const METHOD = method.toUpperCase() as Method;
      const req = new Request({ 
        method: METHOD,
        url: new URL('http://localhost/some/route/path') 
      });
      const res = new Response();
      await router.emit(`${METHOD} /some/route/path`, req, res);
      expect(res.body).to.equal(`${METHOD} /some/route/path`);
      tests++;
    }
    expect(tests).to.equal(methods.length);
  })

  it('Should basic import route', async () => {
    const router = new Router();
    expect(router).to.be.instanceOf(Router);
    router.withImports.get(
      '/some/route/path', 
      () => import('./fixtures/get')
    );

    const req = new Request({ 
      method: 'GET',
      url: new URL('http://localhost/some/route/path') 
    });
    const res = new Response();
    await router.emit('GET /some/route/path', req, res);
    expect(res.body).to.equal('/some/route/path');
  })

  it('Should route import methods', async () => {
    const router = new Router();

    let tests = 0;
    for (const method of methods) {
      const imports = router.withImports;
      const route = imports[method].bind(imports) as (
        path: string, 
        action: RouterImport, 
        priority?: number
      ) => Router<unknown, unknown, unknown>; 
      route(
        '/some/route/path', 
        () => import('./fixtures/any')
      );
      const METHOD = method.toUpperCase() as Method;
      const req = new Request({ 
        method: METHOD,
        url: new URL('http://localhost/some/route/path') 
      });
      const res = new Response();
      await router.emit(`${METHOD} /some/route/path`, req, res);
      expect(res.body).to.equal(`${METHOD} /some/route/path`);
      tests++;
    }
    expect(tests).to.equal(methods.length);
  })

  it('Should route entry ALL', async () => {
    const router = new Router();
    expect(router).to.be.instanceOf(Router);
    router.withEntries.all(
      '/some/route/path', 
      path.join(__dirname, 'fixtures/any')
    );

    const req = new Request({ 
      method: 'POST',
      url: new URL('http://localhost/some/route/path') 
    });
    const res = new Response();
    await router.emit('POST /some/route/path', req, res);
    expect(res.body).to.equal(`POST /some/route/path`);
  })

  it('Should handle route parameters correctly', async () => {
    const router = new Router();
    router.get('/users/:id/posts/:postId', (req, res) => {
      res.setBody('application/json', {
        params: req.data.get(),
        path: req.url.pathname
      });
    });

    const req = new Request({ 
      method: 'GET',
      url: new URL('http://localhost/users/123/posts/456') 
    });
    const res = new Response();
    await router.emit('GET /users/123/posts/456', req, res);
    
    const body = res.body as { params: any, path: string };
    expect(body.params).to.deep.equal({
      id: '123',
      postId: '456'
    });
    expect(body.path).to.equal('/users/123/posts/456');
  });

  it('Should handle wildcard routes correctly', async () => {
    const router = new Router();
    router.get('/files/**', (req, res) => {
      res.setBody('application/json', {
        params: req.data.get(),
        path: req.url.pathname
      });
    });

    const req = new Request({ 
      method: 'GET',
      url: new URL('http://localhost/files/images/avatar.png') 
    });
    const res = new Response();
    await router.emit('GET /files/images/avatar.png', req, res);
    
    const body = res.body as { params: any, path: string };
    expect(body.path).to.equal('/files/images/avatar.png');
  });

  it('Should handle route priority correctly', async () => {
    const router = new Router();
    const calls: string[] = [];

    // Lower priority (1) route
    router.get('/api/resource', (req, res) => {
      calls.push('low');
    }, 1);

    // Higher priority (2) route
    router.get('/api/resource', (req, res) => {
      calls.push('high');
    }, 2);

    const req = new Request({ 
      method: 'GET',
      url: new URL('http://localhost/api/resource') 
    });
    const res = new Response();
    await router.emit('GET /api/resource', req, res);
    
    // Higher priority should execute first
    expect(calls).to.deep.equal(['high', 'low']);
  });

  it('Should handle router chaining with use() correctly', async () => {
    const router1 = new Router();
    const router2 = new Router();

    router1.get('/api/v1/test', (req, res) => {
      res.setBody('text/plain', 'router1');
    });

    router2.use(router1);
    
    const req = new Request({ 
      method: 'GET',
      url: new URL('http://localhost/api/v1/test') 
    });
    const res = new Response();
    await router2.emit('GET /api/v1/test', req, res);
    
    expect(res.body).to.equal('router1');
  });

  it('Should handle entry file caching correctly', async () => {
    const uncachedRouter = new Router(false);
    const cachedRouter = new Router(true);

    uncachedRouter.withEntries.get(
      '/test', 
      path.join(__dirname, 'fixtures/get')
    );
    cachedRouter.withEntries.get(
      '/test', 
      path.join(__dirname, 'fixtures/get')
    );

    const req = new Request({ 
      method: 'GET',
      url: new URL('http://localhost/test') 
    });
    const res1 = new Response();
    const res2 = new Response();

    await uncachedRouter.emit('GET /test', req, res1);
    await cachedRouter.emit('GET /test', req, res2);

    expect(res1.body).to.equal(res2.body);
    expect(uncachedRouter.withEntries.cache).to.be.false;
    expect(cachedRouter.withEntries.cache).to.be.true;
  });
})