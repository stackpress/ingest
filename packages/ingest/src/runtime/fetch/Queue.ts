//stackpress
import TaskQueue from '@stackpress/types/dist/TaskQueue';
//local
import type { FetchArgs } from './types';

export default class Queue extends TaskQueue<FetchArgs> {}