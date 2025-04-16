//modules
import path from 'node:path';
//stackpress
import NodeFS from '@stackpress/lib/NodeFS';
import FileLoader from '@stackpress/lib/FileLoader';
//local
import type { ConfigLoaderOptions, PluginLoaderOptions } from './types.js';
import Exception from './Exception.js';

export class ConfigLoader extends FileLoader {
  //list of extensions to look for
  protected _extnames: string[];
  //key name
  protected _key: string;

  /**
   * Setups up the current working directory
   */
  public constructor(options: ConfigLoaderOptions = {}) {
    super(options.fs || new NodeFS(), options.cwd || process.cwd());
    const { 
      key = 'plugins', 
      extnames = [
        '/plugins.js', 
        '/plugins.json', 
        '/package.json',
        '/plugins.ts', 
        '.js', 
        '.json', 
        '.ts' 
      ] 
    } = options;
    this._key = key;
    this._extnames = extnames
  }

  /**
   * Simulates an import statement
   */
  public async load<T = any>(filepath: string, defaults?: T) {
    //resolve the pathname
    const file = await this.resolveFile(filepath);
    //if no file was resolved
    if (!file) {
      //throw an exception if there are no defaults
      Exception.require(
        typeof defaults !== 'undefined',
        'Could not resolve `%s`',
        filepath
      );
      //return the defaults
      return defaults;
    }
    //require the plugin
    const basepath = this.basepath(file);
    let imported = await import(basepath);
    //if using import
    if (imported.default) {
      imported = imported.default;
    }
    //if package.json, look for the key
    if (imported[this._key]) {
      imported = imported[this._key];
    } 
    return imported as T;
  }

  /**
   * Resolves the path name to a path that can be required
   */
  public async resolveFile(filepath = this.cwd) {
    //get the absolute path
    const resolved = await super.resolveFile(filepath, this._extnames, this.cwd);
    return resolved;
  }
}

export class PluginLoader extends ConfigLoader {
  //The location for `node_modules`
  protected _modules?: string;
  //List of plugins
  protected _plugins?: string[];
  //if already bootstrapped
  protected _bootstrapped = false;

  /**
   * Setups up the current working directory
   */
  public constructor(options: PluginLoaderOptions) {
    super(options);
    const { plugins, modules } = options;
    this._modules = modules;
    this._plugins = plugins;
  }

  /**
   * Requires all the files and registers it to the context.
   * You can only bootstrap server files.
   */
  public async bootstrap(
    loader: (name: string, plugin: unknown) => Promise<void>
  ) {
    //if not bootstrapped
    if (!this._bootstrapped) {
      const plugins = await this.plugins();
      //config should be a list of files
      for (let pathname of plugins) {
        const plugin = await this.load(pathname);
        if (Array.isArray(plugin)) {
          const absolute = await this.resolve(
            pathname, 
            this.cwd, 
            //will throw if not string
            true
          ) as string;
          const stats = await this.fs.stat(absolute);
          //get the folder name of the plugin pathname
          const cwd = stats.isFile() 
            ? path.dirname(absolute) 
            : absolute;
          //make a new plugin
          //cwd, this._modules, plugin
          const child = new PluginLoader({ 
            cwd, 
            fs: this.fs, 
            modules: this._modules, 
            plugins: plugin 
          });
          //bootstrap
          await child.bootstrap(loader);
          continue;
        }
        if (!this._modules) {
          this._modules = await this.lib();
        }
        //try consuming it
        const filename = pathname.startsWith(this._modules) 
          ? pathname.substring(this._modules.length + 1) 
          : pathname.startsWith(this.cwd) 
          ? pathname.substring(this.cwd.length + 1)
          : pathname;
        const extname = path.extname(filename);
        const basepath = filename.length - extname.length;
        const name = filename.substring(0, basepath);
        await loader(name, plugin);
      }
    }
    //set bootstrapped
    this._bootstrapped = true;
    return this;
  }

  /**
   * If the config is not set, then it loads it.
   * Returns the plugin configs
   */
  public async plugins(): Promise<string[]> {
    if (!this._plugins) {
      //try different file extensions to determine the filepath
      const filepath = await this.resolveFile(this.cwd);
      let plugins: any = [];
      if (filepath) {
        plugins = await this.load(filepath);
      }
      //if import
      if (plugins.default) {
        plugins = plugins.default;
      }
      //if package.json, look for the `plugins` key
      if (plugins[this._key]) {
        plugins = plugins[this._key];
      }

      if (typeof plugins == 'string') {
        plugins = [ plugins ];
      }

      this._plugins = Array.isArray(plugins) ? plugins : [];
    }

    return Array.from(this._plugins);
  }
}