//event types
export type * from '../framework/types';
//filesystem types
export type * from '../filesystem/types';
//payload types
export type * from '../payload/types';
//http types
export type { GatewayAction, GatewayListener } from './gateway/types';
export type { IM, SR } from './types';

//modules
import type { ServerOptions } from 'http';
import path from 'path';
//filesystem
import NodeFS from '../filesystem/NodeFS';
import FileLoader from '../filesystem/FileLoader';
//framework
import FrameworkEmitter from '../framework/Queue';
import FrameworkRouter from '../framework/Router';
import FrameworkStatus from '../framework/Status';
//payload
import ArgString from '../payload/processors/ArgString';
import FileData from '../payload/processors/FileData';
import FormData from '../payload/processors/FormData';
import PathString from '../payload/processors/PathString';
import QueryString from '../payload/processors/QueryString';
import ReadonlyMap from '../payload/readonly/Map';
import ReadonlyNest from '../payload/readonly/Nest';
import ReadonlyPath from '../payload/readonly/Path';
import ReadonlySet from '../payload/readonly/Set';
import Nest from '../payload/Nest';
import Request from '../payload/Request';
import Response from '../payload/Response';
import { ReadSession, WriteSession } from '../payload/Session';
//buildtime
import type { BuildtimeOptions } from '../buildtime/types';
import BuildtimeRouter from '../buildtime/Router';
import BuildtimeServer from '../buildtime/Server';
//gateway
import GatewayRouter from './gateway/Router';
import GatewayServer from './gateway/Server';
//http
import Builder from './Builder';
import Server from './Server';
import {
  formDataToObject,
  imQueryToObject,
  imToURL,
  loader,
  dispatcher
} from './helpers';


export {
  //filesystem
  NodeFS,
  FileLoader,
  //payload
  ArgString,
  FileData,
  FormData,
  PathString,
  QueryString,
  ReadonlyMap,
  ReadonlyNest,
  ReadonlyPath,
  ReadonlySet,
  Nest,
  Request,
  Response,
  ReadSession,
  WriteSession,
  //framework
  FrameworkEmitter,
  FrameworkRouter,
  FrameworkStatus,
  //buildtime
  BuildtimeRouter,
  BuildtimeServer,
  //http
  GatewayRouter,
  GatewayServer,
  Builder,
  Server,
  formDataToObject,
  imQueryToObject,
  imToURL,
  loader,
  dispatcher
}

export default function http(options: BuildtimeOptions = {}) {
  const { 
    tsconfig, 
    router = new BuildtimeRouter(),
    fs = new NodeFS(),
    cwd = process.cwd(),
    buildDir = './.http', 
    manifestName = 'manifest.json',
    ...build 
  } = options;
  
  const loader = new FileLoader(fs, cwd);
  const builder = new Builder(router, { tsconfig });
  const endpath = loader.absolute(buildDir);
  const manifest = path.resolve(endpath, manifestName);
  const server = new GatewayServer(manifest, loader);
  const developer = new BuildtimeServer(router);

  return {
    endpath,
    manifest,
    developer,
    server,
    router,
    builder,
    loader,
    build: () => builder.build({ ...build, fs, cwd, buildDir, manifestName }),
    create: (options: ServerOptions = {}) => server.create(options),
    develop: (options: ServerOptions = {}) => developer.create(options),
    on: (path: string, entry: string, priority?: number) => {
      return router.on(path, entry, priority);
    },
    unbind: (event: string, entry: string) => {
      return router.unbind(event, entry);
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