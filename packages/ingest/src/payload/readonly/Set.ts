export default class ReadonlySet<T = any> {
  //map of set
  protected _set: Set<T>;
  /**
   * Sets the initial values of the set
   */
  constructor(init?: T[]) {
    this._set = new Set(init);
  }

  /**
   * Returns the set as entries
   */
  public entries() {
    return this._set.entries();
  }

  /**
   * Iterates over the set
   */
  public forEach(
    iterator: (value: T, value2: T, set: Set<T>) => void, 
    arg?: unknown
  ) {
    return this._set.forEach(iterator, arg);
  }

  /**
   * Returns whether the set has the value
   */
  public has(value: T) {
    return this._set.has(value);
  }

  /**
   * Returns the keys of the set
   */
  public keys() {
    return this._set.keys();
  }

  /**
   * Returns the size of the set
   */
  public get size() {
    return this._set.size;
  }

  /**
   * Returns the values of the set
   */
  public values() {
    return this._set.values();
  }
}