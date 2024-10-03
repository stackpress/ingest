import type { ServerOptions } from 'http';
import type { BuildOptions, BuilderOptions } from '../buildtime/types';

export type { IM, SR } from './helpers';

import path from 'path';
import NodeFS from '../buildtime/filesystem/NodeFS';
import FileLoader from '../buildtime/filesystem/FileLoader';
import Router from '../buildtime/Router';

import Builder from './Builder';
import Developer from './Developer';
import Server from './Server';

import Nest from '../payload/Nest';
import Payload from '../payload/Payload';
import Request from '../payload/Request';
import Response from '../payload/Response';
import { ReadSession, WriteSession } from '../payload/Session'; 

import {
  formDataToObject,
  imQueryToObject,
  imToURL,
  loader,
  dispatcher
} from './helpers';

export {
  Builder,
  Developer,
  Server,
  Nest,
  Payload,
  Request,
  Response,
  ReadSession,
  WriteSession,
  formDataToObject,
  imQueryToObject,
  imToURL,
  loader,
  dispatcher
}

export default function http(options: BuildOptions & BuilderOptions = {}) {
  const { 
    tsconfig, 
    fs = new NodeFS(),
    cwd = process.cwd(),
    buildDir = './.http', 
    manifestName = 'manifest.json',
    ...build 
  } = options;
  
  const loader = new FileLoader(fs, cwd);
  const router = new Router();
  const builder = new Builder(router, { tsconfig });
  const endpath = loader.absolute(buildDir);
  const manifest = path.resolve(endpath, manifestName);
  const server = new Server(manifest, loader);
  const developer = new Developer(router);

  return {
    endpath,
    manifest,
    developer,
    server,
    router,
    builder,
    loader,
    context: server.context,
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