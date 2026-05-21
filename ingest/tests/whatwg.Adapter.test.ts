import { Readable } from 'node:stream';

import { describe, it } from 'mocha';
import { expect } from 'chai';

//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Server from '../src/Server';
import IngestRequest from '../src/Request';
import IngestResponse from '../src/Response';
import Adapter, {
  dispatcher,
  loader
} from '../src/whatwg/Adapter';
import { WhatwgResponse } from '../src/whatwg/helpers';

describe('whatwg Adapter', () => {
  it('should plug a request through the route lifecycle', async () => {
    const server = new Server();

    //Use a real server route so this test covers request loading,
    //Route.emit integration, and response dispatch together.
    server.get('/users/:id', ({ req, res }) => {
      res.set('application/json', {
        params: req.data.get(),
        body: req.body
      });
    });

    const resource = new globalThis.Request('http://localhost/users/42', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie: 'theme=dark'
      },
      body: 'role=admin'
    });

    const response = await Adapter.plug(server as never, resource,
      'GET /users/42');
    const payload = await response.json() as {
      code: number,
      status: string,
      results: Record<string, unknown>
    };

    expect(payload.code).to.equal(200);
    expect(payload.status).to.equal('OK');
    expect(payload.results.body).to.equal('role=admin');
    expect(payload.results.params).to.deep.equal({
      id: '42',
      role: 'admin'
    });
  });

  it('should build request objects with normalized url and parsed cookies',
    () => {
      const server = new Server();
      const resource = new globalThis.Request(
        'http://localhost//nested//path/?page=2',
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
            cookie: 'theme=dark; token=abc'
          }
        }
      );

      const adapter = new Adapter(server as never, resource);
      const request = adapter.request();

      expect(request.method).to.equal('PATCH');
      expect(request.mimetype).to.equal('application/json');
      expect(request.url.pathname).to.equal('/nested/path');
      expect(request.query.get()).to.deep.equal({ page: 2 });
      expect(request.session.get('theme')).to.equal('dark');
      expect(request.session.get('token')).to.equal('abc');
    });

  it('should build response objects with the whatwg dispatcher attached',
    async () => {
      const server = new Server();
      server.config.set('cookie', { path: '/', httpOnly: true });

      const resource = new globalThis.Request('http://localhost/response');
      const adapter = new Adapter(server as never, resource);
      const response = adapter.response();

      //Dispatch a simple payload to confirm the adapter wired the dispatcher.
      response.set('text/plain', 'ready');
      const resourceResponse = await response.dispatch();

      expect(resourceResponse).to.be.instanceOf(globalThis.Response);
      expect(await resourceResponse.text()).to.equal('ready');
    });

  it('should parse urlencoded form bodies using the request mimetype', async () => {
    const resource = new globalThis.Request('http://localhost/user', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: 'username=alice&password=secret'
    });

    const request = new IngestRequest({
      resource,
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      mimetype: 'application/x-www-form-urlencoded',
      url: new URL('http://localhost/user')
    });

    const result = await loader(resource)(request);

    expect(result?.body).to.equal('username=alice&password=secret');
    expect(result?.post).to.deep.equal({
      username: 'alice',
      password: 'secret'
    });
  });

  it('should skip loader work when the request body is already cached',
    async () => {
      const resource = new globalThis.Request('http://localhost/user', {
        method: 'POST',
        body: 'unused'
      });
      const request = new IngestRequest({
        body: 'cached',
        method: 'POST',
        mimetype: 'text/plain',
        resource,
        url: new URL('http://localhost/user')
      });

      const result = await loader(resource)(request);

      expect(result).to.equal(undefined);
      expect(request.body).to.equal('cached');
    });

  it('should dispatch plain string bodies with headers and status intact',
    async () => {
      const response = new IngestResponse();
      response.headers.set('x-test', 'yes');
      response.set('text/plain', 'hello', 201);

      const resource = await dispatcher()(response);

      expect(resource.status).to.equal(201);
      expect(resource.statusText).to.equal('Created');
      expect(resource.headers.get('content-type')).to.equal('text/plain');
      expect(resource.headers.get('x-test')).to.equal('yes');
      expect(await resource.text()).to.equal('hello');
    });

  it('should dispatch object bodies as json payloads', async () => {
    const response = new IngestResponse();
    response.results({ ok: true });

    const resource = await dispatcher()(response);
    const payload = await resource.json() as {
      code: number,
      status: string,
      results: { ok: boolean },
      total: number
    };

    expect(resource.headers.get('content-type'))
      .to.equal('application/json');
    expect(payload).to.deep.equal({
      code: 200,
      status: 'OK',
      results: { ok: true },
      total: 1
    });
  });

  it('should dispatch typed arrays and node streams without reshaping them',
    async () => {
      const binaryResponse = new IngestResponse();
      binaryResponse.set('application/octet-stream', new Uint8Array([
        65, 66, 67
      ]));

      const binaryResource = await dispatcher()(binaryResponse);
      const binaryText = await binaryResource.text();

      const streamResponse = new IngestResponse();
      streamResponse.set(
        'text/plain',
        Readable.from([ Buffer.from('streamed-content') ])
      );

      const streamedResource = await dispatcher()(streamResponse);
      const streamedText = await streamedResource.text();

      expect(binaryText).to.equal('ABC');
      expect(streamedText).to.equal('streamed-content');
    });

  it('should pass through existing whatwg responses unchanged', async () => {
    const response = new IngestResponse({
      resource: new WhatwgResponse('passthrough', { status: 202 })
    });

    const resource = await dispatcher()(response);

    expect(resource).to.equal(response.resource);
    expect(await resource.text()).to.equal('passthrough');
  });

  it('should encode error responses and cookie revisions', async () => {
    const response = new IngestResponse();

    //Use the public response APIs so the dispatcher sees the same state
    //it would receive from a real route handler.
    response.setError('Bad Request', { field: 'required' }, [], 400);
    response.session.set('token', 'abc');
    response.session.delete('legacy');

    const resource = await dispatcher({ path: '/', secure: true })(response);
    const payload = await resource.json() as {
      code: number,
      status: string,
      error: string,
      errors: Record<string, string>
    };

    expect(payload.code).to.equal(400);
    expect(payload.status).to.equal('Bad Request');
    expect(payload.error).to.equal('Bad Request');
    expect(payload.errors).to.deep.equal({ field: 'required' });
    expect(resource.headers.get('set-cookie')).to.contain('legacy=');
  });
});
