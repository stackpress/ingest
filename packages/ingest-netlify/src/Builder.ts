import type {
  BuilderOptions, 
  ProjectOptions,
  TranspileInfo, 
  Transpiler 
} from '@stackpress/ingest/dist/buildtime/types';

import Builder from '@stackpress/ingest/dist/buildtime/Builder';
import { 
  IndentationText,
  createSourceFile, 
  VariableDeclarationKind 
} from '@stackpress/ingest/dist/buildtime/helpers';

export default class NetlifyBuilder extends Builder {
  //ts-morph options
  public readonly tsconfig: ProjectOptions;

  /**
   * Sets up the builder
   */
  public constructor(options: BuilderOptions = {}) {
    options.buildDir = options.buildDir || './.netlify/functions';
    super(options);
    this.tsconfig = {
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
    const { source } = createSourceFile('entry.ts', this.tsconfig);
    //import type { FetchAction } from '@stackpress/ingest/dist/runtime/fetch/types'
    source.addImportDeclaration({
      isTypeOnly: true,
      moduleSpecifier: '@stackpress/ingest/dist/runtime/fetch/types',
      namedImports: [ 'FetchAction' ]
    });
    //import Server from '@stackpress/ingest/dist/runtime/fetch/Server';
    source.addImportDeclaration({
      moduleSpecifier: '@stackpress/ingest/dist/runtime/fetch/Server',
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
  public async build() {
    const transpiler: Transpiler = entries => {
      return this.transpile(entries);
    }
    return await super.build(transpiler);
  }
}