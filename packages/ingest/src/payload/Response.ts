import type { ResponseDispatcher } from '../runtime/types';

import Payload from './Payload';
import Nest from './Nest';

import { WriteSession } from './Session';

export default class Response extends Payload {
  //response status code
  protected _code = 0;
  //response dispatcher
  protected _dispatcher?: ResponseDispatcher;
  //error controller
  protected _errors = new Nest();
  //session controller
  protected _session = new WriteSession();
  //whether if the response was sent
  protected _sent = false;
  //response status message
  protected _status = '';
  //total count of possible results
  protected _total = 0;

  /**
   * Returns the status code
   */
  public get code() {
    return this._code;
  }

  /**
   * Returns the error controller
   */
  public get errors() {
    return this._errors;
  }
  
  /**
   * Returns whether if the response was sent
   */
  public get sent() {
    return this._sent;
  }

  /**
   * Returns the session controller
   */
  public get session() {
    return this._session;
  }

  /**
   * Returns the status message
   */
  public get status() {
    return this._status;
  }

  /**
   * Returns the total count of possible results
   */
  public get total() {
    return this._total;
  }

  /**
   * Manually sets the status code
   */
  public set code(code: number) {
    this._code = code;
  }

  /**
   * Sets Dispatcher
   */
  public set dispatcher(dispatcher: ResponseDispatcher) {
    this._dispatcher = dispatcher;
  }

  /**
   * Manually sets the status message
   */
  public set status(status: string) {
    this._status = status;
  }

  /**
   * Manually sets the total count of possible results
   */
  public set total(total: number) {
    this._total = total;
  }

  /**
   * Dispatches the response
   */
  public async dispatch() {
    //if it's already sent, return
    if (this._sent) {
      return this;
    }
    //if there is a loader is a function, use that
    if (typeof this._dispatcher === 'function') {
      await this._dispatcher(this);
    }
    //flag as sent
    this._sent = true;
    return this;
  }
}