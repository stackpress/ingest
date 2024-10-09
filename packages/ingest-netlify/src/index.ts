import type { ServerOptions } from 'http';
import type { BuildtimeOptions } from '@stackpress/ingest/dist/buildtime/types';

import NodeFS from '@stackpress/ingest/dist/filesystem/NodeFS';
import FileLoader from '@stackpress/ingest/dist/filesystem/FileLoader';
import Router from '@stackpress/ingest/dist/buildtime/Router';
import Developer from '@stackpress/ingest/dist/buildtime/Server';

import Builder from './Builder';
import Server from './Server';

import Nest from '@stackpress/ingest/dist/payload/Nest';
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
  Developer,
  Builder,
  Server,
  Nest,
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

export default function vercel(options: BuildtimeOptions = {}) {
  const { 
    tsconfig, 
    router = new Router(),
    fs = new NodeFS(),
    cwd = process.cwd(),
    //default to netlify functions
    buildDir = './.netlify/functions', 
    ...build 
  } = options;
  
  const loader = new FileLoader(fs, cwd);
  const builder = new Builder(router, { tsconfig });
  const server = new Server();
  const endpath = loader.absolute(buildDir);
  const developer = new Developer(router);

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