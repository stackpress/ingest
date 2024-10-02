import type { PluginBuild } from 'esbuild';
import type { SourceFile } from 'ts-morph';
import type FileLoader from './filesystem/FileLoader';

import path from 'path';
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