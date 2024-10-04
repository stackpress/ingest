import type { Key, NestedObject } from '../types';

/**
 * Nest easily manipulates object data
 */
export default class ReadonlyNest {
  /**
   * Parser for path notations
   */
  public withPath: Path;

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
   * Sets the initial data
   */
  public constructor(data: NestedObject<unknown> = {}) {
    this._data = data;
    this.withPath = new Path(this);
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
  public get<T = any>(...path: Key[]): NestedObject<unknown>|T|undefined {
    if (!path.length) {
      return this._data;
    }

    if (!this.has(...path)) {
      return undefined;
    }

    const last = path.pop() as Key;
    let pointer = this._data;

    path.forEach(step => {
      pointer = pointer[step] as NestedObject<unknown>;
    });

    return pointer[last] as T;
  }

  /**
   * Returns true if the specified path exists
   */
  public has(...path: Key[]): boolean {
    if (!path.length) {
      return false;
    }

    let found = true;
    const last = path.pop() as Key;
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
   * Stringifies the data
   */
  public toString(expand = true, ...path: Key[]) {
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

export class Path {
  /**
   * The main hash
   */
  public hash: ReadonlyNest;

  /**
   * Sets the hash 
   */
  constructor(hash: ReadonlyNest) {
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
}