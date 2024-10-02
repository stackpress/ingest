import type { Task, TaskRunner } from './types';
import type Request from '../payload/Request';
import type Response from '../payload/Response';
import type Context from './Context';

import Status from './StatusCode';

/**
 * A task queue linearly executes each task
 */
export default class TaskQueue {
  //The in memory task queue. Dont use 
  //Set because we will be sorting constantly
  public readonly queue: Task[] = [];

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
  add(callback: TaskRunner, priority: number = 0) {
    if (priority > this._upper) {
      this._upper = priority;
    } else if (priority < this._lower) {
      this._lower = priority;
    }

    //fifo by default
    this.queue.push({ callback, priority });

    //then sort by priority
    this.queue.sort((a, b) => {
      return a.priority <= b.priority ? 1: -1;
    })

    return this;
  }

  /**
   * Adds a task to the bottom of the queue
   */
  push(callback: TaskRunner) {
    return this.add(callback, this._lower - 1);
  }

  /**
   * Adds a task to the top of the queue
   */
  shift(callback: TaskRunner) {
    return this.add(callback, this._upper + 1);
  }

  /**
   * Runs the tasks
   */
  public async run(req: Request, res: Response, ctx: Context) {
    if (!this.queue.length) {
      //report a 404
      return Status.NOT_FOUND;
    }

    while (this.queue.length) {
      const task = (this.queue.shift() as Task);
      if (await task.callback(req, res, ctx) === false) {
        return Status.ABORT;
      }
    }

    return Status.OK;
  }
};