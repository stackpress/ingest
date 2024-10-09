import type { 
  BuildOptions, 
  TranspileInfo, 
  Transpiler 
} from '@stackpress/ingest/dist/buildtime/types';
import { VariableDeclarationKind } from 'ts-morph';
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
    //export const config = { path: '/user/:id' };
    source.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [{
        name: 'config',
        initializer: `{ path: '${info.route}' }`
      }]
    });
    source.addFunction({
      isDefaultExport: true,
      name: info.method,
      parameters: [{ name: 'request', type: 'Request' }],
      statements: (`
        if (request.method.toUpperCase() === '${info.method}') return;
        const server = new Server();
        const listeners = new Set<ActionPayloadCallback>();
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
    return await manifest.build(transpiler);
  }
}