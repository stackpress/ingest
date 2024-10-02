import type { 
  BuildOptions, 
  TranspileInfo, 
  Transpiler 
} from '@stackpress/ingest/dist/buildtime/types';

import path from 'path';
import { createSourceFile } from '@stackpress/ingest/dist/buildtime/helpers';
import HTTPBuilder from '@stackpress/ingest/dist/http/Builder';

export default class Builder extends HTTPBuilder{
  /**
   * Creates an entry file
   */
  public transpile(info: TranspileInfo) {
    //create a new source file
    const { source } = createSourceFile('entry.ts', this._tsconfig);
    //import Server from '@stackpress/ingest-vercel/dist/Server';
    source.addImportDeclaration({
      moduleSpecifier: '@stackpress/ingest-vercel/dist/Server',
      defaultImport: 'Server'
    });
    //import TaskQueue from '@stackpress/ingest/dist/runtime/TaskQueue';
    source.addImportDeclaration({
      moduleSpecifier: '@stackpress/ingest/dist/runtime/TaskQueue',
      defaultImport: 'TaskQueue'
    });
    //import task1 from [entry]
    info.entries.forEach((entry, i) => {
      source.addImportDeclaration({
        moduleSpecifier: entry,
        defaultImport: `task_${i}`
      });
    });

    source.addFunction({
      isExported: true,
      //isAsync: true,
      name: info.method,
      parameters: [{ name: 'request', type: 'Request' }],
      statements: (`
        const server = new Server();
        const queue = new TaskQueue();
        ${info.entries.map(
          (_, i) => `queue.add(task_${i});`
        ).join('\n')}
        return server.handle(request, queue);
      `).trim()
    });
    return source;
  }

  /**
   * Builds the final entry files
   */
  public async build(options: BuildOptions = {}) {
    const manifest = this._router.manifest(options);
    const transpiler: Transpiler = entries => {
      return this.transpile(entries);
    }
    const results = await manifest.build(transpiler);
    //write the manifest to disk
    const json = {
      version: 2,
      rewrites: Array
        .from(results.build)
        .filter(result => result.type === 'endpoint')
        .map(result => ({ 
          source: result.route,
          destination: `/api/${result.id}`
        }))
    };
    manifest.loader.fs.writeFileSync(
      path.join(manifest.loader.cwd, 'vercel.json'), 
      JSON.stringify(json, null, 2), 
      'utf-8'
    );
    return results;
  }
}