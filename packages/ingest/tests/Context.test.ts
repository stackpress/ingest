import { describe, it } from 'mocha';
import { expect } from 'chai';
import Request from '../src/Request';
import RequestContext from '../src/Context';

describe('Context Tests', () => {
  it('Should initialize', () => {
    const request = new Request({
      method: 'POST',
      url: 'http://localhost/foo/bar?bar=zoo',
      mimetype: 'text/json',
      body: { foo: 'bar' },
      headers: { 'Content-Type': 'text/json' },
      session: { foo: 'bar' },
      data: { foo: 'bar' },
      post: { foo: 'bar' },
    });
    const context = request.fromRoute('/foo/:name');

    expect(context.method).to.equal('POST');
    expect(context.url.href).to.equal('http://localhost/foo/bar?bar=zoo');
    
    expect(context.mimetype).to.equal('text/json');
    expect(context.type).to.equal('object');
    expect((context.body as Record<string, any>)?.foo).to.contain('bar');

    expect(context.headers.size).to.equal(1);
    expect(context.session.size).to.equal(1);

    expect(context.data.size).to.equal(3);
    expect(context.query.size).to.equal(1);
    expect(context.post.size).to.equal(1);

    expect(context.data('name')).to.equal('bar');
    expect(context.data('foo')).to.equal('bar');
    expect(context.query('bar')).to.equal('zoo');
    expect(context.post('foo')).to.equal('bar');
  });

  it('Should sync', () => {
    const request = new Request({
      method: 'POST',
      url: 'http://localhost/foo/bar?bar=zoo',
      mimetype: 'text/json',
      body: { foo: 'bar' },
      headers: { 'Content-Type': 'text/json' },
      session: { foo: 'bar' },
      data: { foo: 'bar' },
      post: { foo: 'bar' },
    });
    const context = request.fromRoute('/foo/:name');

    context.query.set('blah', 'zeh');
    expect(context.query('blah')).to.equal('zeh');
    expect(request.query('blah')).to.equal('zeh');

    context.post.set('blah', 'zeh');
    expect(context.post('blah')).to.equal('zeh');
    expect(request.post('blah')).to.equal('zeh');

    context.data.set('blah', 'zeh');
    expect(context.data('blah')).to.equal('zeh');
    expect(request.data('blah')).to.equal('zeh');
  });

  it('Should initialize with different argument types', () => {
    const request = new Request({
      method: 'GET',
      url: 'http://localhost/test/arg1/arg2',
      data: { existingKey: 'existingValue' }
    });

    // Test with Set arguments
    const setArgs = new Set(['arg1', 'arg2']);
    let context = request.fromRoute('/test/*/**');
    expect(context.args.has('arg1')).to.be.true;
    expect(context.args.has('arg2')).to.be.true;

    // Test with Array arguments
    request.url.pathname = '/test/arg3/arg4';
    context = request.fromRoute('/test/*/**');
    expect(context.args.has('arg3')).to.be.true;
    expect(context.args.has('arg4')).to.be.true;

    // Test with no matches
    request.url.pathname = '/no-match';
    context = request.fromRoute('/test/*/**');
    expect(context.args.size).to.equal(0);

    // Test with null arguments
    context = new RequestContext(request, { args: null as any });
    expect(context.args.size).to.equal(0);

    // Test with non-array/set arguments
    context = new RequestContext(request, { args: 123 as any });
    expect(context.args.size).to.equal(0);

    // Test with empty Set
    context = new RequestContext(request, { args: new Set() });
    expect(context.args.size).to.equal(0);

    // Test with empty Array
    context = new RequestContext(request, { args: [] });
    expect(context.args.size).to.equal(0);

    // Test with Set containing non-string values
    const nonStringSet = new Set([1, 2, 3]);
    context = new RequestContext(request, { 
      args: Array.from(nonStringSet).map(String)
    });
    expect(context.args.size).to.equal(3);
    expect(context.args.has('1')).to.be.true;
    expect(context.args.has('2')).to.be.true;
    expect(context.args.has('3')).to.be.true;
  });

  it('Should initialize with different parameter types', () => {
    const request = new Request({
      method: 'GET',
      url: 'http://localhost/test/value1/value2',
      data: { existingKey: 'existingValue' }
    });

    // Test with Map parameters
    const mapParams = new Map([['key1', 'value1'], ['key2', 'value2']]);
    let context = request.fromRoute('/test/:key1/:key2');
    expect(context.params('key1')).to.equal('value1');
    expect(context.params('key2')).to.equal('value2');
    expect(context.data('key1')).to.equal('value1');
    expect(context.data('key2')).to.equal('value2');

    // Test with object parameters
    request.url.pathname = '/test/value3/value4';
    context = request.fromRoute('/test/:key3/:key4');
    expect(context.params('key3')).to.equal('value3');
    expect(context.params('key4')).to.equal('value4');
    expect(context.data('key3')).to.equal('value3');
    expect(context.data('key4')).to.equal('value4');

    // Test with no matches
    request.url.pathname = '/no-match';
    context = request.fromRoute('/test/:key1/:key2');
    expect(context.params.size).to.equal(0);

    // Test with null parameters
    context = new RequestContext(request, { params: null as any });
    expect(context.params.size).to.equal(0);

    // Test with non-map/object parameters
    context = new RequestContext(request, { params: 123 as any });
    expect(context.params.size).to.equal(0);

    // Test with empty Map
    context = new RequestContext(request, { params: new Map() });
    expect(context.params.size).to.equal(0);

    // Test with empty object
    context = new RequestContext(request, { params: {} });
    expect(context.params.size).to.equal(0);

    // Test with Map containing non-string values
    const nonStringMap = new Map<string, string | number | boolean>([['key1', 1], ['key2', true]]);
    context = new RequestContext(request, { 
      params: new Map(Array.from(nonStringMap.entries()).map(([k, v]) => [k, String(v)]))
    });
    expect(context.params.size).to.equal(2);
    expect(context.params('key1')).to.equal('1');
    expect(context.params('key2')).to.equal('true');

    // Test with object containing non-string values
    context = new RequestContext(request, { 
      params: { key1: String(1), key2: String(true) }
    });
    expect(context.params.size).to.equal(2);
    expect(context.params('key1')).to.equal('1');
    expect(context.params('key2')).to.equal('true');
  });

  it('Should handle loaded state correctly', async () => {
    // Create a request with a body
    const request = new Request({
      method: 'POST',
      url: 'http://localhost/test',
      body: 'test body',
      mimetype: 'text/plain'
    });
    await request.load();
    const context = request.fromRoute('/test');
    expect(context.loaded).to.be.true;

    // Create a request without a body
    const emptyRequest = new Request({
      method: 'GET',
      url: 'http://localhost/test'
    });
    const emptyContext = emptyRequest.fromRoute('/test');
    expect(emptyContext.loaded).to.be.false;
  });

  it('Should handle data sync correctly', () => {
    const request = new Request({
      method: 'GET',
      url: 'http://localhost/test',
      data: { key1: 'existing1', key2: 'existing2' }
    });

    // Test when param key exists in data (shouldn't override)
    let context = new RequestContext(request, {
      params: new Map([
        ['key1', 'param1'],  // exists in data
        ['key3', 'param3']   // doesn't exist in data
      ])
    });

    expect(context.data('key1')).to.equal('existing1');  // unchanged
    expect(context.data('key2')).to.equal('existing2');  // unchanged
    expect(context.data('key3')).to.equal('param3');     // added

    // Test with empty params (no data sync needed)
    context = new RequestContext(request, {
      params: new Map()
    });
    expect(context.data('key1')).to.equal('existing1');
    expect(context.data('key2')).to.equal('existing2');

    // Test with undefined params (no data sync needed)
    context = new RequestContext(request);
    expect(context.data('key1')).to.equal('existing1');
    expect(context.data('key2')).to.equal('existing2');

    // Test with null data in request
    const emptyRequest = new Request({
      method: 'GET',
      url: 'http://localhost/test'
    });
    context = new RequestContext(emptyRequest, {
      params: new Map([['key1', 'value1']])
    });
    expect(context.data('key1')).to.equal('value1');
  });
});