//modules
import type { ServerOptions } from 'http';
import path from 'path';
//stackpress
import NodeFS from '@stackpress/types/dist/filesystem/NodeFS';
import FileLoader from '@stackpress/types/dist/filesystem/FileLoader';
//local
import type { ManifestOptions, BuilderOptions, Transpiler } from './types';
import Router from './Router';
import Server from './Server';

export default class Builder<C = unknown> {
  //path to build directory
  public readonly buildPath: string;
  //path to client
  public readonly clientPath?: string;
  //path to manifest file
  public readonly manifestPath: string;
  //file loader
  public readonly loader: FileLoader;
  //local server
  public readonly server: Server<C>;
  //build router
  public readonly router: Router<C>;
  //builder config
  public readonly config: ManifestOptions;

  /**
   * Sets up the builder
   */
  public constructor(options: BuilderOptions<C> = {}) {
    const { 
      router = new Router<C>(),
      fs = new NodeFS(),
      cwd = process.cwd(),
      buildDir = './build', 
      manifestName = 'manifest.json',
      cookie = { path: '/' },
      clientPath,
      client,
      ...config
    } = options;

    this.config = Object.freeze({ 
      ...config, 
      fs, 
      cwd, 
      buildDir, 
      manifestName 
    });

    this.router = router;
    this.server = new Server<C>(router, { client, cookie });
    this.loader = new FileLoader(fs, cwd);
    this.buildPath = this.loader.absolute(buildDir);
    this.clientPath = clientPath;
    this.manifestPath = path.resolve(this.buildPath, manifestName);
  }

  /**
   * Builds the manifest
   */
  public async build(transpile: Transpiler) {
    return await this.router.manifest(this.config).build(transpile);
  }

  /**
   * Sets up a local development server
   */
  public create(options: ServerOptions = {}) {
    return this.server.create(options);
  }

  /**
   * Shortcut to router event listener
   */
  public on(path: string, entry: string, priority?: number) {
    return this.router.on(path, entry, priority);
  }

  /**
   * Shortcut to all router
   */
  public all(path: string, entry: string, priority?: number) {
    return this.router.all(path, entry, priority);
  }

  /**
   * Shortcut to connect router
   */
  public connect(path: string, entry: string, priority?: number) {
    return this.router.connect(path, entry, priority);
  }

  /**
   * Shortcut to delete router
   */
  public delete(path: string, entry: string, priority?: number) {
    return this.router.delete(path, entry, priority);
  }

  /**
   * Shortcut to get router
   */
  public get(path: string, entry: string, priority?: number) {
    return this.router.get(path, entry, priority);
  }

  /**
   * Shortcut to head router
   */
  public head(path: string, entry: string, priority?: number) {
    return this.router.head(path, entry, priority);
  }

  /**
   * Shortcut to options router
   */
  public options(path: string, entry: string, priority?: number) {
    return this.router.options(path, entry, priority);
  }

  /**
   * Shortcut to patch router
   */
  public patch(path: string, entry: string, priority?: number) {
    return this.router.patch(path, entry, priority);
  }

  /**
   * Shortcut to post router
   */
  public post(path: string, entry: string, priority?: number) {
    return this.router.post(path, entry, priority);
  }

  /**
   * Shortcut to put router
   */
  public put(path: string, entry: string, priority?: number) {
    return this.router.put(path, entry, priority);
  }

  /**
   * Shortcut to trace router
   */
  public trace(path: string, entry: string, priority?: number) {
    return this.router.trace(path, entry, priority);
  }
}