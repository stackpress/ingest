import type Nest from '../Nest';

import Exception from '../../Exception';
import FileData from './FileData';

export default class FormData {
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

  set(...path: any[]): Nest {
    if (path.length < 1) {
      return this.nest;
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

    return this.nest;
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

    //get nest paths
    const paths = path.concat(keys);
    //if there is not a filename
    if (!part.form.filename) {
      const value = part.body.toString();
      //try parsing JSON
      if (/(^\{.*\}$)|(^\[.*\]$)/.test(value)) {
        try {
          return this.nest.set(...paths, JSON.parse(value));
        } catch(e) {}
      }

      //try parsing float
      if (!isNaN(parseFloat(value))) {
        this.nest.set(...paths, parseFloat(value));
      //try parsing true
      } else if (value === 'true') {
        this.nest.set(...paths, true);
      //try parsing false
      } else if (value === 'false') {
        this.nest.set(...paths, false);
      //try parsing null
      } else if (value === 'null') {
        this.nest.set(...paths, null);
      } else {
        this.nest.set(...paths, value);
      }
      return this;
    }
    //if we are here it's a filename
    this.nest.set(...paths, new FileData({
      data: part.body,
      name: part.form.filename,
      type: part.headers['content-type']
    }));
  }
}