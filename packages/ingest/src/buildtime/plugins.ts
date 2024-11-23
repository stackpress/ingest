//modules
import type { PluginBuild } from 'esbuild';
import path from 'path';
//stackpress
import type FileLoader from '@stackpress/types/dist/filesystem/FileLoader';
//local
import type { SourceFile } from './types';
import { toTS } from './helpers';

export function esIngestPlugin(
  vfs: Map<string, SourceFile>, 
  loader: FileLoader,
  extnames = [ '.js', '.json', '.ts' ]
) {
  return {
    name: 'ingest-plugin',
    setup: (build: PluginBuild) => {
      //should resolve everything...
      build.onResolve({ filter: /.*/ }, args => {
        //resolve virtual files...
        if (vfs.has(args.path)) {
          return { 
            path: args.path, 
            namespace: 'ingest-plugin'
          };
        }

        const pwd = args.importer 
          ? path.dirname(args.importer)
          : loader.cwd;
        const resolved = loader.resolve(args.path, pwd, extnames);

        if (resolved) {
          return { path: resolved };
        }
        return undefined;
      });

      build.onLoad(
        { filter: /.*/, namespace: 'ingest-plugin' }, 
        args => {
          const source = vfs.get(args.path) as SourceFile;
          return { contents: toTS(source), loader: 'ts' }
        }
      );
    }
  };
}