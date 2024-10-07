//modules
import type { SourceFile } from 'ts-morph';
//framework
import type { Listener, ActionFile, Method } from '../framework/types';
//filesystem
import type { FileSystem } from '../filesystem/types';
//buildtime
import type Router from './Router';

//--------------------------------------------------------------------//
// Build Types

export type BuildType = 'function' | 'endpoint';

export type BuildInfo = {
  type: BuildType,
  method: Method,
  event: string,
  route: string,
  pattern?: RegExp,
  listeners: Set<Listener<ActionFile>>
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