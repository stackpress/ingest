import type { StatusCode, EventListener } from './types';
import type Request from '../payload/Request';
import type Response from '../payload/Response';
import type Event from './Event';

/**
 * Queues event listeners and runs the specified in order
 */
export default abstract class Emitter<A> {
  //The in memory task queue. Dont use 
  //Set because we will be sorting constantly
  public readonly queue: EventListener<A>[] = [];
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
  public add(event: Event<A>, action: A, priority: number = 0) {
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
  public push(event: Event<A>, action: A) {
    return this.add(event, action, this._lower - 1);
  }

  /**
   * Adds a task to the top of the queue
   */
  public shift(event: Event<A>, action: A) {
    return this.add(event, action, this._upper + 1);
  }

  /**
   * Runs the tasks
   */
  public abstract emit(
    req: Request, 
    res: Response, 
    event?: Event<A>,
    cache?: boolean
  ): Promise<StatusCode>;
};