import type { HTTPPayload } from './types';
import TaskQueue from '@stackpress/types/dist/TaskQueue';

export default class Queue extends TaskQueue<HTTPPayload> {}