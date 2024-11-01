//modules
import type { SourceFile } from 'ts-morph';
import type { Method } from '@stackpress/types/dist/types';
//filesystem
import type { FileSystem } from '../filesystem/types';
//payload
import type Request from '../payload/Request';
import type Response from '../payload/Response';
//common
import type { IM, SR } from '../http/types';
//buildtime
import type Router from './Router';

//--------------------------------------------------------------------//
// Build Types

export type BuildPayload = [ Request<IM>, Response<SR> ];
export type BuildMap = Record<string, BuildPayload>;
export type BuildTask = { entry: string, priority: number };

export type BuildType = 'function' | 'endpoint';

export type BuildInfo = {
  type: BuildType,
  method: Method,
  event: string,
  route: string,
  pattern?: RegExp,
  tasks: Set<BuildTask>
};

export type BuildResult = {
  id: string;
  type: BuildType;
  method: Method;
  event: string;
  route: string;
  pattern?: RegExp;
  entry: string
};

export type BuildManifest = Set<BuildInfo>;

export type TranspileInfo = {
  type: BuildType,
  method: Method,
  event: string,
  route: string,
  pattern?: RegExp,
  actions: string[]
};

export type Transpiler = (info: TranspileInfo) => SourceFile;

export type ESBuildOptions = {
  minify?: boolean,
  bundle?: boolean,
  platform?: 'node'|'browser',
  globalName?: string,
  format?: 'iife'|'esm'|'cjs',
  preserveSymlinks?: boolean,
  write?: boolean,
  plugins?: {
    name: string,
    setup: Function
  }[]
};

export type BuildOptions = ESBuildOptions & {
  fs?: FileSystem,
  cwd?: string,
  buildDir?: string,
  manifestName?: string
};

export type BuilderOptions = {
  tsconfig?: string
};

export type BuildtimeOptions = BuildOptions & BuilderOptions & {
  router?: Router
};