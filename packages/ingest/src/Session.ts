//stackprss
import ReadonlyMap from '@stackpress/lib/dist/data/ReadonlyMap';
//local
import type { Revision, CallableSession } from './types';

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

/**
 * Callable Session
 */
export function session(data?: [string, string|string[]][]): CallableSession {
  const store = new WriteSession(data);
  const callable = Object.assign(
    (name: string) => store.get(name),
    {
      clear: () => store.clear(),
      delete: (name: string) => store.delete(name),
      entries: () => store.entries(),
      forEach: (
        callback: (value: string|string[], key: string, map: Map<string, string|string[]>) => void
      ) => store.forEach(callback),
      get: (name: string) => store.get(name),
      has: (name: string) => store.has(name),
      keys: () => store.keys(),
      set: (name: string, value: string|string[]) => store.set(name, value),
      values: () => store.values()
    } as WriteSession
  );
  //magic size/data property
  Object.defineProperty(callable, 'size', { get: () => store.size });
  Object.defineProperty(callable, 'data', { get: () => store.data });
  Object.defineProperty(callable, 'revisions', { get: () => store.revisions });
  return callable;
}