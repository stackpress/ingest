export type {
  ErrorList,
  NestedObject,
  Scalar,
  Hash,
  ScalarInput,
  Index,
  FileMeta,
  StatusCode,
  TaskRunner,
  Task,
  Event,
  Listenable,
  Method,
  URI,
  Body as PayloadBody,
  RequestLoader,
  ResponseDispatcher,
  CookieOptions,
  BuildType,
  SoftRequest,
  Handler
} from './runtime/types';

import Nest from './payload/Nest';
import Payload from './payload/Payload';
import Request from './payload/Request';
import Response from './payload/Response';
import { ReadSession, WriteSession } from './payload/Session';

import Status from './runtime/StatusCode';
import TaskQueue from './runtime/TaskQueue';
import EventEmitter from './runtime/EventEmitter';
import Context from './runtime/Context';

import Exception from './Exception';

import {
  isHash,
  objectFromQuery,
  objectFromFormData,
  objectFromJson,
  withUnknownHost
} from './runtime/helpers';

export {
  Nest,
  Payload,
  Request,
  Response,
  ReadSession,
  WriteSession,
  Status,
  TaskQueue,
  EventEmitter,
  Context,
  Exception,
  isHash,
  objectFromQuery,
  objectFromFormData,
  objectFromJson,
  withUnknownHost
};

/**
 * Basic task wrapper
 */
export function task(runner: (
  req: Request, 
  res: Response, 
  ctx: Context
) => void) {
  return runner;
};