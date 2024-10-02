import type { Entry } from './types';

/**
 * A task queue linearly executes each task
 */
export default class TaskSorter {
  //The in memory task queue. Dont use 
  //Set because we will be sorting constantly
  public readonly tasks: Entry[] = [];

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
    return this.tasks.length;
  }

  /**
   * Adds a task to the queue
   */
  public add(entry: string, priority: number = 0) {
    if (priority > this._upper) {
      this._upper = priority;
    } else if (priority < this._lower) {
      this._lower = priority;
    }

    //fifo by default
    this.tasks.push({ entry, priority });

    //then sort by priority
    this.tasks.sort((a, b) => {
      return a.priority <= b.priority ? 1: -1;
    })

    return this;
  }

  /**
   * Adds a task to the bottom of the queue
   */
  public push(entry: string) {
    return this.add(entry, this._lower - 1);
  }

  /**
   * Adds a task to the top of the queue
   */
  public shift(entry: string) {
    return this.add(entry, this._upper + 1);
  }
};
