//framework
import type { Listener } from './types';

/**
 * An abstract class, Emitter adds sorts actions in a queue. You need to 
 * define how it emits. The generics needed are the following.
 * 
 * - A - Action. Examples of an action could be a callback function or a 
 *   file location of an action callback.
 */
export default class Queue<A> {
  //The in memory task queue. Dont use 
  //Set because we will be sorting constantly
  public readonly queue: Listener<A>[] = [];
  //Used when determining what is the lowest
  //priority when pushing into the queue
  protected _lower: number = 0;
  //Used when determining what is the lowest 
  //priority when shifting into the queue
  protected _upper: number = 0;

  /**
   * The length of the queue
   */
  public get length(): number {
    return this.queue.length;
  }

  /**
   * Adds a task to the queue
   */
  public add(action: A, priority: number = 0) {
    if (priority > this._upper) {
      this._upper = priority;
    } else if (priority < this._lower) {
      this._lower = priority;
    }

    //fifo by default
    this.queue.push({ action, priority });

    //then sort by priority
    this.queue.sort((a, b) => {
      return a.priority <= b.priority ? 1: -1;
    })

    return this;
  }

  /**
   * Adds a task to the bottom of the queue
   */
  public push(action: A) {
    return this.add(action, this._lower - 1);
  }

  /**
   * Adds a task to the top of the queue
   */
  public shift(action: A) {
    return this.add(action, this._upper + 1);
  }
};