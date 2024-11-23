import type { Revision } from './types';

import ReadonlyMap from '@stackpress/types/dist/readonly/Map';

/**
 * Readonly session controller
 */
export class ReadSession extends ReadonlyMap<string, string|string[]> {
  /**
   * Returns the session data
   */
  public get data() {
    return Object.fromEntries(this._map);
  }
}

/**
 * Session controller that can write to response
 */
export class WriteSession extends ReadSession {
  //entries of what has been changed
  public readonly revisions = new Map<string, Revision>();

  /**
   * Clear the session
   */
  public clear(): void {
    for (const name of this.keys()) {
      this.revisions.set(name, { action: 'remove' });
    }
    this._map.clear();
  }

  /**
   * Delete a session entry
   */
  public delete(name: string) {
    this.revisions.set(name, { action: 'remove' });
    return this._map.delete(name);
  }

  /**
   * Set a session entry
   */
  public set(name: string, value: string|string[]) {
    this.revisions.set(name, { action: 'set', value });
    return this._map.set(name, value);
  }
}