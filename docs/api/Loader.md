# Loader

Configuration and plugin loading utilities for the Ingest framework, providing file resolution and dynamic import capabilities with support for multiple file formats.

```typescript
import { ConfigLoader, PluginLoader } from '@stackpress/ingest';

const configLoader = new ConfigLoader({
  key: 'plugins',
  extnames: ['.js', '.json', '.ts']
});

const pluginLoader = new PluginLoader({
  cwd: process.cwd(),
  plugins: ['./src/plugin.js', '@my/plugin']
});
```

 1. [ConfigLoader](#1-configloader)
 2. [PluginLoader](#2-pluginloader)
 3. [Plugin Resolution](#3-plugin-resolution)
 4. [Bootstrap Process](#4-bootstrap-process)
 5. [Error Handling](#5-error-handling)
 6. [Integration with Server](#6-integration-with-server)
 7. [Best Practices](#7-best-practices)
 8. [Examples](#8-examples)

## 1. ConfigLoader

File loader specialized for configuration files with support for multiple file extensions and key extraction.

### 1.1. Properties

The following properties are available when instantiating a ConfigLoader.

| Property | Type | Description |
|----------|------|-------------|
| `cwd` | `string` | Current working directory (inherited) |
| `fs` | `FileSystem` | Filesystem interface being used (inherited) |

### 1.2. Methods

The following methods are available when instantiating a ConfigLoader.

#### 1.2.1. Loading Configuration Files

The following example shows how to load configuration files with fallback defaults.

```typescript
const config = await loader.load('./config.json', { 
  default: 'value' 
});

// Load with automatic key extraction
const plugins = await loader.load('./package.json'); 
// Extracts the 'plugins' key from package.json
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `filepath` | `string` | Path to the configuration file |
| `defaults` | `T` | Default value if file cannot be loaded (optional) |

**Returns**

A promise that resolves to the loaded configuration data or defaults.

#### 1.2.2. Resolving Configuration Files

The following example shows how to resolve configuration files with multiple extension support.

```typescript
const resolved = await loader.resolveFile('./config');
// Tries: ./config/plugins.js, ./config/plugins.json, 
//        ./config/package.json, ./config/plugins.ts, 
//        ./config.js, ./config.json, ./config.ts
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `filepath` | `string` | Path to resolve (default: current working directory) |

**Returns**

A promise that resolves to the resolved file path or null if not found.

### 1.3. Configuration Options

ConfigLoader accepts the following options during instantiation for customized file loading behavior.

```typescript
const loader = new ConfigLoader({
  cwd: '/custom/working/directory',
  fs: customFileSystem,
  key: 'myPlugins',
  extnames: ['/custom.js', '.custom.json']
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cwd` | `string` | `process.cwd()` | Working directory for file resolution |
| `fs` | `FileSystem` | `NodeFS` | Filesystem implementation |
| `key` | `string` | `'plugins'` | Key to extract from loaded objects |
| `extnames` | `string[]` | See below | File extensions to try |

**Default Extensions**

```typescript
[
  '/plugins.js',    // Directory-specific plugins file
  '/plugins.json',  // Directory-specific plugins config
  '/package.json',  // Package configuration
  '/plugins.ts',    // TypeScript plugins file
  '.js',           // JavaScript file
  '.json',         // JSON file
  '.ts'            // TypeScript file
]
```

## 2. PluginLoader

Extended configuration loader specialized for plugin management and bootstrapping with automatic dependency resolution.

### 2.1. Properties

The following properties are available when instantiating a PluginLoader.

| Property | Type | Description |
|----------|------|-------------|
| `cwd` | `string` | Current working directory (inherited) |
| `fs` | `FileSystem` | Filesystem interface being used (inherited) |

### 2.2. Methods

The following methods are available when instantiating a PluginLoader.

#### 2.2.1. Bootstrapping Plugins

The following example shows how to bootstrap all configured plugins with custom loading logic.

```typescript
await pluginLoader.bootstrap(async (name, plugin) => {
  console.log(`Loading plugin: ${name}`);
  
  if (typeof plugin === 'function') {
    // Plugin is a function, call it with context
    await plugin(server);
  } else {
    // Plugin is a configuration object
    server.configure(plugin);
  }
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `loader` | `(name: string, plugin: unknown) => Promise<void>` | Function to handle each loaded plugin |

**Returns**

The PluginLoader instance to allow method chaining.

#### 2.2.2. Getting Plugin List

The following example shows how to get the list of configured plugins for inspection.

```typescript
const plugins = await pluginLoader.plugins();
// Returns: ['./src/plugin.js', '@my/plugin', 'local-plugin']
```

**Returns**

A promise that resolves to an array of plugin paths.

### 2.3. Plugin Configuration

PluginLoader accepts the following options during instantiation for flexible plugin management.

```typescript
const loader = new PluginLoader({
  cwd: process.cwd(),
  plugins: ['./plugin1.js', '@scope/plugin2'],
  modules: '/path/to/node_modules'
});
```

| Option | Type | Description |
|--------|------|-------------|
| `cwd` | `string` | Working directory for file resolution |
| `fs` | `FileSystem` | Filesystem implementation |
| `plugins` | `string[]` | Array of plugin paths (optional) |
| `modules` | `string` | Path to node_modules directory (optional) |
| `key` | `string` | Key to extract from configuration files |
| `extnames` | `string[]` | File extensions to try |

## 3. Plugin Resolution

PluginLoader supports various plugin path formats for maximum flexibility in plugin organization.

### 3.1. Local Plugins

Load plugins from local files and directories within your project.

```typescript
const plugins = [
  './src/plugins/auth.js',      // Relative path
  '/absolute/path/plugin.js',   // Absolute path
  './plugins'                   // Directory with plugins config
];
```

### 3.2. NPM Packages

Load plugins from installed NPM packages with automatic resolution.

```typescript
const plugins = [
  '@my-org/auth-plugin',        // Scoped package
  'express-session',            // Regular package
  'local-plugin/dist/index.js'  // Package with specific entry
];
```

### 3.3. Nested Plugin Configurations

Support for nested plugin configurations allows for modular plugin organization.

```typescript
// plugins.json
{
  "plugins": [
    "./auth-plugin",
    {
      "plugins": ["./nested-plugin1", "./nested-plugin2"]
    }
  ]
}
```

## 4. Bootstrap Process

The bootstrap process follows a systematic approach to ensure reliable plugin loading and initialization.

### 4.1. Bootstrap Steps

The bootstrap process executes the following steps in order:

1. **Load Plugin List**: Resolves the plugins array from configuration
2. **Process Each Plugin**: Iterates through each plugin path
3. **Handle Nested Configs**: Recursively processes nested plugin arrays
4. **Resolve Plugin Path**: Converts relative paths to absolute paths
5. **Extract Plugin Name**: Generates a clean name for the plugin
6. **Call Loader Function**: Invokes the provided loader with name and plugin

### 4.2. Plugin Loading Order

Plugins are loaded in the order they appear in the configuration, allowing for dependency management.

```typescript
const plugins = [
  './plugins/database',  // Load database connection first
  './plugins/auth',      // Then authentication (depends on database)
  './plugins/api'        // Finally API routes (depends on auth)
];
```

## 5. Error Handling

PluginLoader provides comprehensive error handling for robust plugin management.

### 5.1. Error Types

Common error scenarios include missing files, invalid configurations, and plugin initialization failures.

```typescript
try {
  await pluginLoader.bootstrap(loader);
} catch (error) {
  // Handles missing files, invalid configurations, etc.
  console.error('Plugin loading failed:', error.message);
}
```

### 5.2. Graceful Degradation

Implement error handling that allows the application to continue running even if some plugins fail.

```typescript
await pluginLoader.bootstrap(async (name, plugin) => {
  try {
    await loadPlugin(name, plugin);
    console.log(`✓ Loaded plugin: ${name}`);
  } catch (error) {
    console.error(`✗ Failed to load plugin ${name}:`, error.message);
    // Continue loading other plugins
  }
});
```

## 6. Integration with Server

PluginLoader integrates seamlessly with the Server class for automatic plugin loading and configuration.

### 6.1. Automatic Bootstrap

Use the server's built-in bootstrap method for standard plugin loading.

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

// Bootstrap plugins from package.json
await app.bootstrap();
```

### 6.2. Custom Plugin Loading

Use a custom PluginLoader for advanced plugin management scenarios.

```typescript
// Or use custom plugin loader
const pluginLoader = new PluginLoader({
  plugins: ['./custom-plugin.js']
});

await pluginLoader.bootstrap(async (name, plugin) => {
  if (typeof plugin === 'function') {
    plugin(app);
  }
});
```

## 7. Best Practices

The following best practices ensure reliable and maintainable plugin management.

### 7.1. Plugin Organization

Organize plugins by functionality for better maintainability and understanding.

```typescript
// Organize plugins by functionality
const plugins = [
  './plugins/auth',      // Authentication
  './plugins/database',  // Database connection
  './plugins/logging',   // Logging setup
  '@company/shared'      // Shared company plugins
];
```

### 7.2. Error Resilience

```typescript
await pluginLoader.bootstrap(async (name, plugin) => {
  try {
    await loadPlugin(name, plugin);
    console.log(`✓ Loaded plugin: ${name}`);
  } catch (error) {
    console.error(`✗ Failed to load plugin ${name}:`, error.message);
    // Continue loading other plugins
  }
});
```

### 7.3. Development vs Production

```typescript
const isDev = process.env.NODE_ENV === 'development';

const plugins = [
  './plugins/core',
  ...(isDev ? ['./plugins/dev-tools'] : []),
  ...(process.env.ENABLE_ANALYTICS ? ['./plugins/analytics'] : [])
];
```

### 7.4. Plugin Dependencies

Ensure plugins are loaded in the correct order to handle dependencies properly.

```typescript
const plugins = [
  './plugins/config',     // Load configuration first
  './plugins/database',   // Database depends on config
  './plugins/auth',       // Auth depends on database
  './plugins/routes'      // Routes depend on auth
];
```

## 8. Examples

The following examples demonstrate common Loader usage patterns for real-world applications.

### 8.1. Basic Configuration Loading

```typescript
import { ConfigLoader } from '@stackpress/ingest';

const configLoader = new ConfigLoader({
  key: 'database',
  extnames: ['.json', '.js', '.env.js']
});

// Load database configuration
const dbConfig = await configLoader.load('./config/database', {
  host: 'localhost',
  port: 5432,
  database: 'myapp'
});

console.log('Database config:', dbConfig);
```

### 8.2. Plugin System Implementation

```typescript
import { PluginLoader } from '@stackpress/ingest';
import { server } from '@stackpress/ingest/http';

const app = server();

const pluginLoader = new PluginLoader({
  cwd: process.cwd(),
  plugins: [
    './plugins/cors',
    './plugins/auth',
    './plugins/api',
    '@company/monitoring'
  ]
});

await pluginLoader.bootstrap(async (name, plugin) => {
  console.log(`Loading plugin: ${name}`);
  
  if (typeof plugin === 'function') {
    // Function plugin - call with server instance
    await plugin(app);
  } else if (plugin && typeof plugin === 'object') {
    // Configuration plugin - apply settings
    if (plugin.routes) {
      app.use(plugin.routes);
    }
    if (plugin.middleware) {
      plugin.middleware.forEach((mw: any) => app.use(mw));
    }
  }
  
  console.log(`✓ Plugin ${name} loaded successfully`);
});

console.log('All plugins loaded, starting server...');
app.listen(3000);
```

### 8.3. Dynamic Plugin Discovery

```typescript
import { PluginLoader } from '@stackpress/ingest';
import { readdir } from 'fs/promises';
import { join } from 'path';

async function discoverPlugins(pluginsDir: string) {
  const entries = await readdir(pluginsDir, { withFileTypes: true });
  const plugins = [];
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const pluginPath = join(pluginsDir, entry.name);
      plugins.push(pluginPath);
    }
  }
  
  return plugins;
}

// Discover and load plugins dynamically
const discoveredPlugins = await discoverPlugins('./src/plugins');

const pluginLoader = new PluginLoader({
  plugins: [
    './plugins/core',  // Always load core plugins first
    ...discoveredPlugins
  ]
});

await pluginLoader.bootstrap(async (name, plugin) => {
  try {
    if (typeof plugin === 'function') {
      await plugin(app);
    }
    console.log(`✓ Loaded plugin: ${name}`);
  } catch (error) {
    console.error(`✗ Failed to load plugin ${name}:`, error);
  }
});
```

### 8.4. Conditional Plugin Loading

```typescript
import { PluginLoader } from '@stackpress/ingest';

const environment = process.env.NODE_ENV || 'development';
const features = process.env.FEATURES?.split(',') || [];

// Build plugin list based on environment and features
const plugins = [
  './plugins/core',
  './plugins/database'
];

// Environment-specific plugins
if (environment === 'development') {
  plugins.push('./plugins/dev-tools', './plugins/hot-reload');
} else if (environment === 'production') {
  plugins.push('./plugins/monitoring', './plugins/performance');
}

// Feature-specific plugins
if (features.includes('auth')) {
  plugins.push('./plugins/auth');
}

if (features.includes('analytics')) {
  plugins.push('./plugins/analytics');
}

const pluginLoader = new PluginLoader({ plugins });

await pluginLoader.bootstrap(async (name, plugin) => {
  console.log(`Loading ${name} for ${environment} environment`);
  
  if (typeof plugin === 'function') {
    await plugin(app, { environment, features });
  }
});
```
