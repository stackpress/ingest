//stackpress
import TaskQueue from '@stackpress/types/dist/TaskQueue';
//local
import type { HTTPPayload } from './types';

export default class Queue extends TaskQueue<HTTPPayload> {}