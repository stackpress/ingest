//stackpress
import TaskQueue from '@stackpress/types/dist/TaskQueue';
//local
import type { FetchPayload } from './types';

export default class Queue extends TaskQueue<FetchPayload> {}