//stackpress
import type { Event } from '@stackpress/types/dist/types';
import Exception from '@stackpress/types/dist/Exception';
//local
import type { ErrorEventResponse } from './types';

/**
 * Exceptions are used to give more information
 * of an error that has occured
 */
export default class IngestException extends Exception {
  /**
   * Upgrades an error to an exception
   */
  public static upgrade(error: Error, code = 500) {
    const exception = new this(error.message, code);
    exception.name = error.name;
    exception.stack = error.stack;
    return exception;
  }

  //event object
  protected _event?: Event<Array<any>>;

  /**
   * Returns the event
   */
  public get event() {
    return this._event;
  }

  /**
   * Converts error to Response object
   */
  public toResponse(start = 0, end = 0) {
    const json: ErrorEventResponse = {
      code: this._code,
      status: this._status,
      error: this.message,
      start: this._start,
      end: this._end,
      stack: this.trace(start, end),
      event: this._event
    };
    if (Object.keys(this._errors).length > 0) {
      json.errors = this._errors;
    }
    return json;
  }

  /**
   * Adds the event to the exception
   */
  public withEvent(event: Event<Array<any>>) {
    this._event = Object.freeze(event);
    return this;
  }
}

