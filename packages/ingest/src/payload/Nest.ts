import type { Key, NestedObject } from './types';

import Exception from '../Exception';
import ReadonlyNest from './readonly/Nest';

import ArgString from './processors/ArgString';
import PathString from './processors/PathString';
import QueryString from './processors/QueryString';
import FormData from './processors/FormData';

import {
  makeArray,
  makeObject,
  shouldBeAnArray
} from './helpers';

/**
 * Nest easily manipulates object data
 */
export default class Nest extends ReadonlyNest {
  /**
   * Parser for terminal args
   */
  public withArgs: ArgString;

  /**
   * Parser for multipart/form-data
   */
  public withFormData: FormData;

  /**
   * Parser for path notations
   */
  public withPath: PathString;

  /**
   * Parser for query string
   */
  public withQuery: QueryString;

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
    super(data);
    this.withArgs = new ArgString(this);
    this.withFormData = new FormData(this);
    this.withPath = new PathString(this);
    this.withQuery = new QueryString(this);
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
  public delete(...path: Key[]) {
    if (!path.length) {
      return this;
    }

    if (!this.has(...path)) {
      return this;
    }

    const last = path.pop() as Key;
    let pointer = this._data;

    path.forEach(step => {
      pointer = pointer[step] as NestedObject<unknown>;
    });

    delete pointer[last];

    return this;
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
}