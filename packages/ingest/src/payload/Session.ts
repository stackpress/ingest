import type { Revision } from '../runtime/types';

/**
 * Readonly session controller
 */
export class ReadSession extends Map<string, string|string[]> {
  /**
   * Returns the session data
   */
  public get data() {
    return Object.fromEntries(this);
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
    super.clear();
  }

  /**
   * Delete a session entry
   */
  public delete(name: string) {
    this.revisions.set(name, { action: 'remove' });
    return super.delete(name);
  }

  /**
   * Set a session entry
   */
  public set(name: string, value: string|string[]) {
    this.revisions.set(name, { action: 'set', value });
    return super.set(name, value);
  }
}