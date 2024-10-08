//modules
import type { SourceFile } from 'ts-morph';
import path from 'path';
import esbuild from 'esbuild';
//filesystem
import FileLoader from '../filesystem/FileLoader';
import NodeFS from '../filesystem/NodeFS';
//buildtime
import type { 
  BuildInfo, 
  BuildResult,
  BuildOptions, 
  ESBuildOptions,
  Transpiler
} from './types';
import type Router from './Router';
import Emitter from './Emitter';
import { esIngestPlugin } from './plugins';
import { serialize } from './helpers';

export default class Manifest extends Set<BuildInfo> {
  public readonly emitter: Router;
  //loader
  public readonly loader: FileLoader;
  //build options
  public readonly options: ESBuildOptions;
  //build directory
  public readonly buildDir: string;
  //manifest path
  public readonly path: string;

  /**
   * Presets and distributes all the options
   */
  public constructor(emitter: Router, options: BuildOptions = {}) {
    super();
    this.emitter = emitter;
    const { 
      fs = new NodeFS(),
      cwd = process.cwd(),
      buildDir = './.build', 
      manifestName = 'manifest.json',
      ...build 
    } = options;
    
    this.loader = new FileLoader(fs, cwd);

    this.options = {
      bundle: true,
      minify: false,
      format: 'cjs', 
      platform: 'node',
      preserveSymlinks: true,
      write: true,
      ...build
    };
    this.buildDir = this.loader.absolute(buildDir);
    this.path = path.resolve(this.buildDir, manifestName);
  }

  /**
   * Builds the final entry files
   */
  public async build(transpile: Transpiler) {
    const vfs = new Map<string, SourceFile>();
    const build = new Set<BuildResult>();
    for (const { listeners, ...info } of this) {
      //create a new emitter we will use for just sorting purposes...
      const emitter = new Emitter();
      //add each route to the emitter 
      //(this will sort the entry files by priority)
      listeners.forEach(
        listener => emitter.add(listener.action, listener.priority)
      );
      //extract the actions from the emitter queue
      const actions = Array.from(emitter.queue).map(
        listener => listener.action
      );
      //make an id from the sorted combination of entries
      const id = serialize(actions.join(','));
      //determine the source and destination paths
      const source = path.join(this.buildDir, `${id}.ts`);
      const destination = path.join(this.buildDir, `${id}.js`);
      //add the transpiled source code to the virtual file system
      vfs.set(source, transpile({...info, actions }));
      //then pre-add the bundled entry file to the build results
      build.add({ ...info, id, entry: destination });
    }
    //build out all the files we collected to disk
    const results = await esbuild.build({  
      ...this.options,
      outdir: this.buildDir,
      entryPoints: Array.from(vfs.keys()),
      plugins: [ esIngestPlugin(vfs, this.loader) ]
    });
    //be friendly
    return { build, results, vfs };
  }

  /**
   * Returns the manifest as a native array
   */
  public toArray() {
    return Array.from(this).map(build => ({ 
      ...build, 
      tasks: Array.from(build.listeners) 
    }));
  }

  /**
   * Serializes the manifest to a json
   */
  public toString(minify = false) {
    const serial = this.toArray().map(build => ({ 
      ...build, 
      pattern: build.pattern?.toString()
    }));
    return minify 
      ? JSON.stringify(serial) 
      : JSON.stringify(serial, null, 2);
  }
}