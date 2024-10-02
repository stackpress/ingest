import type { RequestLoader } from '../runtime/types';

import Payload from './Payload';
import { ReadSession } from './Session';

export default class Request extends Payload {
  //whether if the body was loaded
  protected _loaded = false;
  //body loader
  protected _loader?: RequestLoader;
  //session controller
  protected _session = new ReadSession();

  /**
   * Returns whether if the body was loaded
   */
  public get loaded() {
    return this._loaded;
  }

  /**
   * Returns the session controller
   */
  public get session() {
    return this._session;
  }

  /**
   * Sets Loader
   */
  public set loader(loader: RequestLoader) {
    this._loader = loader;
  }

  /**
   * Loads the body
   */
  public async load() {
    //if it's already loaded, return
    if (this._loaded) {
      return this;
    }
    //if there is a loader is a function, use that
    if (typeof this._loader === 'function') {
      await this._loader(this);
    }
    //flag as loaded
    this._loaded = true;
    return this;
  }
}