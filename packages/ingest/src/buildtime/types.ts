import type { SourceFile } from 'ts-morph';
import type { Listener, ActionFile, Method } from '../event/types';
import type { FileSystem } from '../filesystem/types';
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