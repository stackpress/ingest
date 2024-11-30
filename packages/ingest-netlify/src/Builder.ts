import type {
  ManifestOptions,
  CookieOptions,
  ServerOptions,
  TranspileInfo, 
  Transpiler,
  UnknownNest
} from '@stackpress/ingest/dist/buildtime/types';

import path from 'path';
import Server from '@stackpress/ingest/dist/buildtime/Server';
import { 
  IndentationText,
  createSourceFile, 
  VariableDeclarationKind 
} from '@stackpress/ingest/dist/buildtime/helpers';

export default class NetlifyBuilder<
  C extends UnknownNest = UnknownNest
> extends Server<C> {
  /**
   * Loads the plugins and returns the factory
   */
  public static async bootstrap<
    C extends UnknownNest = UnknownNest
  >(options: ServerOptions = {}) {
    const factory = new NetlifyBuilder<C>(options);
    return await factory.bootstrap();
  }

  /**
   * Creates an entry file
   */
  public transpile(info: TranspileInfo) {
    const tsconfig = this.config<string>('server', 'tsconfig') 
      || path.join(this.loader.cwd, 'tsconfig.json');
    //create a new source file
    const { source } = createSourceFile('entry.ts', {
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
    });
    //get cookie options
    const cookie = JSON.stringify(
      this.config<CookieOptions>('cookie') || { path: '/' }
    );
    //import type { RouteAction } from '@stackpress/ingest/dist/runtime/fetch/types'
    source.addImportDeclaration({
      isTypeOnly: true,
      moduleSpecifier: '@stackpress/ingest/dist/runtime/fetch/types',
      namedImports: [ 'RouteAction' ]
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
        const actions = new Set<RouteAction>();
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
    const transpiler: Transpiler = entries => {
      return this.transpile(entries);
    }
    const manifest = this.router.manifest({
      buildDir: './.netlify/functions',
      ...options
    });
    return await manifest.build(transpiler);
  }
}