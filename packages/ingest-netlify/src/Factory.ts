import type {
  ManifestOptions,
  ProjectOptions,
  FactoryOptions,
  TranspileInfo, 
  Transpiler,
  UnknownNest
} from '@stackpress/ingest/dist/buildtime/types';

import Factory from '@stackpress/ingest/dist/buildtime/Factory';
import { 
  IndentationText,
  createSourceFile, 
  VariableDeclarationKind 
} from '@stackpress/ingest/dist/buildtime/helpers';

export default class NetlifyFactory<
  C extends UnknownNest = UnknownNest
> extends Factory<C> {
  //ts-morph options
  public readonly tsconfig: ProjectOptions;

  /**
   * Sets up the builder
   */
  public constructor(options: FactoryOptions = {}) {
    const { tsconfig = '../tsconfig.json', ...config } = options;
    super(config);
    this.tsconfig = {
      tsConfigFilePath: tsconfig,
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
    //get cookie options
    const cookie = JSON.stringify(this.server.cookie || {});
    //import type { FetchAction } from '@stackpress/ingest/dist/runtime/fetch/types'
    source.addImportDeclaration({
      isTypeOnly: true,
      moduleSpecifier: '@stackpress/ingest/dist/runtime/fetch/types',
      namedImports: [ 'FetchAction' ]
    });
    //import Route from '@stackpress/ingest/dist/runtime/fetch/Route';
    source.addImportDeclaration({
      moduleSpecifier: '@stackpress/ingest/dist/runtime/fetch/Route',
      defaultImport: 'Route'
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
        const route = new Route({ cookie: ${cookie} });
        const actions = new Set<FetchAction>();
        ${info.actions.map(
          (_, i) => `actions.add(task_${i});`
        ).join('\n')}
        return route.handle('${info.route}', actions, request);
      `).trim()
    });
    return source;
  }

  /**
   * Builds the final entry files
   */
  public async build(options: ManifestOptions = {}) {
    options.buildDir = options.buildDir || './.netlify/functions';
    const transpiler: Transpiler = entries => {
      return this.transpile(entries);
    }
    return await this._build(transpiler, options);
  }
}