import type Nest from '../Nest';

export default class QueryString {
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

    const query = path.pop();

    const separator = '~~' + Math.floor(Math.random() * 10000) + '~~';
    query.split(/\&/gi).forEach((filter: any) => {
      //key eg. foo[bar][][baz]
      let [ key, value ] = filter.split('=', 2);
      value = value.replace(/\+/g, ' ');
      value = decodeURIComponent(value);
      //change path to N notation
      const keys = decodeURIComponent(key)
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
        this.nest.set(...paths, parseFloat(value));
      } else if (value === 'true') {
        this.nest.set(...paths, true);
      } else if (value === 'false') {
        this.nest.set(...paths, false);
      } else if (value === 'null') {
        this.nest.set(...paths, null);
      } else {
        this.nest.set(...paths, value);
      }
    });

    return this.nest;
  }
}