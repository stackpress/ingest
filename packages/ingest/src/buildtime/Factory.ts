//modules
import type { ServerOptions } from 'http';
//stackpress
import type { UnknownNest } from '@stackpress/types';
//common
import FactoryBase from '../Factory';
//local
import type { FactoryOptions, Transpiler, ManifestOptions } from './types';
import Router from './Router';
import Server from './Server';

export default class Factory<C extends UnknownNest = UnknownNest> 
  extends FactoryBase<C>
{
  //local server
  public readonly server: Server;
  //build router
  public readonly router: Router;

  /**
   * Sets up the plugin loader
   */
  public constructor(options: FactoryOptions = {}) {
    const { router = new Router(), ...config } = options;
    super(config);
    this.router = router;
    this.server = new Server(router, { cookie: config.cookie });
  }

  /**
   * Sets up a local development server
   */
  public create(options: ServerOptions = {}) {
    return this.server.create(options);
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

  /**
   * Builds the manifest
   */
  protected async _build(transpile: Transpiler, options: ManifestOptions = {}) {
    return await this.router.manifest(options).build(transpile);
  }
}