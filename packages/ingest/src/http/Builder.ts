//modules
import type { ProjectOptions } from 'ts-morph';
import { IndentationText } from 'ts-morph';
//buildtime
import type { 
  BuilderOptions,
  BuildOptions,
  TranspileInfo,
  Transpiler
} from '../buildtime/types';
import Router from '../buildtime/Router';
import { createSourceFile } from '../buildtime/helpers';

export default class Builder {
  //router
  protected _router: Router;
  //ts-morph options
  protected _tsconfig: ProjectOptions;

  /**
   * Sets the context and options
   */
  public constructor(router: Router, options: BuilderOptions = {}) {
    this._router = router;
    this._tsconfig = {
      tsConfigFilePath: options.tsconfig,
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        // Generates corresponding '.d.ts' file.
        declaration: true, 
        // Generates a sourcemap for each corresponding '.d.ts' file.
        declarationMap: true, 
        // Generates corresponding '.map' file.
        sourceMap: true
      },
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces
      }
    };
  }

  /**
   * Creates an entry file
   */
  public transpile(info: TranspileInfo) {
    //create a new source file
    const { source } = createSourceFile('entry.ts', this._tsconfig);
    //import type { IncomingMessage, ServerResponse } from 'http';
    source.addImportDeclaration({
      isTypeOnly: true,
      moduleSpecifier: 'http',
      namedImports: [ 'IncomingMessage', 'ServerResponse' ]
    });
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
    //import Server from '@stackpress/ingest/dist/http/Server';
    source.addImportDeclaration({
      moduleSpecifier: '@stackpress/ingest/dist/http/Server',
      defaultImport: 'Server'
    });
    //import task1 from [entry]
    info.actions.forEach((entry, i) => {
      source.addImportDeclaration({
        moduleSpecifier: entry,
        defaultImport: `task_${i}`
      });
    });
    const im = 'IncomingMessage';
    const sr = 'ServerResponse<IncomingMessage>';
    const action = `ActionCallback<${im}, ${sr}>`;
    source.addFunction({
      isDefaultExport: true,
      name: info.method,
      parameters: [
        { name: 'request', type: im },
        { name: 'response', type: sr },
        { name: 'route', type: `Route<${action}, ${im}, ${sr}>` }
      ],
      statements: (`
        const server = new Server();
        const listeners = new Set<ActionPayloadCallback>();
        ${info.actions.map(
          (_, i) => `listeners.add(task_${i});`
        ).join('\n')}
        return server.handle(listeners, route, request, response);
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
    const json = Array.from(results.build).map(result => {
      return { ...result, pattern: result.pattern?.toString() };
    });
    manifest.loader.fs.writeFileSync(
      manifest.path, 
      JSON.stringify(json, null, 2), 
      'utf-8'
    );

    return results;
  }
}