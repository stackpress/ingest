import { describe, it } from 'mocha';
import { expect } from 'chai';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { UnknownNest } from '@stackpress/lib';

import Server from '../src/Server';
import Request from '../src/Request';
import Response from '../src/Response';
import { ServerGateway } from '../src/types';

describe('Server Tests', () => {
  /**
   * Tests the route handling functionality:
   * - Registering GET routes
   * - Handling requests with data
   * - Handling requests without data
   * - Response body formatting
   */
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
    const response1 = await server.routeTo('GET', '/some/route/path',
    { foo: 'baz' });
    expect(response1.results).to.equal('- baz');
    const response2 = await server.routeTo('GET', '/some/route/path');
    expect(response2.results).to.equal('- undefined');
  });

  /**
   * Tests the event handling system:
   * - Registering event handlers
   * - Handling events with data
   * - Handling events without data
   */
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
    const response1 = await server.call<string>('foo', { foo: 'baz' });
    expect(response1.results).to.equal('- baz');
    const response2 = await server.call<string>('foo');
    expect(response2.results).to.equal('- undefined');
  });

  /**
   * Tests the plugin system's registration and retrieval:
   * - Registering plugins with configuration
   * - Retrieving plugin configurations
   * - Type-safe plugin config retrieval
   */
  it('Should handle plugin registration and retrieval', () => {
    const server = new Server();
    const config = { foo: 'bar' };
    
    server.register('test-plugin', config);
    expect(server.plugin('test-plugin')).to.deep.equal(config);
    
    const typedConfig = server.plugin<{ foo: string }>('test-plugin');
    expect(typedConfig?.foo).to.equal('bar');
  });

  /**
   * Tests the plugin bootstrapping process:
   * - Plugin initialization
   * - Plugin configuration
   * - Bootstrap callback execution
   */
  it('Should bootstrap plugins', async () => {
    const server = new Server();
    const pluginConfig = { initialized: true };
    let called = false;
    
    const testPlugin = async () => {
      called = true;
      return pluginConfig;
    };
    
    server.loader.bootstrap = async (callback) => {
      await callback('test-plugin', testPlugin);
      return server.loader;
    };

    await server.bootstrap();
    
    expect(called).to.be.true;
    expect(server.plugin('test-plugin')).to.deep.equal(pluginConfig);
  });

  /**
   * Tests HTTP server instance creation:
   * - Server creation
   * - Basic server methods availability
   */
  it('Should create server instance', () => {
    const server = new Server();
    const httpServer = server.create();
    
    expect(typeof httpServer.listen).to.equal('function');
    expect(typeof httpServer.close).to.equal('function');
  });

  /**
   * Tests custom gateway and handler functionality:
   * - Custom gateway implementation
   * - Custom request handling
   * - Response type safety
   */
  it('Should handle custom gateway and handler', async () => {
    type CustomResponse = { custom: boolean };
    
    const customGateway = (server: Server<any, any, CustomResponse>) => {
      return (options: any) => createServer(options);
    };

    const customHandler = async (
      ctx: Server<any, any, CustomResponse>, 
      req: unknown, 
      res: unknown
    ): Promise<CustomResponse> => {
      return { custom: true };
    };

    const server = new Server<any, any, CustomResponse>({
      gateway: customGateway,
      handler: customHandler
    });

    const result = await server.handle({ custom: true }, { custom: true });
    expect(result).to.deep.equal({ custom: true });
  });

  /**
   * Tests request and response object creation:
   * - Request object initialization
   * - Response object initialization
   * - Status code handling
   * - Headers management
   */
  it('Should create request and response objects', () => {
    const server = new Server();
    
    const req = server.request({
      method: 'POST',
      url: new URL('http://localhost/test'),
      data: { test: true }
    });

    const res = server.response({
      headers: { 'content-type': 'application/json' }
    });
    res.setStatus(201);

    expect(req.method).to.equal('POST');
    expect(req.data('test')).to.be.true;
    expect(res.status).to.equal('Created');
    expect(res.headers.get('content-type')).to.equal('application/json');
  });

  /**
   * Tests configuration management:
   * - Setting configuration values
   * - Retrieving configuration values
   * - Nested configuration handling
   */
  it('Should handle config management', () => {
    const server = new Server();
    
    server.config.set('database', { url: 'mongodb://localhost' });
    server.config.set('api', { key: '123456' });

    expect(server.config.get('database')).to.deep.equal
    ({ url: 'mongodb://localhost' });
    const api = server.config.get('api') as { key: string };
    expect(api.key).to.equal('123456');
  });

  /**
   * Tests multiple route methods:
   * - GET, POST, PUT, DELETE handlers
   * - Method-specific behavior
   */
  it('Should handle different HTTP methods', async () => {
    const server = new Server();
    
    server.get('/test', (req, res) => {
      res.setBody('text/plain', 'GET');
    });
    server.post('/test', (req, res) => {
      res.setBody('text/plain', 'POST');
    });
    server.put('/test', (req, res) => {
      res.setBody('text/plain', 'PUT');
    });
    server.delete('/test', (req, res) => {
      res.setBody('text/plain', 'DELETE');
    });

    const getRes = await server.routeTo('GET', '/test');
    const postRes = await server.routeTo('POST', '/test');
    const putRes = await server.routeTo('PUT', '/test');
    const deleteRes = await server.routeTo('DELETE', '/test');

    expect(getRes.results).to.equal('GET');
    expect(postRes.results).to.equal('POST');
    expect(putRes.results).to.equal('PUT');
    expect(deleteRes.results).to.equal('DELETE');
  });

  /**
   * Tests the server gateway setter:
   * - Setting custom gateway
   * - Gateway functionality
   */
  it('Should set custom gateway', () => {
    const server = new Server();
    
    // Mock a minimal server implementation
    const mockServer = {
      listen: () => {},
      close: () => {},
      on: () => {},
      emit: () => {}
    };

    // Create a gateway that returns the mock server directly
    const customGateway: ServerGateway = () => mockServer as any;
    
    server.gateway = customGateway;
    const httpServer = server.create();
    
    expect(typeof httpServer.listen).to.equal('function');
  });

  /**
   * Tests the server handler setter:
   * - Setting custom handler
   * - Handler execution
   */
  it('Should set custom handler', async () => {
    const server = new Server();
    const customResponse = { handled: true };
    
    server.handler = async () => customResponse;
    const result = await server.handle({}, {});
    
    expect(result).to.deep.equal(customResponse);
  });

  /**
   * Tests request creation with different initializers:
   * - Empty initializer
   * - Partial initializer
   * - Full initializer
   */
  it('Should create requests with different initializers', () => {
    const server = new Server();
    
    const emptyReq = server.request();
    expect(emptyReq.method).to.equal('GET');
    
    const partialReq = server.request({ method: 'POST' });
    expect(partialReq.method).to.equal('POST');
    
    const fullReq = server.request({
      method: 'PUT',
      url: new URL('http://localhost/test'),
      data: { test: true }
    });
    expect(fullReq.method).to.equal('PUT');
    expect(fullReq.data('test')).to.be.true;
  });

  /**
   * Tests response creation with different initializers:
   * - Empty initializer
   * - Headers initializer
   */
  it('Should create responses with different initializers', () => {
    const server = new Server();
    
    const emptyRes = server.response();
    emptyRes.setStatus(200); // Set explicit OK status
    expect(emptyRes.status).to.equal('OK');
    
    const headerRes = server.response({
      headers: { 'content-type': 'application/json' }
    });
    expect(headerRes.headers.get('content-type')).to.equal('application/json');
  });

  /**
   * Tests plugin system with async configuration:
   * - Async plugin registration
   * - Configuration retrieval
   */
  it('Should handle async plugin configuration', async () => {
    const server = new Server();
    const asyncConfig = { async: true };
    
    const asyncPlugin = async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return asyncConfig;
    };
    
    server.loader.bootstrap = async (callback) => {
      await callback('async-plugin', asyncPlugin);
      return server.loader;
    };

    await server.bootstrap();
    expect(server.plugin('async-plugin')).to.deep.equal(asyncConfig);
  });
});