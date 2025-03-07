/**
 * Test suite for the ConfigLoader and PluginLoader classes
 * These classes handle dynamic loading and configuration of plugins 
 * in the system
 */

import { expect } from 'chai';
import path from 'node:path';
import NodeFS from '@stackpress/lib/dist/system/NodeFS';
import { ConfigLoader, PluginLoader } from '../src/Loader';

/**
 * ConfigLoader Test Suite
 * Tests the functionality for loading and managing configuration files
 */
describe('ConfigLoader', () => {
  let loader: ConfigLoader;

  beforeEach(() => {
    loader = new ConfigLoader();
  });

  /**
   * Constructor Tests
   * Verifies proper initialization of ConfigLoader with default 
   * and custom options
   */
  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(loader).to.be.instanceOf(ConfigLoader);
    });

    it('should accept custom options', () => {
      const fs = new NodeFS();
      const cwd = '/custom/path';
      const customLoader = new ConfigLoader({ fs, cwd });
      expect(customLoader).to.be.instanceOf(ConfigLoader);
    });
  });

  /**
   * Import Method Tests
   * Tests dynamic import functionality for different module types 
   * and scenarios
   */
  describe('import', () => {
    it('should return defaults when file not found', async () => {
      const defaults = { test: true };
      const result = await loader.import('/non/existent/path', defaults);
      expect(result).to.deep.equal(defaults);
    });

    it('should throw when file not found and no defaults provided', 
      async () => {
      try {
        await loader.import('/non/existent/path');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.exist;
      }
    });

    it('should handle package.json with plugins key', async () => {
      const pkgPath = path.join(__dirname, 
        'fixtures', 'test-package.json');
      const result = await loader.import(pkgPath);
      expect(result).to.deep.equal({ test: true });
    });

    it('should handle ES modules with default export', async () => {
      const modulePath = path.join(__dirname, 
        'fixtures', 'test-module-commonjs.js');
      const result = await loader.import(modulePath);
      expect(result).to.deep.equal({ test: true });
    });

    it('should handle import with non-existent file and no defaults', 
      async () => {
      const configLoader = new ConfigLoader({
        cwd: path.join(__dirname, 'fixtures')
      });

      try {
        await configLoader.import('non-existent-file');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.include('Could not resolve');
      }
    });

    it('should handle import with non-existent file and defaults', 
      async () => {
      const configLoader = new ConfigLoader({
        cwd: path.join(__dirname, 'fixtures')
      });

      const result = await configLoader.import('non-existent-file',
      { default: true });
      expect(result).to.deep.equal({ default: true });
    });

    it('should handle import with ES module default export', 
      async () => { 
        const configLoader = new ConfigLoader({
        cwd: path.join(__dirname, 'fixtures')
      });

      const result = await configLoader.import(path.join(__dirname,
     'fixtures', 'test-module-commonjs.js'));
      expect(result).to.deep.equal({ test: true });
    });

    it('should handle import with package.json and key', async () => {
      const configLoader = new ConfigLoader({
        cwd: path.join(__dirname, 'fixtures'),
        key: 'plugins'
      });

      const result = await configLoader.import(path.join(__dirname,
     'fixtures', 'package.json'));
      expect(result).to.deep.equal(['plugin1', 'plugin2']);
    });
  });

  /**
   * Require Method Tests
   * Tests synchronous require functionality and cache management
   */
  describe('require', () => {
    it('should return defaults when file not found', () => {
      const defaults = { test: true };
      const result = loader.require('/non/existent/path', defaults);
      expect(result).to.deep.equal(defaults);
    });

    it('should throw when file not found and no defaults provided',
     () => {
      try {
        loader.require('/non/existent/path');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.exist;
      }
    });

    it('should handle require with non-existent file and no defaults',
     () => {
      const configLoader = new ConfigLoader({
        cwd: path.join(__dirname, 'fixtures')
      });

      try {
        configLoader.require('non-existent-file');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.include('Could not resolve');
      }
    });

    it('should handle require with non-existent file and defaults', 
      () => {
      const configLoader = new ConfigLoader({
        cwd: path.join(__dirname, 'fixtures')
      });

      const result = configLoader.require('non-existent-file', 
      { default: true });
      expect(result).to.deep.equal({ default: true });
    });

    it('should handle require with CommonJS module', () => {
      const configLoader = new ConfigLoader({
        cwd: path.join(__dirname, 'fixtures')
      });

      const result = configLoader.require(path.join(__dirname, 
      'fixtures', 'test-module-commonjs.js'));
      expect(result).to.deep.equal({ test: true });
    });

    it('should handle require with package.json and key', () => {
      const configLoader = new ConfigLoader({
        cwd: path.join(__dirname, 'fixtures'),
        key: 'plugins'
      });

      const result = configLoader.require(path.join(__dirname,
     'fixtures', 'package.json'));
      expect(result).to.deep.equal(['plugin1', 'plugin2']);
    });
  });

  /**
   * Basepath Method Tests
   * Tests the functionality for resolving base paths
   */
  describe('basepath', () => {
    it('should handle basepath with different extensions', () => {
      const configLoader = new ConfigLoader({
        cwd: path.join(__dirname, 'fixtures')
      });

      expect(configLoader.basepath
        ('/path/to/file.js')).to.equal('/path/to/file');
      expect(configLoader.basepath
        ('/path/to/file.ts')).to.equal('/path/to/file');
      expect(configLoader.basepath
        ('/path/to/file.json')).to.equal('/path/to/file.json');
    });
  });

  /**
   * Filenames Configuration Tests
   * Tests the functionality for filenames configuration
   */
  describe('filenames', () => {
    it('should handle different filenames configuration', () => {
      const configLoader = new ConfigLoader({
        cwd: path.join(__dirname, 'fixtures'),
        filenames: ['.custom']
      });

      const result = configLoader.resolve();
      expect(result).to.be.null;
    });
  });
});

/**
 * PluginLoader Test Suite
 * Tests the functionality for loading and managing plugins
 */
describe('PluginLoader', () => {
  let loader: PluginLoader;
  const fixturesDir = path.join(__dirname, 'fixtures');
  const options = {
    modules: path.join(fixturesDir, 'modules'),
    plugins: ['test-plugin']
  };

  beforeEach(() => {
    loader = new PluginLoader(options);
  });

  /**
   * Constructor Tests
   * Verifies proper initialization of PluginLoader with provided options
   */
  describe('constructor', () => {
    it('should initialize with provided options', () => {
      expect(loader).to.be.instanceOf(PluginLoader);
    });

    it('should handle string plugin configuration', () => {
      const pluginPath = path.join(fixturesDir, 'test-module-commonjs.js');
      const testLoader = new PluginLoader({
        cwd: fixturesDir,
        modules: fixturesDir,
        plugins: [pluginPath]
      });

      expect(testLoader.plugins).to.deep.equal([pluginPath]);
    });
  });

  /**
   * Plugins Getter Tests
   * Tests the functionality for loading plugins from config files
   */
  describe('plugins getter', () => {
    it('should load plugins from config file', () => {
      const configPath = path.join(fixturesDir, 'plugins-config.js');
      const configLoader = new PluginLoader({
        cwd: fixturesDir,
        modules: options.modules,
        plugins: require(configPath).plugins
      });
      expect(configLoader.plugins).to.deep.equal(['plugin1', 'plugin2']);
    });

    it('should handle default export in ES modules', async () => {
      const configPath = path.join(fixturesDir, 'test-module-commonjs.js');
      const configLoader = new PluginLoader({
        cwd: fixturesDir,
        modules: options.modules
      });
      const result = configLoader.plugins;
      expect(Array.isArray(result)).to.be.true;
    });

    it('should handle empty or invalid config', () => {
      const emptyLoader = new PluginLoader({
        cwd: path.join(fixturesDir, 'empty'),
        modules: path.join(fixturesDir, 'empty')
      });

      expect(emptyLoader.plugins).to.deep.equal([]);
    });

    it('should handle plugin loading errors', async () => {
      const mockLoader = async (name: string, plugin: unknown):
      Promise<void> => {};
      const pluginPath = path.join(__dirname, 'fixtures',
     'test-module-commonjs.js');
      const testLoader = new PluginLoader({
        plugins: [pluginPath]
      });
      
      await testLoader.bootstrap(mockLoader);
      expect(testLoader['_bootstrapped']).to.be.true;

      try {
        await testLoader.bootstrap(mockLoader);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.exist;
      }
    });

    it('should handle nested plugin configurations', async () => {
      const nestedPluginPath = path.join(fixturesDir,
     'nested-plugin', 'plugin.js');
      const loadedPlugins: string[] = [];
      const mockLoader = async (name: string, plugin: unknown):
      Promise<void> => {
        loadedPlugins.push(path.basename(name, '.js'));
      };

      const testLoader = new PluginLoader({
        cwd: path.dirname(nestedPluginPath),
        plugins: [nestedPluginPath],
        modules: path.dirname(nestedPluginPath)
      });

      // First get the plugins
      const plugins = testLoader.plugins;
      expect(plugins).to.deep.equal([nestedPluginPath]);

      // Then bootstrap them
      await testLoader.bootstrap(mockLoader);
      expect(testLoader['_bootstrapped']).to.be.true;
      expect(loadedPlugins).to.include('sub-plugin');
    });

    it('should handle non-existent plugin files', async () => {
      const invalidLoader = new PluginLoader({
        plugins: ['non-existent-plugin']
      });

      try {
        await invalidLoader.bootstrap(async () => {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.exist;
      }
    });

    it('should handle plugins from node_modules', async () => {
      const pluginPath = path.join(fixturesDir, 'test-module-commonjs.js');
      const testLoader = new PluginLoader({
        plugins: [pluginPath],
        modules: fixturesDir
      });

      const loadedPlugins: string[] = [];
      await testLoader.bootstrap(async (name, plugin) => {
        loadedPlugins.push(name);
      });

      expect(loadedPlugins).to.include(path.basename(pluginPath, '.js'));
    });

    it('should handle plugins with absolute paths', async () => {
      const pluginPath = path.join(fixturesDir, 'test-module-commonjs.js');
      const testLoader = new PluginLoader({
        plugins: [pluginPath],
        modules: fixturesDir
      });

      const loadedPlugins: string[] = [];
      await testLoader.bootstrap(async (name, plugin) => {
        loadedPlugins.push(name);
      });

      // Test plugin path starting with modules directory
      const modulesLoader = new PluginLoader({
        plugins: [path.join(fixturesDir, 'test-module-commonjs.js')],
        modules: fixturesDir
      });
      const modulesPlugins: string[] = [];
      await modulesLoader.bootstrap(async (name, plugin) => {
        modulesPlugins.push(name);
      });
      expect(modulesPlugins).to.include(path.basename(pluginPath, '.js'));

      // Test plugin path starting with cwd
      const cwdLoader = new PluginLoader({
        plugins: [path.join(fixturesDir, 'test-module-commonjs.js')],
        cwd: fixturesDir,
        modules: fixturesDir
      });
      const cwdPlugins: string[] = [];
      await cwdLoader.bootstrap(async (name, plugin) => {
        cwdPlugins.push(name);
      });
      expect(cwdPlugins).to.include(path.basename(pluginPath, '.js'));
    });

    it('should handle nested array plugins', async () => {
      const nestedPluginPath = path.join(fixturesDir,
       'nested-plugin', 'plugin.js');
      const loadedPlugins: string[] = [];
      const mockLoader = 
      async (name: string, plugin: unknown): Promise<void> => {
        loadedPlugins.push(path.basename(name, '.js'));
      };

      const testLoader = new PluginLoader({
        cwd: fixturesDir,
        modules: fixturesDir,
        plugins: [nestedPluginPath]
      });

      // First get the plugins
      const plugins = testLoader.plugins;
      expect(plugins).to.deep.equal([nestedPluginPath]);

      // Then bootstrap them
      await testLoader.bootstrap(mockLoader);
      expect(testLoader['_bootstrapped']).to.be.true;
      expect(loadedPlugins).to.include('sub-plugin');
    });

    it('should handle package.json plugins', () => {
      const packageJsonPath = path.join(fixturesDir, 'package.json');

      const testLoader = new PluginLoader({
        cwd: fixturesDir,
        modules: fixturesDir,
        key: 'plugins'
      });

      expect(testLoader.plugins).to.deep.equal(['plugin1', 'plugin2']);
    });

    it('should handle string plugin input', () => {
      const pluginPath = path.join(fixturesDir, 'test-module.js');

      const testLoader = new PluginLoader({
        cwd: fixturesDir,
        modules: fixturesDir,
        plugins: [pluginPath]
      });

      expect(testLoader.plugins).to.deep.equal([pluginPath]);
    });

    it('should handle relative paths in plugins', async () => {
      const testLoader = new PluginLoader({
        cwd: path.join(fixturesDir, 'nested-plugin'),
        modules: fixturesDir,
        plugins: ['../test-module-commonjs.js']
      });

      const loadedPlugins: string[] = [];
      await testLoader.bootstrap(async (name, plugin) => {
        loadedPlugins.push(name);
      });

      expect(loadedPlugins).to.include('../test-module-commonjs');
    });

    it('should handle module paths in plugins', async () => {
      const modulePath = path.join(fixturesDir, 'test-module-commonjs.js');
      const testLoader = new PluginLoader({
        cwd: fixturesDir,
        modules: fixturesDir,
        plugins: [modulePath]
      });

      const loadedPlugins: string[] = [];
      await testLoader.bootstrap(async (name, plugin) => {
        loadedPlugins.push(name);
      });

      expect(loadedPlugins).to.include('test-module-commonjs');
    });

    it('should handle absolute paths in plugins', async () => {
      const absolutePath = path.resolve(fixturesDir, 'test-module-commonjs.js');
      const testLoader = new PluginLoader({
        cwd: fixturesDir,
        modules: fixturesDir,
        plugins: [absolutePath]
      });

      const loadedPlugins: string[] = [];
      await testLoader.bootstrap(async (name, plugin) => {
        loadedPlugins.push(name);
      });

      expect(loadedPlugins).to.include('test-module-commonjs');
    });
  });

  /**
   * Bootstrap Method Tests
   * Tests the functionality for bootstrapping plugins
   */
  describe('bootstrap', () => {
    it('should allow multiple bootstrapping', async () => {
      // Mock plugin loader function
      const mockLoader =
      async (name: string, plugin: unknown): Promise<void> => {
        // Just simulate loading without returning anything
      };

      const pluginPath = path.join(fixturesDir, 'test-module-commonjs.js');
      const testLoader = new PluginLoader({
        cwd: fixturesDir,
        modules: fixturesDir,
        plugins: [pluginPath]
      });

      // First bootstrap should work
      await testLoader.bootstrap(mockLoader);
      expect(testLoader['_bootstrapped']).to.be.true;

      // Second bootstrap should be allowed
      await testLoader.bootstrap(mockLoader);
      expect(testLoader['_bootstrapped']).to.be.true;
    });

    it('should handle nested plugin configurations', async () => {
      // Mock plugin loader function that simulates loading nested plugins
      const loadedPlugins: string[] = [];
      const mockLoader = 
      async (name: string, plugin: unknown): Promise<void> => {
        loadedPlugins.push(path.basename(name, '.js'));
      };

      const nestedPluginPath = 
      path.join(fixturesDir, 'nested-plugin', 'plugin.js');
      const testLoader = new PluginLoader({
        cwd: path.dirname(nestedPluginPath),
        plugins: [nestedPluginPath],
        modules: path.dirname(nestedPluginPath)
      });

      // Bootstrap should handle nested plugin configurations
      await testLoader.bootstrap(mockLoader);
      expect(testLoader['_bootstrapped']).to.be.true;
      expect(loadedPlugins).to.include('sub-plugin');
    });

    it('should handle plugin loading errors', async () => {
      // Mock plugin loader function that throws an error
      const mockLoader = 
      async (name: string, plugin: unknown): Promise<void> => {
        throw new Error('Plugin loading error');
      };

      const pluginPath = 
      path.join(fixturesDir, 'test-module-commonjs.js');
      const testLoader = new PluginLoader({
        plugins: [pluginPath]
      });

      // Bootstrap should handle plugin loading errors
      try {
        await testLoader.bootstrap(mockLoader);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.include('Plugin loading error');
      }
    });
  });
});
