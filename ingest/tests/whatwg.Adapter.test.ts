import { expect } from 'chai';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import IngestRequest from '../src/Request';
import { loader } from '../src/whatwg/Adapter';

describe('whatwg Adapter', () => {
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
});
