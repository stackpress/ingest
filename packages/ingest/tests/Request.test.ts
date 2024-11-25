import { describe, it } from 'mocha';
import { expect } from 'chai';
import Request from '../src/Request';

describe('Response Tests', () => {
  it('Should be empty', () => {
    const request = new Request();
    expect(request.loaded).to.be.false;

    expect(request.method).to.equal('GET');
    expect(request.url.href).to.equal('http://unknownhost/');
    
    expect(request.mimetype).to.equal('text/plain');
    expect(request.type).to.equal('null');
    expect(request.body).to.be.null;

    expect(request.headers.size).to.equal(0);
    expect(request.session.size).to.equal(0);

    expect(request.data.size).to.equal(0);
    expect(request.query.size).to.equal(0);
    expect(request.post.size).to.equal(0);

    expect(request.resource).to.be.undefined;
  });

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
    expect(request.loaded).to.be.false;

    expect(request.method).to.equal('POST');
    expect(request.url.href).to.equal('http://localhost/foo/bar?bar=zoo');
    
    expect(request.mimetype).to.equal('text/json');
    expect(request.type).to.equal('object');
    expect((request.body as Record<string, any>)?.foo).to.contain('bar');

    expect(request.headers.size).to.equal(1);
    expect(request.session.size).to.equal(1);

    expect(request.data.size).to.equal(2);
    expect(request.query.size).to.equal(1);
    expect(request.post.size).to.equal(1);

    expect(request.resource).to.be.undefined;
  });
});