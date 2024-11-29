//modules
import type { ServerOptions } from 'http';
//stackpress
import type { UnknownNest } from '@stackpress/types';
//common
import Factory from '../Factory';
//local
import type { 
  Transpiler, 
  TranspileInfo,
  BuilderOptions, 
  ManifestOptions, 
  BuildResult,
  SourceFile 
} from './types';
import Router from './Router';
import Server from './Server';

export default abstract class Builder<C extends UnknownNest = UnknownNest> 
  extends Factory<C>
{
  //local server
  public readonly server: Server;
  //build router
  public readonly router: Router;

  /**
   * Sets up the plugin loader
   */
  public constructor(options: BuilderOptions = {}) {
    const { router = new Router(), ...config } = options;
    super(config);
    this.router = router;
    this.server = new Server(router, { cookie: config.cookie });
  }

  /**
   * Builds the final entry files
   */
  public abstract build(options?: ManifestOptions): Promise<BuildResult>;

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
    this.router.all(path, entry, priority);
    return this;
  }

  /**
   * Shortcut to connect router
   */
  public connect(path: string, entry: string, priority?: number) {
    this.router.connect(path, entry, priority);
    return this;
  }

  /**
   * Shortcut to delete router
   */
  public delete(path: string, entry: string, priority?: number) {
    this.router.delete(path, entry, priority);
    return this;
  }

  /**
   * Shortcut to get router
   */
  public get(path: string, entry: string, priority?: number) {
    this.router.get(path, entry, priority);
    return this;
  }

  /**
   * Shortcut to head router
   */
  public head(path: string, entry: string, priority?: number) {
    this.router.head(path, entry, priority);
    return this;
  }

  /**
   * Shortcut to options router
   */
  public options(path: string, entry: string, priority?: number) {
    this.router.options(path, entry, priority);
    return this;
  }

  /**
   * Shortcut to patch router
   */
  public patch(path: string, entry: string, priority?: number) {
    this.router.patch(path, entry, priority);
    return this;
  }

  /**
   * Shortcut to post router
   */
  public post(path: string, entry: string, priority?: number) {
    this.router.post(path, entry, priority);
    return this;
  }

  /**
   * Shortcut to put router
   */
  public put(path: string, entry: string, priority?: number) {
    this.router.put(path, entry, priority);
    return this;
  }

  /**
   * Shortcut to trace router
   */
  public trace(path: string, entry: string, priority?: number) {
    this.router.trace(path, entry, priority);
    return this;
  }

  /**
   * Creates an entry file
   */
  public abstract transpile(info: TranspileInfo): SourceFile;

  /**
   * Builds the manifest
   */
  protected async _build(
    transpile: Transpiler, 
    options: ManifestOptions = {}
  ): Promise<BuildResult> {
    return await this.router.manifest(options).build(transpile);
  }
}