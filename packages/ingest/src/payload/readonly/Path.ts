import type ReadonlyNest from './Nest';

export default class ReadonlyPath {
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