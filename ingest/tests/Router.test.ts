import { describe, it } from 'mocha';
import { expect } from 'chai';

import type { Method } from '@stackpress/lib/types';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
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

  it('Should action route methods', async () => {
    const router = new Router();

    let tests = 0;
    for (const method of methods) {
      router.action[method]('/some/route/path', (req, res) => {
        res.setBody('text/plain', `${method} ${req.url.pathname}`);
      });
      const req = new Request({ 
        method: method.toUpperCase() as Method,
        url: new URL('http://localhost/some/route/path') 
      });
      const res = new Response();
      await router.action.emit(`${method.toUpperCase()} /some/route/path`, req, res);
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

  it('Should basic import route', async () => {
    const router = new Router();
    expect(router).to.be.instanceOf(Router);
    router.get(
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

  it('Should handle flexible routing types', async () => {
    const router = new Router();
    expect(router).to.be.instanceOf(Router);
    router.view.engine = function (filePath, req, res) {
      res.setBody('text/plain', filePath);
    }
    // Set up routes with different action types
    router.get('/view/path', './templates/view.html');
    router.get('/import/path', () => import('./fixtures/get'));
    router.get('/standard/path', (req, res) => {
      res.setBody('text/plain', 'standard response');
    });
  
    // Test view routing
    const viewRequest = new Request({
      method: 'GET',
      url: new URL('http://localhost/view/path')
    });
    const viewResponse = new Response();
    await router.emit('GET /view/path', viewRequest, viewResponse);
    expect(viewResponse.body).to.equal('./templates/view.html');
  
    // Test import routing
    const importRequest = new Request({
      method: 'GET',
      url: new URL('http://localhost/import/path')
    });
    const importResponse = new Response();
    await router.emit('GET /import/path', importRequest, importResponse);
    expect(importResponse.body).to.equal('/import/path');
  
    // Test standard routing
    const standardRequest = new Request({
      method: 'GET',
      url: new URL('http://localhost/standard/path')
    });
    const standardResponse = new Response();
    await router.emit('GET /standard/path', standardRequest, standardResponse);
    expect(standardResponse.body).to.equal('standard response');
  });
})