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
    //import type { FetchAction } from '@stackpress/ingest-netlify/dist/types'
    source.addImportDeclaration({
      isTypeOnly: true,
      moduleSpecifier: '@stackpress/ingest-netlify/dist/types',
      namedImports: [ 'FetchAction' ]
    });
    //import Server from '@stackpress/ingest-netlify/dist/Server';
    source.addImportDeclaration({
      moduleSpecifier: '@stackpress/ingest-netlify/dist/Server',
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
        if (request.method.toUpperCase() !== '${info.method}') return;
        const server = new Server();
        const actions = new Set<FetchAction>();
        ${info.actions.map(
          (_, i) => `actions.add(task_${i});`
        ).join('\n')}
        return server.handle(actions, request);
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