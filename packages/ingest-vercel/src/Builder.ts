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
    //import type { ActionCallback } from '@stackpress/ingest/dist/framework/types'
    source.addImportDeclaration({
      isTypeOnly: true,
      moduleSpecifier: '@stackpress/ingest/dist/framework/types',
      namedImports: [ 'ActionCallback' ]
    });
    //import type Route from '@stackpress/ingest/dist/framework/Route';
    source.addImportDeclaration({
      isTypeOnly: true,
      moduleSpecifier: '@stackpress/ingest/dist/framework/Route',
      defaultImport: 'Route'
    });
    //import Server from '@stackpress/ingest-vercel/dist/Server';
    source.addImportDeclaration({
      moduleSpecifier: '@stackpress/ingest-vercel/dist/Server',
      defaultImport: 'Server'
    });
    //import task1 from [entry]
    info.actions.forEach((entry, i) => {
      source.addImportDeclaration({
        moduleSpecifier: entry,
        defaultImport: `task_${i}`
      });
    });
    //this is the interface required by vercel functions...
    // /resize/100/50 would be rewritten to /api/sharp?width=100&height=50
    source.addFunction({
      isExported: true,
      //isAsync: true,
      name: info.method,
      parameters: [{ name: 'request', type: 'Request' }],
      statements: (`
        const server = new Server();
        const listeners = new Set<ActionPayloadCallback>();
        //in vercel, params are converted to query in request
        ${info.actions.map(
          (_, i) => `listeners.add(task_${i});`
        ).join('\n')}
        return server.handle(listeners, request);
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
          source: result.route
            //replace the stars
            //* -> ([^/]+)
            .replaceAll('*', '([^/]+)')
            //** -> ([^/]+)([^/]+) -> (.*)
            .replaceAll('([^/]+)([^/]+)', '(.*)'),
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