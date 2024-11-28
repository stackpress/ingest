import type {
  ManifestOptions,
  ProjectOptions,
  FactoryOptions,
  TranspileInfo, 
  Transpiler,
  UnknownNest
} from '@stackpress/ingest/dist/buildtime/types';

import path from 'path';
import Factory from '@stackpress/ingest/dist/buildtime/Factory';
import { 
  IndentationText,
  createSourceFile
} from '@stackpress/ingest/dist/buildtime/helpers';

export default class VercelFactory<
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
    //this is the interface required by vercel functions...
    // /resize/100/50 would be rewritten to /api/sharp?width=100&height=50
    source.addFunction({
      isDefaultExport: info.method === 'ALL',
      isExported: info.method !== 'ALL',
      //isAsync: true,
      name: info.method,
      parameters: [{ name: 'request', type: 'Request' }],
      statements: (`
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
    options.buildDir = options.buildDir || './api';
    const transpiler: Transpiler = entries => {
      return this.transpile(entries);
    }
    const results = await this._build(transpiler, options);
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
    this.loader.fs.writeFileSync(
      path.join(this.loader.cwd, 'vercel.json'), 
      JSON.stringify(json, null, 2)
    );
    return results;
  }
}