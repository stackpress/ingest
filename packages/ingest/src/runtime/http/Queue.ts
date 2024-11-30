//stackpress
import type { UnknownNest } from '@stackpress/types/dist/types';
import TaskQueue from '@stackpress/types/dist/TaskQueue';
//common
import type Response from '../../Response';
//local
import type { RouteContext } from './types';

export default class Queue<C extends UnknownNest = UnknownNest> 
  extends TaskQueue<[ RouteContext<C>, Response ]> 
{}