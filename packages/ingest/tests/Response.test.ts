import { describe, it } from 'mocha';
import { expect } from 'chai';
import Response from '../src/payload/Response';

describe('Response Tests', () => {
  it('Should be empty', () => {
    const response = new Response();
    expect(response.sent).to.be.false;

    expect(response.code).to.equal(0);
    expect(response.status).to.equal('');
    
    expect(response.mimetype).to.be.undefined;
    expect(response.type).to.equal('null');
    expect(response.body).to.be.null;
    expect(response.total).to.equal(0);

    expect(response.error).to.be.undefined;
    expect(response.stack).to.be.undefined;
    expect(response.errors.size).to.equal(0);

    expect(response.resource).to.be.undefined;
  });

  it('Should manually set', () => {
    const response = new Response();
    response.code = 400;
    expect(response.code).to.equal(400);
    expect(response.status).to.equal('Bad Request');

    response.status = { code: 200, status: 'OK' };
    
    response.mimetype = 'text/plain';
    response.body = 'Hello World';
    response.total = 100;
    
    response.error = 'Something bad happened';
    response.errors.set('foo', 'bar');
    response.stack = [{ method: 'GET', file: 'index.ts', line: 1, char: 1 }];

    expect(response.code).to.equal(200);
    expect(response.status).to.equal('OK');
    
    expect(response.mimetype).to.equal('text/plain');
    expect(response.type).to.equal('string');
    expect(response.body).to.equal('Hello World');
    expect(response.total).to.equal(100);

    expect(response.error).to.equal('Something bad happened');
    expect(response.stack[0].method).to.equal('GET');
    expect(response.errors.size).to.equal(1);
  });

  it('Should setup basic error', () => {
    const response = new Response();
    response.setError('Something good is bad');
    expect(response.code).to.equal(400);
    expect(response.status).to.equal('Bad Request');
    expect(response.error).to.equal('Something good is bad');
  });

  it('Should setup advanced error', () => {
    const response = new Response();
    response.setError(
      'Something good is bad',
      { foo: 'bar' },
      [{ method: 'GET', file: 'index.ts', line: 1, char: 1 }],
      500,
      'Internal Server Error'
    );
    expect(response.code).to.equal(500);
    expect(response.status).to.equal('Internal Server Error');
    expect(response.error).to.equal('Something good is bad');
    expect(response.errors.get<string>('foo')).to.equal('bar');
    expect(response.stack?.[0].method).to.equal('GET');
  });

  it('Should setup error with options', () => {
    const response = new Response();
    response.setError({
      error: 'Something good is bad',
      errors: { foo: 'bar' },
      code: 500,
      stack: [{ method: 'GET', file: 'index.ts', line: 1, char: 1 }]
    });
    expect(response.code).to.equal(500);
    expect(response.status).to.equal('Internal Server Error');
    expect(response.error).to.equal('Something good is bad');
    expect(response.errors.get<string>('foo')).to.equal('bar');
    expect(response.stack?.[0].method).to.equal('GET');
  });

  it('Should setup HTML', () => {
    const response = new Response();
    response.setHTML('Something good');
    expect(response.code).to.equal(200);
    expect(response.status).to.equal('OK');
    expect(response.body).to.equal('Something good');
    expect(response.type).to.equal('string');
    expect(response.mimetype).to.equal('text/html');
  });

  it('Should setup JSON', () => {
    const response = new Response();
    response.setJSON({ name: 'bar' });
    expect(response.code).to.equal(200);
    expect(response.status).to.equal('OK');
    expect(response.body).to.contain('bar');
    expect(response.type).to.equal('string');
    expect(response.mimetype).to.equal('text/json');
  });

  it('Should setup XML', () => {
    const response = new Response();
    response.setXML('<name>bar</name>');
    expect(response.code).to.equal(200);
    expect(response.status).to.equal('OK');
    expect(response.body).to.equal('<name>bar</name>');
    expect(response.type).to.equal('string');
    expect(response.mimetype).to.equal('text/xml');
  });

  it('Should setup results', () => {
    const response = new Response();
    response.setResults({ name: 'bar' });
    expect(response.code).to.equal(200);
    expect(response.status).to.equal('OK');
    expect((response.body as Record<string, any>)?.name).to.equal('bar');
    expect(response.type).to.equal('object');
    expect(response.mimetype).to.equal('text/json');
  });

  it('Should setup rows', () => {
    const response = new Response();
    response.setRows([{ name: 'bar' }], 100);
    expect(response.code).to.equal(200);
    expect(response.status).to.equal('OK');
    expect((response.body as Record<string, any>[])?.[0].name).to.equal('bar');
    expect(response.type).to.equal('array');
    expect(response.mimetype).to.equal('text/json');
    expect(response.total).to.equal(100);
  });

  it('Should redirect', () => {
    const response = new Response();
    response.redirect('/foo/bar');
    expect(response.code).to.equal(302);
    expect(response.status).to.equal('Found');
    expect(response.headers.get('Location')).to.equal('/foo/bar');
  });

  it('Should dispatch', async () => {
    const response = new Response();
    response.setBody('text/json', { name: 'bar' });
    let dispatched = false;
    response.dispatcher = async res => {
      expect(response.code).to.equal(200);
      expect(response.status).to.equal('OK');
      expect((response.body as Record<string, any>)?.name).to.equal('bar');
      expect(response.type).to.equal('object');
      expect(response.mimetype).to.equal('text/json');
      dispatched = true;
    };
    await response.dispatch();
    expect(dispatched).to.be.true;
  });
});