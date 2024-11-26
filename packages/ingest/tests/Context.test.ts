import { describe, it } from 'mocha';
import { expect } from 'chai';
import Request from '../src/Request';

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
});