//modules
import type { SourceFile, ProjectOptions } from 'ts-morph';
import type { PluginBuild, BuildResult as ESBuildResult } from 'esbuild';
//stackpress
import type { Method, UnknownNest } from '@stackpress/types/dist/types';
import type FileSystem from '@stackpress/types/dist/filesystem/FileSystem';
//common
import type { CookieOptions, PluginLoaderOptions } from '../types';
import type Request from '../Request';
import type Response from '../Response';
//local
import type Router from './Router';

export type { SourceFile, ProjectOptions, CookieOptions, UnknownNest };

//--------------------------------------------------------------------//
// Build Types

export type BuildMap = Record<string, [ Request, Response ]>;
export type BuildTask = { entry: string, priority: number };

export type BuildType = 'function' | 'endpoint';

//this is the data struct generated in router
export type BuildInfo = {
  type: BuildType,
  method: Method,
  event: string,
  route: string,
  pattern?: RegExp,
  tasks: Set<BuildTask>
};

// this is the data struct generated in manifest
export type BuildData = {
  id: string;
  type: BuildType;
  method: Method;
  event: string;
  route: string;
  pattern?: RegExp;
  entry: string
};

export type BuildResult = {
  build: Set<BuildData>,
  results: ESBuildResult<{
    outdir: string;
    entryPoints: string[];
    plugins: {
        name: string;
        setup: (build: PluginBuild) => void;
    }[];
    minify?: boolean;
    bundle?: boolean;
    platform?: "node" | "browser";
    globalName?: string;
    format?: "iife" | "esm" | "cjs";
    preserveSymlinks?: boolean;
    write?: boolean;
  }>,
  vfs: Map<string, SourceFile>
};

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

export type ManifestOptions = ESBuildOptions & {
  fs?: FileSystem,
  cwd?: string,
  buildDir?: string,
  manifestName?: string
};

export type ServerOptions = PluginLoaderOptions & {
  router?: Router,
  cookie?: CookieOptions,
  size?: number,
  tsconfig?: string
}