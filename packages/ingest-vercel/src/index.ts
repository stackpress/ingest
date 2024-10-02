import type { 
  BuildOptions, 
  BuilderOptions 
} from '@stackpress/ingest/dist/buildtime/types';

import NodeFS from '@stackpress/ingest/dist/buildtime/filesystem/NodeFS';
import FileLoader from '@stackpress/ingest/dist/buildtime/filesystem/FileLoader';
import Router from '@stackpress/ingest/dist/buildtime/Router';

import Builder from './Builder';
import Server from './Server';

import Nest from '@stackpress/ingest/dist/payload/Nest';
import Payload from '@stackpress/ingest/dist/payload/Payload';
import Request from '@stackpress/ingest/dist/payload/Request';
import Response from '@stackpress/ingest/dist/payload/Response';
import { 
  ReadSession, 
  WriteSession 
} from '@stackpress/ingest/dist/payload/Session'; 

import {
  formDataToObject,
  fetchQueryToObject,
  fetchToURL,
  loader,
  response
} from './helpers';

export {
  Builder,
  Server,
  Nest,
  Payload,
  Request,
  Response,
  ReadSession,
  WriteSession,
  formDataToObject,
  fetchQueryToObject,
  fetchToURL,
  loader,
  response
}

export default function vercel(options: BuildOptions & BuilderOptions = {}) {
  const { 
    tsconfig, 
    fs = new NodeFS(),
    cwd = process.cwd(),
    buildDir = './api', 
    ...build 
  } = options;
  
  const loader = new FileLoader(fs, cwd);
  const router = new Router();
  const builder = new Builder(router, { tsconfig });
  const server = new Server();
  const endpath = loader.absolute(buildDir);

  return {
    endpath,
    server,
    router,
    builder,
    loader,
    context: server.context,
    build: () => builder.build({ ...build, fs, cwd, buildDir }),
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
  }
}