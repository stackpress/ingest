# Notes

The following explains things that need to change for the next version.

## Props over Args

Right now events and routes uses arguments to pass down `req`, `res`, 
and `ctx` like the following examples.

```ts
server.on('profile-search', (req, res, ctx) => { /* ... */ });
server.post('/admin/profile', (req, res, ctx) => { /* ... */ });
```

Though this matches express like pattern, it becomes slightly problematic
if the handler doesn't use `req` and maybe `res` like the following examples.

```ts
server.on('profile-search', (_req, res) => {
  res.setStatus(404);
});

server.post('/admin/profile', (_req, _res, ctx) => {
  ctx.config.set('inserting', true);
});
```

In the example above and depending on your tsconfig, we use underscore 
to remove the type error of unused arg variables. To make unused args 
more natural it would be better to express this as a props pattern like 
the following example.

```ts
server.on('profile-search', ({ req, res, ctx }) => { /* ... */ });
server.post('/admin/profile', ({ req, res, ctx }) => { /* ... */ });
```

This way unused variables simply do not need to be declared as in the 
following.

```ts
server.on('profile-search', ({ res }) => {
  res.setStatus(404);
});

server.post('/admin/profile', ({ ctx }) => {
  ctx.config.set('inserting', true);
});
```

## Sever config and plugin from Server

So `config` is a property of `Server` and is a store that holds arbitrary 
configuration data in any shape. We can enforce the map by specifying the 
server generics `Server<ConfigMap>`. 

Also `plugin` in combination with `register` are properties of `Server` 
used to setup the runtime of plugins (objects, function, etc) defined 
within any plugin file and usually consumed within event and route 
handlers.

The current problem when retrieving a plugin runtime via `plugin` you 
need to type cast it in order for typescript to understand it's 
structure for example.

```ts
server.plugin('database'); // unknown
server.plugin<Engine>('database') // Engine
```

The stackpress code this riddled with this same pattern, and honestly 
looks ugly. It's also not practical to ask other devs consuming this 
library that they have to do it this way too.

My first thought was like `config`, we need to add another generic 
parameter for a plugin map like `Server<ConfigMap, IncomingRequest, ServerResponse, PluginMap>`.
But as you can see, needing to type cast this all the time can be very 
annoying as well.

Therefore I think the actual solution is to remove `config`, `plugins`, 
`register` from the server object entirely and add it into the props
instead as described in the **Props over Args** discussion. It should
then look like the following.

```ts
export default function plugin({ ctx, config, plugin }) {
  config.set('foo', 'bar');
  plugin.register('project', { welcome: 'Hello, World!!' });
  server.on('request', ({ req, res, config, plugin }) => {
    const name = req.data('name');
    const foo = config('foo')
    const project = plugin('project');
    res.setResults({ name, foo, project });
  });
};
```

Where props would have the following properties and aliases.

 - `request`: The wrapped request object
 - `response`: The wrapped response object
 - `server`: The server
 - `config`: The arbitrary project config
 - `plugin`: The plugin manager
 - `req`: Alias for `request`
 - `res`: Alias for `response`
 - `ctx`: Alias for `server`
 - `cfg`: Alias for `config`
 - `plg`: Alias for `plugin`

Once that's implemented then we need a way to specify the exact plugin 
map so in the future we dont need to manually type cast it.

## Typescript Decorators

I would generally like to provision (but not require) the ability to use
decorators similar (but exactly) to how NestJS maximizes on it. This is 
more like an optional design pattern for the power developer to optionally
wield.