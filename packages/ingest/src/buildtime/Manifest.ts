import type { SourceFile } from 'ts-morph';
import type { 
  BuildInfo, 
  BuildResult,
  BuildOptions, 
  ESBuildOptions,
  Transpiler
} from './types';

import path from 'path';
import esbuild from 'esbuild';
import FileLoader from './filesystem/FileLoader';
import NodeFS from './filesystem/NodeFS';
import { esIngestPlugin } from './plugins';
import TaskQueue from './TaskSorter';
import { serialize } from './helpers';

export default class Manifest extends Set<BuildInfo> {
  //loader
  public readonly loader: FileLoader;
  //build options
  public readonly options: ESBuildOptions;
  //build directory
  public readonly builddir: string;
  //manifest path
  public readonly path: string;

  /**
   * Presets and distributes all the options
   */
  public constructor(options: BuildOptions = {}) {
    super();
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
    this.builddir = this.loader.absolute(buildDir);
    this.path = path.resolve(this.builddir, manifestName);
  }

  /**
   * Builds the final entry files
   */
  public async build(transpile: Transpiler) {
    const vfs = new Map<string, SourceFile>();
    const build = new Set<BuildResult>();
    for (const { tasks, ...info } of this) {
      //create a new task queue
      const queue = new TaskQueue();
      //add each task (this will sort the entry files by priority)
      tasks.forEach(task => queue.add(task.entry, task.priority));
      //extract the entries from the task queue
      const entries = Array.from(queue.tasks).map(task => task.entry);
      //make an id from the sorted combination of entries
      const id = serialize(entries.join(','));
      //determine the source and destination paths
      const source = path.join(this.builddir, `${id}.ts`);
      const destination = path.join(this.builddir, `${id}.js`);
      //add to the virtual file system
      vfs.set(source, transpile({...info, entries }));
      //add to the build results
      build.add({ ...info, id, entry: destination });
    }
    //build all files to disk
    const results = await esbuild.build({  
      ...this.options,
      outdir: this.builddir,
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
      tasks: Array.from(build.tasks) 
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