//modules
import type { ServerOptions } from 'http';
//filesystem
import NodeFS from '@stackpress/ingest/dist/filesystem/NodeFS';
import FileLoader from '@stackpress/ingest/dist/filesystem/FileLoader';
//payload
import Request from '@stackpress/ingest/dist/payload/Request';
import Response from '@stackpress/ingest/dist/payload/Response';
import { 
  ReadSession, 
  WriteSession 
} from '@stackpress/ingest/dist/payload/Session'; 
//buildtime
import type { BuildtimeOptions } from '@stackpress/ingest/dist/buildtime/types';
import BuildtimeRouter from '@stackpress/ingest/dist/buildtime/Router';
import BuildtimeServer from '@stackpress/ingest/dist/buildtime/Server';
//vercel
import Builder from './Builder';
import Queue from './Queue';
import Router from './Router';
import Server from './Server';

import {
  formDataToObject,
  fetchQueryToObject,
  fetchToURL,
  loader,
  response
} from './helpers';

export {
  //filesystem
  NodeFS,
  FileLoader,
  //payload
  Request,
  Response,
  ReadSession,
  WriteSession,
  //buildtime
  BuildtimeRouter,
  BuildtimeServer,
  //netlify
  Builder,
  Queue,
  Router,
  Server,
  formDataToObject,
  fetchQueryToObject,
  fetchToURL,
  loader,
  response
}

export default function vercel(options: BuildtimeOptions = {}) {
  const { 
    tsconfig, 
    router = new BuildtimeRouter(),
    fs = new NodeFS(),
    cwd = process.cwd(),
    buildDir = './api', 
    ...build 
  } = options;
  
  const loader = new FileLoader(fs, cwd);
  const builder = new Builder(router, { tsconfig });
  const server = new Server();
  const endpath = loader.absolute(buildDir);
  const developer = new BuildtimeServer(router);

  return {
    endpath,
    server,
    developer,
    router,
    builder,
    loader,
    build: () => builder.build({ ...build, fs, cwd, buildDir }),
    develop: (options: ServerOptions = {}) => developer.create(options),
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
  }
}