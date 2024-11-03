//payload types
export type * from '../payload/types';
//http types
export type * from '../gateway/types';
export type * from './types';

//modules
import type { ServerOptions } from 'http';
//payload
import Request from '../payload/Request';
import Response from '../payload/Response';
import { ReadSession, WriteSession } from '../payload/Session';
//buildtime
import type { BuildtimeOptions } from '../buildtime/types';
import buildtime, { 
  Router as BuildtimeRouter, 
  Server as BuildtimeServer 
} from '../buildtime';
//gateway
import GatewayRouter from '../gateway/Router';
import GatewayServer from '../gateway/Server';
//http
import Builder from './Builder';
import Queue from './Queue';
import Router from './Router';
import Server from './Server';
import {
  formDataToObject,
  imQueryToObject,
  imToURL,
  loader,
  dispatcher
} from './helpers';


export {
  //payload
  Request,
  Response,
  ReadSession,
  WriteSession,
  //buildtime
  BuildtimeRouter,
  BuildtimeServer,
  //gateway
  GatewayRouter,
  GatewayServer,
  //http
  Builder,
  Queue,
  Router,
  Server,
  formDataToObject,
  imQueryToObject,
  imToURL,
  loader,
  dispatcher
}

export default function http(options: BuildtimeOptions = {}) {
  options.buildDir = options.buildDir || './.http';
  const build = buildtime(options);

  const { 
    buildDir,
    manifestName, 
    loader, 
    router, 
    manifest,
    create,
    server: developer
  } = build;
  const { fs, cwd } = loader;

  const builder = new Builder(router, { tsconfig: options.tsconfig });
  const server = new GatewayServer(manifest, loader);

  return {
    ...build,
    developer,
    builder,
    server,
    build: () => builder.build({ ...options, fs, cwd, buildDir, manifestName }),
    create: (options: ServerOptions = {}) => server.create(options),
    develop: create
  };
};