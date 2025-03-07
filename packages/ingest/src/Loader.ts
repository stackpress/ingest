//modules
import path from 'node:path';
//stackpress
import NodeFS from '@stackpress/lib/dist/system/NodeFS';
import FileLoader from '@stackpress/lib/dist/system/FileLoader';
//local
import type { ConfigLoaderOptions, PluginLoaderOptions } from './types';
import Exception from './Exception';

export class ConfigLoader extends FileLoader {
  //list of filenames and extensions to look for
  protected _filenames: string[];
  //key name
  protected _key: string;

  /**
   * Setups up the current working directory
   */
  public constructor(options: ConfigLoaderOptions = {}) {
    super(options.fs || new NodeFS(), options.cwd || process.cwd());
    const { 
      key = 'plugins', 
      filenames = [
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
    this._filenames = filenames
  }

  /**
   * Simulates an import statement
   */
  public async import<T = any>(pathname = this.cwd, defaults?: T) {
    //resolve the pathname
    const file = this.resolve(pathname);
    //if no file was resolved
    if (!file) {
      //throw an exception if there are no defaults
      Exception.require (
        typeof defaults !== 'undefined',
        'Could not resolve `%s`',
        pathname
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
   * Simulates a require statement
   */
  public require<T = any>(pathname = this.cwd, defaults?: T) {
    //resolve the pathname
    const file = this.resolve(pathname);
    //if no file was resolved
    if (!file) {
      //throw an exception if there are no defaults
      Exception.require (
        typeof defaults !== 'undefined',
        'Could not resolve `%s`',
        pathname
      );
      //return the defaults
      return defaults;
    }
    //require the plugin
    const basepath = this.basepath(file);
    let imported = require(basepath);
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
  public resolve(pathname = this.cwd) {
    //get the absolute path
    return super.resolve(pathname, this.cwd, this._filenames);
  }

  /**
   * Removes the extension (.js or .ts) from the pathname
   */
  public basepath(pathname: string) {
    //if .js or .ts 
    if (pathname.endsWith('.js') || pathname.endsWith('.ts')) {
      //remove the extname
      return pathname.substring(0, pathname.length - 3);
    }
    return pathname;
  }
}

export class PluginLoader extends ConfigLoader {
  //The location for `node_modules`
  protected _modules: string;
  //List of plugins
  protected _plugins?: string[];
  //if already bootstrapped
  protected _bootstrapped = false;

  /**
   * If the config is not set, then it loads it.
   * Returns the plugin configs
   */
  public get plugins(): string[] {
    if (!this._plugins) {
      const file = this.resolve();
      let plugins: any = [];
      if (file) {
        const basepath = this.basepath(file);
        plugins = require(basepath);
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

  /**
   * Setups up the current working directory
   */
  public constructor(options: PluginLoaderOptions) {
    super(options);
    const { plugins, modules = this.modules() } = options;

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
      //config should be a list of files
      for (let pathname of this.plugins) {
        const plugin = this.require(pathname);
        if(Array.isArray(plugin)) {
          //get the folder name of the plugin pathname
          const cwd = path.dirname(this.resolve(pathname) || pathname);
          //make a new plugin
          //cwd, this._modules, plugin
          const child = new PluginLoader({ 
            cwd, 
            fs: this.fs, 
            modules: this._modules, 
            plugins: plugin 
          });
          //bootstrap
          child.bootstrap(loader);
        } else {
          //try consuming it
          const filename = pathname.startsWith(this._modules) 
            ? pathname.substring(this._modules.length + 1) 
            : pathname.startsWith(this.cwd) 
            ? pathname.substring(this.cwd.length + 1)
            : pathname;
          const extname = path.extname(filename);
          const name = filename.substring(0, filename.length - extname.length);
          await loader(name, plugin);
        }
      }
    }
    //set bootstrapped
    this._bootstrapped = true;
    return this;
  }
}