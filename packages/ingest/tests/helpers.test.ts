import { expect } from 'chai';
import { 
  isHash, 
  formDataToObject, 
  objectFromQuery, 
  objectFromFormData, 
  objectFromJson,
  eventParams,
  routeParams,
  withUnknownHost,
  readableStreamToReadable,
  readableToReadableStream
} from '../src/helpers';
import { Readable } from 'stream';

describe('helpers', () => {
  describe('isHash', () => {
    it('should return true for plain objects', () => {
      expect(isHash({})).to.be.true;
      expect(isHash({ foo: 'bar' })).to.be.true;
    });

    it('should return false for non-objects', () => {
      expect(isHash(null)).to.be.false;
      expect(isHash(undefined)).to.be.false;
      expect(isHash('string')).to.be.false;
      expect(isHash(123)).to.be.false;
      expect(isHash([])).to.be.false;
      expect(isHash(new Date())).to.be.false;
    });
  });

  describe('formDataToObject', () => {
    it('should handle JSON content type', () => {
      const result = formDataToObject(
        'application/json',
        '{"name":"test","value":123}'
      );
      expect(result).to.deep.equal({ name: 'test', value: 123 });
    });

    it('should handle form-urlencoded content type', () => {
      const result = formDataToObject(
        'application/x-www-form-urlencoded',
        'name=test&value=123'
      );
      expect(result).to.deep.equal({ name: 'test', value: 123 });
    });

    it('should handle multipart/form-data content type', () => {
      const formData = '--boundary\r\nContent-Disposition: form-data; name="field1"\r\n\r\nvalue1\r\n--boundary--';
      const result = formDataToObject('multipart/form-data; boundary=boundary', formData);
      expect(result).to.deep.equal({ field1: 'value1' });
    });

    it('should return empty object for unknown content type', () => {
      expect(formDataToObject('text/plain', 'some data')).to.deep.equal({});
    });
  });

  describe('objectFromQuery', () => {
    it('should parse query string with leading ?', () => {
      const result = objectFromQuery('?foo=bar&baz=qux');
      expect(result).to.deep.equal({ foo: 'bar', baz: 'qux' });
    });

    it('should parse query string without leading ?', () => {
      const result = objectFromQuery('foo=bar&baz=qux');
      expect(result).to.deep.equal({ foo: 'bar', baz: 'qux' });
    });

    it('should return empty object for empty query', () => {
      expect(objectFromQuery('')).to.deep.equal({});
    });
  });

  describe('objectFromFormData', () => {
    it('should parse form data string', () => {
      const formData = '--boundary\r\nContent-Disposition: form-data; name="field1"\r\n\r\nvalue1\r\n--boundary--';
      const result = objectFromFormData(formData);
      expect(result).to.deep.equal({ field1: 'value1' });
    });

    it('should return empty object for empty data', () => {
      expect(objectFromFormData('')).to.deep.equal({});
    });
  });

  describe('objectFromJson', () => {
    it('should parse valid JSON object', () => {
      const result = objectFromJson('{"name":"test","value":123}');
      expect(result).to.deep.equal({ name: 'test', value: 123 });
    });

    it('should return empty object for invalid JSON', () => {
      expect(objectFromJson('invalid')).to.deep.equal({});
    });
  });

  describe('eventParams', () => {
    it('should extract parameters from URL with non-global regex', () => {
      const result = eventParams('/user/(\\d+)/', 'user/123');
      expect(result).to.deep.equal(['123']);
    });

    it('should extract parameters from URL with global regex', () => {
      const result = eventParams('/user/(\\d+)/g', 'user/123');
      expect(result).to.deep.equal(['123']);
    });

    it('should return undefined for non-matching URL', () => {
      const result = eventParams('/user/(\\d+)/', 'user/abc');
      expect(result).to.be.undefined;
    });
  });

  describe('routeParams', () => {
    it('should extract named parameters from route', () => {
      const result = routeParams('/users/:id/posts/:postId', '/users/123/posts/456');
      expect(result.params).to.deep.equal({ id: '123', postId: '456' });
    });

    it('should return object with empty params for non-matching route', () => {
      const result = routeParams('/users/:id', '/posts/123');
      expect(result.params).to.deep.equal({});
    });
  });

  describe('withUnknownHost', () => {
    it('should add unknown host to URL without protocol', () => {
      const result = withUnknownHost('example.com/path');
      expect(result).to.equal('http://unknownhost/example.com/path');
    });

    it('should add unknown host to URL with protocol', () => {
      const result = withUnknownHost('https://example.com/path');
      expect(result).to.equal('http://unknownhost/https://example.com/path');
    });
  });

  describe('readableStreamToReadable', () => {
    it('should convert ReadableStream to Node.js Readable', async () => {
      const data = 'Hello, World!';
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(data));
          controller.close();
        }
      });

      const readable = readableStreamToReadable(stream);
      expect(readable).to.be.instanceOf(Readable);

      let result = '';
      for await (const chunk of readable) {
        result += chunk;
      }
      expect(result).to.equal(data);
    });
  });

  describe('readableToReadableStream', () => {
    it('should convert Node.js Readable to ReadableStream', async () => {
      const data = 'Hello, World!';
      const buffer = Buffer.from(data);
      const readable = Readable.from([buffer]);

      const stream = readableToReadableStream(readable);
      expect(stream).to.be.instanceOf(ReadableStream);

      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const result = Buffer.concat(chunks).toString();
      expect(result).to.equal(data);
    });
  });
});
