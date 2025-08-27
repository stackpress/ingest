# Loader

Configuration and plugin loading utilities for the Ingest framework, providing file resolution and dynamic import capabilities.

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

## ConfigLoader

File loader specialized for configuration files with support for multiple file extensions and key extraction.

### Properties

The following properties are available when instantiating a ConfigLoader.

| Property | Type | Description |
|----------|------|-------------|
| `cwd` | `string` | Current working directory (inherited) |
| `fs` | `FileSystem` | Filesystem interface being used (inherited) |

### Methods

The following methods are available when instantiating a ConfigLoader.

#### Loading Configuration Files

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

#### Resolving Configuration Files

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

### Configuration Options

ConfigLoader accepts the following options during instantiation:

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

## PluginLoader

Extended configuration loader specialized for plugin management and bootstrapping.

### Properties

The following properties are available when instantiating a PluginLoader.

| Property | Type | Description |
|----------|------|-------------|
| `cwd` | `string` | Current working directory (inherited) |
| `fs` | `FileSystem` | Filesystem interface being used (inherited) |

### Methods

The following methods are available when instantiating a PluginLoader.

#### Bootstrapping Plugins

The following example shows how to bootstrap all configured plugins.

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

#### Getting Plugin List

The following example shows how to get the list of configured plugins.

```typescript
const plugins = await pluginLoader.plugins();
// Returns: ['./src/plugin.js', '@my/plugin', 'local-plugin']
```

**Returns**

A promise that resolves to an array of plugin paths.

### Plugin Configuration

PluginLoader accepts the following options during instantiation:

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

### Plugin Resolution

PluginLoader supports various plugin path formats:

#### Local Plugins

```typescript
const plugins = [
  './src/plugins/auth.js',      // Relative path
  '/absolute/path/plugin.js',   // Absolute path
  './plugins'                   // Directory with plugins config
];
```

#### NPM Packages

```typescript
const plugins = [
  '@my-org/auth-plugin',        // Scoped package
  'express-session',            // Regular package
  'local-plugin/dist/index.js'  // Package with specific entry
];
```

#### Nested Plugin Configurations

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

### Bootstrap Process

The bootstrap process follows these steps:

1. **Load Plugin List**: Resolves the plugins array from configuration
2. **Process Each Plugin**: Iterates through each plugin path
3. **Handle Nested Configs**: Recursively processes nested plugin arrays
4. **Resolve Plugin Path**: Converts relative paths to absolute paths
5. **Extract Plugin Name**: Generates a clean name for the plugin
6. **Call Loader Function**: Invokes the provided loader with name and plugin

### Error Handling

PluginLoader provides clear error messages for common issues:

```typescript
try {
  await pluginLoader.bootstrap(loader);
} catch (error) {
  // Handles missing files, invalid configurations, etc.
  console.error('Plugin loading failed:', error.message);
}
```

### Integration with Server

PluginLoader is typically used with the Server class for automatic plugin loading:

```typescript
import { server } from '@stackpress/ingest/http';

const app = server();

// Bootstrap plugins from package.json
await app.bootstrap();

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

### Best Practices

#### Plugin Organization

```typescript
// Organize plugins by functionality
const plugins = [
  './plugins/auth',      // Authentication
  './plugins/database',  // Database connection
  './plugins/logging',   // Logging setup
  '@company/shared'      // Shared company plugins
];
```

#### Error Resilience

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

#### Development vs Production

```typescript
const isDev = process.env.NODE_ENV === 'development';

const plugins = [
  './plugins/core',
  ...(isDev ? ['./plugins/dev-tools'] : []),
  ...(process.env.ENABLE_ANALYTICS ? ['./plugins/analytics'] : [])
];
```