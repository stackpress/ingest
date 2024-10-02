import type { NestedObject, Index, FileMeta } from '../runtime/types';

import Exception from '../Exception';

/**
 * Nest easily manipulates object data
 */
export default class Nest {
  /**
   * Parser for terminal args
   */
  public withArgs: Args;

  /**
   * Parser for multipart/form-data
   */
  public withFormData: FormData;

  /**
   * Parser for path notations
   */
  public withPath: Path;

  /**
   * Parser for query string
   */
  public withQuery: Query;

  /**
   * The raw data
   */
  protected _data: NestedObject<unknown>;

  /**
   * Returns the raw data
   */
  public get data(): NestedObject<unknown> {
    return this._data;
  }

  /**
   * Returns the length
   */
  public get size(): number {
    return Object.keys(this._data).length;
  }

  /**
   * Safely sets the data
   */
  public set data(data: NestedObject<unknown>) {
    Exception.require(
      data?.constructor === Object, 
      'Argument 1 expected Object'
    );
    this._data = data;
  }

  /**
   * Sets the initial data
   */
  public constructor(data: NestedObject<unknown> = {}) {
    this._data = data;
    this.withArgs = new Args(this);
    this.withFormData = new FormData(this);
    this.withPath = new Path(this);
    this.withQuery = new Query(this);
  }

  /**
   * Clears all the data
   */
  public clear() {
    this._data = {};
    return this;
  }

  /**
   * Removes the data from a specified path
   */
  public delete(...path: Index[]) {
    if (!path.length) {
      return this;
    }

    if (!this.has(...path)) {
      return this;
    }

    const last = path.pop() as Index;
    let pointer = this._data;

    path.forEach(step => {
      pointer = pointer[step] as NestedObject<unknown>;
    });

    delete pointer[last];

    return this;
  }

  /**
   * Returns the data as an array
   */
  public entries() {
    return Object.entries(this._data);
  }

  /**
   * Loops though the data of a specified path
   */
  async forEach(...path: any[]): Promise<boolean> {
    const callback = path.pop() as Function;
    let list = this.get(...path);

    if (!list
      || Array.isArray(list) && !list.length
      || typeof list === 'string' && !list.length
      || typeof list === 'object' && !Object.keys(list).length
    ) {
      return false;
    }

    for(let key in list) {
      if ((await callback(list[key], key)) === false) {
        return false;
      }
    }

    return true;
  }

  /**
   * Retrieves the data hashd specified by the path
   */
  public get<T = any>(...path: Index[]): NestedObject<unknown>|T|undefined {
    if (!path.length) {
      return this._data;
    }

    if (!this.has(...path)) {
      return undefined;
    }

    const last = path.pop() as Index;
    let pointer = this._data;

    path.forEach(step => {
      pointer = pointer[step] as NestedObject<unknown>;
    });

    return pointer[last] as T;
  }

  /**
   * Returns true if the specified path exists
   */
  public has(...path: Index[]): boolean {
    if (!path.length) {
      return false;
    }

    let found = true;
    const last = path.pop() as Index;
    let pointer = this._data;

    path.forEach(step => {
      if (!found) {
        return;
      }

      if (typeof pointer[step] !== 'object') {
        found = false;
        return;
      }

      pointer = pointer[step] as NestedObject<unknown>;
    });

    return !(!found || typeof pointer[last] === 'undefined');
  }

  /**
   * Returns the keys of the data
   */
  public keys() {
    return Object.keys(this._data);
  }

  /**
   * Sets the data of a specified path
   */
  public set(...path: any[]) {
    if (path.length < 1) {
      return this;
    }

    if (typeof path[0] === 'object') {
      Object.keys(path[0]).forEach(key => {
        this.set(key, path[0][key]);
      });

      return this;
    }

    const value = path.pop();
    let last = path.pop(), pointer = this._data;

    path.forEach((step, i) => {
      if (step === null || step === '') {
        path[i] = step = Object.keys(pointer).length;
      }

      if (typeof pointer[step] !== 'object') {
        pointer[step] = {};
      }

      pointer = pointer[step] as NestedObject<unknown>;
    });

    if (last === null || last === '') {
      last = Object.keys(pointer).length;
    }

    pointer[last] = value;

    //loop through the steps one more time fixing the objects
    pointer = this._data;
    path.forEach((step) => {
      const next = pointer[step] as NestedObject<unknown>;
      //if next is not an array and next should be an array
      if (!Array.isArray(next) && shouldBeAnArray(next)) {
        //transform next into an array
        pointer[step] = makeArray(next);
      //if next is an array and next should not be an array
      } else if (Array.isArray(next) && !shouldBeAnArray(next)) {
        //transform next into an object
        pointer[step] = makeObject(next);
      }

      pointer = pointer[step] as NestedObject<unknown>;
    });

    return this;
  }

  /**
   * Stringifies the data
   */
  public toString(expand = true, ...path: Index[]) {
    return expand 
      ? JSON.stringify(this.get(...path), null, 2)
      : JSON.stringify(this.get(...path));
  }

  /**
   * Returns the values of the data
   */
  public values() {
    return Object.values(this._data);
  }
}

export class File {
  public data: Buffer|string;
  public name: string;
  public type: string;

  constructor(file: FileMeta) {
    this.data = file.data;
    this.name = file.name;
    this.type = file.type;
  }
}

export class Args {
  /**
   * The main hash
   */
  public hash: Nest;

  /**
   * Sets the hash 
   */
  constructor(hash: Nest) {
    this.hash = hash;
  }

  /**
   * Creates the name space given the space
   * and sets the value to that name space
   */
  set(...path: any[]): Nest {
    if (path.length < 1) {
      return this.hash;
    }

    let skip = path.pop();
    if (typeof skip !== 'number') {
      path.push(skip);
      skip = 0;
    }

    let args = path.pop();
    if (typeof args === 'string') {
      args = args.split(' ');
    }

    let key, index = 0, i = skip, j = args.length;
    for (; i < j; i++) {
      const arg = args[i];
      const equalPosition = arg.indexOf('=');
      // --foo --bar=baz
      if (arg.substr(0, 2) === '--') { 
        // --foo --foo baz
        if (equalPosition === -1) {
          key = arg.substr(2);
          // --foo value
          if ((i + 1) < j && args[i + 1][0] !== '-') {
            this._format(path, key, args[i + 1]);
            i++;
            continue;
          }
          // --foo
          this._format(path, key, true);
          continue;
        }

        // --bar=baz
        this._format(
          path,
          arg.substr(2, equalPosition - 2), 
          arg.substr(equalPosition + 1)
        );
        continue;
      } 

      // -k=value -abc
      if (arg.substr(0, 1) === '-') {
        // -k=value
        if (arg.substr(2, 1) === '=') {
          this._format(path, arg.substr(1, 1), arg.substr(3));
          continue;
        }

        // -abc
        const chars = arg.substr(1);
        for (let k = 0; k < chars.length; k++) {
          key = chars[k];
          this._format(path, key, true);
        }

        // -a value1 -abc value2
        if ((i + 1) < j && args[i + 1][0] !== '-') {
          this._format(path, key, args[i + 1], true);
          i++;
        }

        continue;
      }

      if (equalPosition !== -1) {
        this._format(
          path,
          arg.substr(0, equalPosition), 
          arg.substr(equalPosition + 1)
        );
        continue;
      }

      if (arg.length) {
        // plain-arg
        this._format(path, index++, arg);
      }
    }
    
    return this.hash;
  }

  /**
   * Determines whether to set or push 
   * formatted values to the hash
   */
  protected _format(
    path: Index[], 
    key: Index, 
    value: any, 
    override?: boolean
  ): Nest {
    //parse value
    switch (true) {
      case typeof value !== 'string':
        break;
      case value === 'true':
        value = true;
        break;
      case value === 'false':
        value = false;
        break;
      case !isNaN(value) && !isNaN(parseFloat(value)):
        value = parseFloat(value);
        break;
      case !isNaN(value) && !isNaN(parseInt(value)):
        value = parseInt(value);
        break;
    }

    if (path.length) {
      key = path.join('.') + '.' + key;
    }

    key = String(key);

    const withPath = this.hash.withPath;

    //if it's not set yet
    if (!withPath.has(key) || override) {
      //just set it
      withPath.set(key, value);
      return this.hash;
    }

    //it is set
    const current = withPath.get(key);
    //if it's not an array
    if (!Array.isArray(current)) {
      //make it into an array
      withPath.set(key, [current, value]);
      return this.hash;
    }

    //push the value
    current.push(value);
    withPath.set(key, current);
    return this.hash;
  }
}

export class Path {
  /**
   * The main hash
   */
  public hash: Nest;

  /**
   * Sets the hash 
   */
  constructor(hash: Nest) {
    this.hash = hash;
  }

  /**
   * Gets a value given the path in the hash.
   */
  async forEach(
    notation: string, 
    callback: Function, 
    separator: string = '.'
  ): Promise<boolean> {
    const path = notation.split(separator);
    return await this.hash.forEach(...path, callback);
  }

  /**
   * Gets a value given the path in the hash.
   */
  get(notation: string, separator: string = '.'): any {
    const path = notation.split(separator);
    return this.hash.get(...path);
  }

  /**
   * Checks to see if a key is set
   */
  has(notation: string, separator: string = '.'): boolean {
    const path = notation.split(separator);
    return this.hash.has(...path);
  }

  /**
   * Removes name space given notation
   */
  delete(notation: string, separator: string = '.'): Nest {
    const path = notation.split(separator);
    return this.hash.delete(...path);
  }

  /**
   * Creates the name space given the space
   * and sets the value to that name space
   */
  set(notation: string, value: any, separator: string = '.'): Nest {
    const path = notation.split(separator);
    return this.hash.set(...path, value);
  }
}

export class Query {
  /**
   * The main hash
   */
  public hash: Nest;

  /**
   * Sets the hash 
   */
  constructor(hash: Nest) {
    this.hash = hash;
  }

  /**
   * Creates the name space given the space
   * and sets the value to that name space
   */
  set(...path: any[]): Nest {
    if (path.length < 1) {
      return this.hash;
    }

    const query = path.pop();

    const separator = '~~' + Math.floor(Math.random() * 10000) + '~~';
    query.split(/\&/gi).forEach((filter: any) => {
      //key eg. foo[bar][][baz]
      const [key, value] = filter.split('=', 2);
      //change path to N notation
      const keys = key
        .replace(/\]\[/g, separator)
        .replace('[', separator)
        .replace(/\[/g, '')
        .replace(/\]/g, '')
        .split(separator);

      keys.map((key: any) => {
        const index = parseInt(key);
        //if its a possible integer
        if (!isNaN(index) && key.indexOf('.') === -1) {
          return index;
        }

        return key;
      })

      const paths = path.concat(keys);

      if (/(^\{.*\}$)|(^\[.*\]$)/.test(value)) {
        try {
          return query.set(...paths, JSON.parse(value));
        } catch(e) {}
      }

      if (!isNaN(parseFloat(value))) {
        this.hash.set(...paths, parseFloat(value));
      } else if (value === 'true') {
        this.hash.set(...paths, true);
      } else if (value === 'false') {
        this.hash.set(...paths, false);
      } else if (value === 'null') {
        this.hash.set(...paths, null);
      } else {
        this.hash.set(...paths, value);
      }
    });

    return this.hash;
  }
}

export class FormData {
  /**
   * The main hash
   */
  public hash: Nest;

  /**
   * Sets the hash 
   */
  constructor(hash: Nest) {
    this.hash = hash;
  }

  set(...path: any[]): Nest {
    if (path.length < 1) {
      return this.hash;
    }

    const formData = path.pop() as string|Buffer;
    const formDataBuffer = typeof formData === 'string' 
      ? Buffer.from(formData)
      : formData;
    const boundary = this._getBoundary(formDataBuffer);
    if (!boundary) {
      throw Exception.for('Invalid form data');
    }
    let part: Buffer[] = [];
    
    for (let i = 0; i < formDataBuffer.length; i++) {
      //get line
      const line = this._getLine(formDataBuffer, i);
      //if no line
      if (line === null) {
        //we are done
        break;
      }
      //get the line buffer
      const buffer = line.buffer;
      if (buffer.toString().indexOf(boundary) === 0) {
        if (part.length) {
          this._setPart(path, this._getPart(part));
        }
        //if it's the last boundary
        if (buffer.toString() === `${boundary}--`) {
          break;
        }
        part = [];
      } else {
        part.push(buffer);
      }

      i = line.i;
    }

    return this.hash;
  }

  protected _getBoundary(buffer: Buffer): string|null {
    const boundary = this._getLine(buffer, 0)?.buffer;
    if (!boundary) {
      return null;
    }
    return boundary.slice(0, boundary.length - 1).toString();
  }

  protected _getLine(buffer: Buffer, i: number) {
    const line: number[] = [];
    for (; i < buffer.length; i++) {
      const current = buffer[i];
      line.push(current);

      if (current === 0x0a || current === 0x0d) {
        return { i, buffer: Buffer.from(line) };
      }
    }

    if (line.length) {
      return { i, buffer: Buffer.from(line) };
    }

    return null;    
  }

  protected _getPart(lines: Buffer[]) {
    const headerLines: (string|undefined)[] = [];
    do { //get the header lines
      headerLines.push(lines.shift()?.toString());
    } while(lines.length 
      && !(lines[0].length === 1 
        && (lines[0][0] === 0x0a 
          || lines[0][0] === 0x0d
        )
      )
    );
    //we need to trim the \n from the last line
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = last.slice(0, last.length - 1);
    //the rest of the lines is the body
    const body = Buffer.concat(lines.slice(1));
    //parse headers
    const headers: Record<string, string> = {};
    //for forEach header line
    for (const line of headerLines) {
      //if the line has a `:`
      if (line && line.indexOf(':') !== -1) {
        //then we can split it
        const [ key, value ] = line.toString().split(':', 2);
        //now set it to headers
        headers[key.trim().toLowerCase()] = value.trim();
      }
    }
    //extract the form data from content-disposition
    const form: Record<string, string> = {};
    if (typeof headers['content-disposition'] === 'string') {
      headers['content-disposition'].split(';').forEach(disposition => {
        const matches = disposition
          .trim()
          .match(/^([a-zA-Z0-9_\-]+)=["']([^"']+)["']$/);
        
        if (matches && matches.length > 2) {
          form[matches[1]] = matches[2];
        }
      });
    }
    
    return { headers, body, form };
  }

  protected _setPart(path: string[], part: {
    headers: Record<string, string>;
    body: Buffer;
    form: Record<string, string>;
  }) {
    if (!part.form.name) {
      return this;
    }
    
    //change path to N notation
    const separator = '~~' + Math.floor(Math.random() * 10000) + '~~';
    const keys = part.form.name
      .replace(/\]\[/g, separator)
      .replace('[', separator)
      .replace(/\[/g, '')
      .replace(/\]/g, '')
      .split(separator);

    keys.map((key: any) => {
      const index = parseInt(key);
      //if its a possible integer
      if (!isNaN(index) && key.indexOf('.') === -1) {
        return index;
      }

      return key;
    });

    //get hash paths
    const paths = path.concat(keys);
    //if there is not a filename
    if (!part.form.filename) {
      const value = part.body.toString();
      //try parsing JSON
      if (/(^\{.*\}$)|(^\[.*\]$)/.test(value)) {
        try {
          return this.hash.set(...paths, JSON.parse(value));
        } catch(e) {}
      }

      //try parsing float
      if (!isNaN(parseFloat(value))) {
        this.hash.set(...paths, parseFloat(value));
      //try parsing true
      } else if (value === 'true') {
        this.hash.set(...paths, true);
      //try parsing false
      } else if (value === 'false') {
        this.hash.set(...paths, false);
      //try parsing null
      } else if (value === 'null') {
        this.hash.set(...paths, null);
      } else {
        this.hash.set(...paths, value);
      }
      return this;
    }
    //if we are here it's a filename
    this.hash.set(...paths, new File({
      data: part.body,
      name: part.form.filename,
      type: part.headers['content-type']
    }));
  }
}

/**
 * Transforms an object into an array
 */
export function makeArray(object: NestedObject<unknown>): any[] {
  const array: any[] = [];
  const keys = Object.keys(object);
  
  keys.sort();
  
  keys.forEach(function(key) {
    array.push(object[key]);
  })

  return array;
}

/**
 * Transforms an array into an object
 */
export function makeObject(array: any[]): NestedObject<unknown> {
  return Object.assign({}, array as unknown);
}

/**
 * Returns true if object keys is all numbers
 */
export function shouldBeAnArray(object: NestedObject<unknown>): boolean {
  if (typeof object !== 'object') {
    return false;
  }

  const length = Object.keys(object).length

  if (!length) {
    return false;
  }

  for (let i = 0; i < length; i++) {
    if (typeof object[i] === 'undefined') {
      return false;
    }
  }

  return true;
}