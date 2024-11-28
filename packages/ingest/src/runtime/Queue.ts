//stackpress
import TaskQueue from '@stackpress/types/dist/TaskQueue';
//common
import type Context from '../Context';
import type Response from '../Response';

export default class Queue extends TaskQueue<[ Context, Response ]> {}