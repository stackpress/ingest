//framework
import type { StatusCode, EventListener } from './types';
import type Event from './Event';

/**
 * An abstract class, Emitter adds sorts actions in a queue. You need to 
 * define how it emits. The generics needed are the following.
 * 
 * - A - Action. Examples of an action could be a callback function or a 
 *   file location of an action callback.
 * - R - Request. The request object. Examples of a request could be 
 *   IncomingMessage, Fetch Request or the built-in `Request` defined
 *   in the `payload` folder. Though most of the time it should be the 
 *   built-in `Request` defined in the `payload` folder, we left this 
 *   generic to allow the `gateway` folder to re-use this class for 
 *   IncomingMessage.
 * - S - Response. The response object. Examples of a response could be 
 *   ServerResponse, Fetch Response or the built-in `Response` defined
 *   in the `payload` folder. Though most of the time it should be the 
 *   built-in `Response` defined in the `payload` folder, we left this 
 *   generic to allow the `gateway` folder to re-use this class for 
 *   ServerResponse.
 * 
 * The abstract function that needs to be defined looks like the following.
 * 
 * ```js
 * public abstract emit(
 *   req: R, 
 *   res: S, 
 *   event?: Event<A, R, S>,
 *   cache?: boolean
 * ): Promise<StatusCode>;
 * ```
 * 
 * The `buildtime` defines `emit()` to import an action file defined in 
 * the file router and calls it. The `runtime` uses `emit()` to simply 
 * call the action callback. The `gateway` uses `emit()` also to call 
 * the action callback, but passes IM, SR to the action.
 * 
 * `emit()` returns a `StatusCode` these codes are useful to find out 
 * what happened after the `emit()` was called. For example if there are 
 * no actions, the `Status` will be `NOT_FOUND`. If any of the actions 
 * returns `false`, then the next actions won't be called and the 
 * `Status` will be `ABORTED`. If all actions were called and the last 
 * one did not return `false`, then the `Status` will be `OK`.
 */
export default abstract class Emitter<A, R, S> {
  //The in memory task queue. Dont use 
  //Set because we will be sorting constantly
  public readonly queue: EventListener<A, R, S>[] = [];
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
  public add(event: Event<A, R, S>, action: A, priority: number = 0) {
    if (priority > this._upper) {
      this._upper = priority;
    } else if (priority < this._lower) {
      this._lower = priority;
    }

    //fifo by default
    this.queue.push({ event, action, priority });

    //then sort by priority
    this.queue.sort((a, b) => {
      return a.priority <= b.priority ? 1: -1;
    })

    return this;
  }

  /**
   * Adds a task to the bottom of the queue
   */
  public push(event: Event<A, R, S>, action: A) {
    return this.add(event, action, this._lower - 1);
  }

  /**
   * Adds a task to the top of the queue
   */
  public shift(event: Event<A, R, S>, action: A) {
    return this.add(event, action, this._upper + 1);
  }

  /**
   * Runs the tasks
   */
  public abstract emit(
    req: R, 
    res: S, 
    event?: Event<A, R, S>,
    cache?: boolean
  ): Promise<StatusCode>;
};