export default class ReadonlyMap<S = any, T = any> {
  //map of map
  protected _map: Map<S, T>;

  /**
   * Sets the initial values of the map
   */
  constructor(init?: [S, T][]) {
    this._map = new Map(init);
  }

  /**
   * Returns the map as entries
   */
  public entries() {
    return this._map.entries();
  }

  /**
   * Iterates over the map
   */
  public forEach(
    iterator: (value: T, key: S, set: Map<S, T>) => void, 
    arg?: unknown
  ) {
    return this._map.forEach(iterator, arg);
  }

  /**
   * Returns the value of the map
   */
  public get(key: S) {
    return this._map.get(key);
  }

  /**
   * Returns whether the map has the value
   */
  public has(key: S) {
    return this._map.has(key);
  }

  /**
   * Returns the keys of the map
   */
  public keys() {
    return this._map.keys();
  }

  /**
   * Returns the size of the map
   */
  public get size() {
    return this._map.size;
  }

  /**
   * Returns the values of the map
   */
  public values() {
    return this._map.values();
  }   
}