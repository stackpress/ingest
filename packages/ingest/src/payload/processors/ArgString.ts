import type { Key } from '../types';
import type Nest from '../Nest';

export default class ArgString {
  /**
   * The main nest
   */
  public nest: Nest;

  /**
   * Sets the nest 
   */
  constructor(nest: Nest) {
    this.nest = nest;
  }

  /**
   * Creates the name space given the space
   * and sets the value to that name space
   */
  set(...path: any[]): Nest {
    if (path.length < 1) {
      return this.nest;
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
    
    return this.nest;
  }

  /**
   * Determines whether to set or push 
   * formatted values to the nest
   */
  protected _format(
    path: Key[], 
    key: Key, 
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

    const withPath = this.nest.withPath;

    //if it's not set yet
    if (!withPath.has(key) || override) {
      //just set it
      withPath.set(key, value);
      return this.nest;
    }

    //it is set
    const current = withPath.get(key);
    //if it's not an array
    if (!Array.isArray(current)) {
      //make it into an array
      withPath.set(key, [current, value]);
      return this.nest;
    }

    //push the value
    current.push(value);
    withPath.set(key, current);
    return this.nest;
  }
}