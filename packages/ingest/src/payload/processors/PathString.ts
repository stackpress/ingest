import type Nest from '../Nest';

import ReadonlyPathString from '../readonly/Path';

export default class PathString extends ReadonlyPathString {
  /**
   * The main nest
   */
  public nest: Nest;

  /**
   * Sets the nest 
   */
  constructor(nest: Nest) {
    super(nest);
    this.nest = nest;
  }

  /**
   * Removes name space given notation
   */
  delete(notation: string, separator: string = '.'): Nest {
    const path = notation.split(separator);
    return this.nest.delete(...path);
  }

  /**
   * Creates the name space given the space
   * and sets the value to that name space
   */
  set(notation: string, value: any, separator: string = '.'): Nest {
    const path = notation.split(separator);
    return this.nest.set(...path, value);
  }
}