import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it } from 'mocha';
import { expect } from 'chai';

import BaseException from '@stackpress/lib/Exception';
import BaseRequest from '@stackpress/lib/Request';
import BaseResponse from '@stackpress/lib/Response';

//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Router from '../src/Router';
import Request from '../src/Request';
import Response from '../src/Response';
import Exception from '../src/Exception';

const fixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'get.ts'
);

function makeRequest(pathname = '/test') {
  return new Request({
    method: 'GET',
    url: new URL(`http://localhost${pathname}`)
  });
}

describe('Router Extension Tests', () => {
  it('should register the helper methods across each router extension', () => {
    const router = new Router();
    const entryMethods = [
      'all',
      'connect',
      'delete',
      'head',
      'options',
      'patch',
      'post',
      'put',
      'trace'
    ] as const;
    const importMethods = [
      'all',
      'connect',
      'delete',
      'head',
      'options',
      'patch',
      'post',
      'put',
      'trace'
    ] as const;
    const viewMethods = [
      'all',
      'connect',
      'delete',
      'head',
      'options',
      'patch',
      'post',
      'put',
      'trace'
    ] as const;

    //Sweep the helper methods once so coverage reflects that these aliases
    //all delegate into the same route registration path correctly.
    for (const method of entryMethods) {
      router.entry[method](`/entry-${method}`, fixturePath, 1);
    }

    for (const method of importMethods) {
      router.import[method](`/import-${method}`, () => import('./fixtures/get'),
        2);
    }

    for (const method of viewMethods) {
      router.view[method](`/view-${method}`, `./${method}.html`, 3);
    }

    router.entry.on(/^ENTRY-REGEX$/, fixturePath, 4);
    router.import.on(/^IMPORT-REGEX$/, () => import('./fixtures/get'), 5);
    router.view.on(/^VIEW-REGEX$/, './regex.html', 6);

    expect(router.entries.size).to.equal(entryMethods.length + 1);
    expect(router.imports.size).to.equal(importMethods.length + 1);
    expect(router.views.size).to.equal(viewMethods.length + 1);
  });

  it('should route entry handlers and record their priorities', async () => {
    const router = new Router();

    //Register the entry route through the public entry router extension.
    router.entry.get('/entry/path', fixturePath, 5);

    const response = new Response();
    await router.emit('GET /entry/path', makeRequest('/entry/path'), response);

    const event = router.action.eventName('GET', '/entry/path');
    const tasks = Array.from(router.entries.get(event) || []);

    expect(response.body).to.equal('/entry/path');
    expect(tasks).to.deep.equal([ { entry: fixturePath, priority: 5 } ]);
  });

  it('should route import handlers and record their priorities', async () => {
    const router = new Router();

    //Keep the import callback parameterless so Router delegates to the
    //import extension instead of the action router.
    router.import.get('/import/path', () => import('./fixtures/get'), 7);

    const response = new Response();
    await router.emit('GET /import/path', makeRequest('/import/path'),
      response);

    const event = router.action.eventName('GET', '/import/path');
    const tasks = Array.from(router.imports.get(event) || []);

    expect(response.body).to.equal('/import/path');
    expect(tasks).to.have.length(1);
    expect(tasks[0]?.priority).to.equal(7);
  });

  it('should route view handlers through the configured engine', async () => {
    const router = new Router();
    const rendered: string[] = [];

    //Capture the engine input so the test observes the view router boundary.
    router.view.engine = async (filePath, { req, res }) => {
      rendered.push(filePath);
      res.set('text/plain', `${filePath}:${req.url.pathname}`);
    };

    router.view.get('/view/path', './templates/example.html', 9);

    const response = new Response();
    await router.emit('GET /view/path', makeRequest('/view/path'), response);

    const event = router.action.eventName('GET', '/view/path');
    const tasks = Array.from(router.views.get(event) || []);

    expect(rendered).to.deep.equal([ './templates/example.html' ]);
    expect(response.body).to.equal('./templates/example.html:/view/path');
    expect(tasks).to.deep.equal([
      { entry: './templates/example.html', priority: 9 }
    ]);
  });

  it('should expose the view render getter and support missing engines', async () => {
    const router = new Router();

    //Read and write the render function directly because coverage there
    //comes from the view router accessors rather than route execution.
    router.view.render = (filePath) => filePath.toUpperCase();
    const rendered = router.view.render('./template.html');

    const action = router.view.action('GET /no-engine', './no-engine.html', 4);
    router.view.engine = undefined as never;
    await action(router.action.createProps(makeRequest('/no-engine'),
      new Response(), router));

    expect(rendered).to.equal('./TEMPLATE.HTML');
  });

  it('should merge extension maps with use()', async () => {
    const first = new Router();
    const second = new Router();

    first.entry.get('/merged/entry', fixturePath, 1);
    first.import.get('/merged/import', () => import('./fixtures/get'), 2);
    first.view.engine = async (filePath, { res }) => {
      res.set('text/plain', filePath);
    };
    first.view.get('/merged/view', './templates/merged.html', 3);

    second.use(first);

    const entryResponse = new Response();
    await second.emit('GET /merged/entry', makeRequest('/merged/entry'),
      entryResponse);

    const importResponse = new Response();
    await second.emit('GET /merged/import', makeRequest('/merged/import'),
      importResponse);

    const viewResponse = new Response();
    await second.emit('GET /merged/view', makeRequest('/merged/view'),
      viewResponse);

    expect(entryResponse.body).to.equal('/merged/entry');
    expect(importResponse.body).to.equal('/merged/import');
    expect(viewResponse.body).to.equal('./templates/merged.html');
  });

  it('should expose request, response, and exception wrappers as subclasses',
    () => {
      //Instantiate the wrappers directly so coverage includes the tiny
      //subclass modules instead of only touching them through imports.
      const request = new Request();
      const response = new Response();
      const exception = new Exception('Boom');

      expect(request).to.be.instanceOf(Request);
      expect(request).to.be.instanceOf(BaseRequest);
      expect(response).to.be.instanceOf(Response);
      expect(response).to.be.instanceOf(BaseResponse);
      expect(exception).to.be.instanceOf(Exception);
      expect(exception).to.be.instanceOf(BaseException);
    });
});
