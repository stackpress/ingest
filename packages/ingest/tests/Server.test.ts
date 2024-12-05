import { describe, it } from 'mocha';
import { expect } from 'chai';

import Server from '../src/Server';
import Request from '../src/Request';
import Response from '../src/Response';

describe('Server Tests', () => {
  it('Should route to', async () => {
    const server = new Server();
    server.get('/some/route/path', (req, res) => {
      res.setBody('text/plain', `- ${req.data('foo')}`);
    });

    const req = new Request<unknown, Server>({ 
      method: 'GET',
      url: new URL('http://localhost/some/route/path') ,
      data: { foo: 'bar' }
    });
    const res = new Response();
    await server.routeTo('GET', '/some/route/path', req, res);
    expect(res.body).to.equal('- bar');
    const response1 = await server.routeTo('GET', '/some/route/path', { foo: 'baz' });
    expect(response1.results).to.equal('- baz');
    const response2 = await server.routeTo('GET', '/some/route/path');
    expect(response2.results).to.equal('- undefined');
  });

  it('Should call', async () => {
    const server = new Server();
    server.on('foo', (req, res) => {
      res.setBody('text/plain', `- ${req.data('foo')}`);
    });

    const req = new Request<unknown, Server>({ 
      method: 'GET',
      url: new URL('http://localhost/some/route/path') ,
      data: { foo: 'bar' }
    });
    const res = new Response();
    await server.call('foo', req, res);
    expect(res.body).to.equal('- bar');
    const response1 = await server.call('foo', { foo: 'baz' });
    expect(response1.results).to.equal('- baz');
    const response2 = await server.call('foo');
    expect(response2.results).to.equal('- undefined');
  });
})