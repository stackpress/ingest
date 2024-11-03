//modules
import type { ServerOptions } from 'http';
import path from 'path';
import NodeFS from '@stackpress/types/dist/filesystem/NodeFS';
import FileLoader from '@stackpress/types/dist/filesystem/FileLoader';
//payload
export type * from '../payload/types';
import Request from '../payload/Request';
import Response from '../payload/Response';
import { ReadSession, WriteSession } from '../payload/Session';
//buildtime
import type { BuildtimeOptions } from '../buildtime/types';
import EntryEmitter from './Emitter';
import Manifest from './Manifest';
import Router from './Router';
import Server from './Server';
import { esIngestPlugin } from './plugins';
import { toJS, toTS, createSourceFile, serialize } from './helpers';
//helpers
import {
  isHash,
  objectFromQuery,
  objectFromFormData,
  objectFromJson,
  routeParams,
  withUnknownHost,
  task
} from '../helpers';

export type * from './types';

export {
  //payload
  Request,
  Response,
  ReadSession,
  WriteSession,
  //buildtime
  EntryEmitter,
  Manifest,
  Router,
  Server,
  esIngestPlugin,
  toJS,
  toTS,
  createSourceFile,
  serialize,
  //helpers
  isHash,
  objectFromQuery,
  objectFromFormData,
  objectFromJson,
  routeParams,
  withUnknownHost,
  task
};

export default function buildtime(options: BuildtimeOptions = {}) {
  const { 
    router = new Router(),
    fs = new NodeFS(),
    cwd = process.cwd(),
    buildDir = './build', 
    manifestName = 'manifest.json'
  } = options;
  
  const loader = new FileLoader(fs, cwd);
  const endpath = loader.absolute(buildDir);
  const manifest = path.resolve(endpath, manifestName);
  const server = new Server(router);

  return {
    endpath,
    manifest,
    server,
    router,
    loader,
    buildDir,
    manifestName,
    create: (options: ServerOptions = {}) => server.create(options),
    on: (path: string, entry: string, priority?: number) => {
      return router.on(path, entry, priority);
    },
    all: (path: string, entry: string, priority?: number) => {
      return router.all(path, entry, priority);
    },
    connect: (path: string, entry: string, priority?: number) => {
      return router.connect(path, entry, priority);
    },
    delete: (path: string, entry: string, priority?: number) => {
      return router.delete(path, entry, priority);
    },
    get: (path: string, entry: string, priority?: number) => {
      return router.get(path, entry, priority);
    },
    head: (path: string, entry: string, priority?: number) => {
      return router.head(path, entry, priority);
    },
    options: (path: string, entry: string, priority?: number) => {
      return router.options(path, entry, priority);
    },
    patch: (path: string, entry: string, priority?: number) => {
      return router.patch(path, entry, priority);
    },
    post: (path: string, entry: string, priority?: number) => {
      return router.post(path, entry, priority);
    },
    put: (path: string, entry: string, priority?: number) => {
      return router.put(path, entry, priority);
    },
    trace: (path: string, entry: string, priority?: number) => {
      return router.trace(path, entry, priority);
    }
  };
}