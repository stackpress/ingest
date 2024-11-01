import type { FetchPayload } from './types';
import TaskQueue from '@stackpress/types/dist/TaskQueue';

export default class Queue extends TaskQueue<FetchPayload> {}