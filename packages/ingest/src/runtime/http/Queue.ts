//stackpress
import TaskQueue from '@stackpress/types/dist/TaskQueue';
//local
import type { HTTPArgs } from './types';

export default class Queue<C = unknown> extends TaskQueue<HTTPArgs<C>> {}