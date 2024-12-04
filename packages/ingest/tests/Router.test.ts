import { describe, it } from 'mocha';
import { expect } from 'chai';

import type { Method } from '@stackpress/types/dist/types';
import type { RouterEntry } from '../src/types';
import path from 'path';
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
    router.get('/some/route/path', path.join(__dirname, 'fixtures/get'));

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
      const route = router[method].bind(router) as (
        path: string, 
        action: RouterEntry<unknown, unknown, unknown>, priority?: number
      ) => Router<unknown, unknown, unknown>; 
      route('/some/route/path', path.join(__dirname, 'fixtures/any'));
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
    router.all('/some/route/path', path.join(__dirname, 'fixtures/any'));

    const req = new Request({ 
      method: 'POST',
      url: new URL('http://localhost/some/route/path') 
    });
    const res = new Response();
    await router.emit('POST /some/route/path', req, res);
    expect(res.body).to.equal(`POST /some/route/path`);
  })
})