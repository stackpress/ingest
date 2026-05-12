
type Infer = { readonly __infer: unique symbol };

type KnownPlugin<P, K extends string> =
  K extends keyof P ? P[K] : unknown;

type KnownConfig<C, K extends string> =
  DotPathValue<C, K> extends never ? unknown : DotPathValue<C, K>;

type DotPathValue<T, K extends string> =
  K extends `${infer Head}.${infer Tail}`
    ? Head extends keyof T
      ? DotPathValue<T[Head], Tail>
      : never
    : K extends keyof T
      ? T[K]
      : never;

type DotPathObject<K extends string, V> =
  K extends `${infer Head}.${infer Tail}`
    ? { [P in Head]: DotPathObject<Tail, V> }
    : { [P in K]: V };

type Merge<A, B> = {
  [K in keyof A | keyof B]:
    K extends keyof B
      ? K extends keyof A
        ? A[K] extends object
          ? B[K] extends object
            ? Merge<A[K], B[K]>
            : B[K]
          : B[K]
        : B[K]
      : K extends keyof A
        ? A[K]
        : never;
};

class Server<C extends object = {}, P extends object = {}> {
  public static load<P extends object = {}>() {
    return new Server<P>();
  }

  protected _configs = {} as C;
  protected _plugins = {} as P;

  public get configs() {
    return this._configs;
  }

  public get plugins() {
    return this._plugins;
  }

  public configure<K extends string, V>(name: K, value: V) {
    const parts = name.split('.');
    let cursor = this._configs as Record<string, any>;

    for (let i = 0; i < parts.length - 1; i++) {
      cursor[parts[i]] ??= {};
      cursor = cursor[parts[i]];
    }

    cursor[parts[parts.length - 1]] = value;

    return this as Server<Merge<C, DotPathObject<K, V>>, P>;
  }

  public register<K extends string, V>(name: K, plugin: V) {
    const plugins = this._plugins as Record<string, unknown>;
    plugins[name] = plugin;
    return this as Server<C, P & { [key in K]: V }>;
  }

  public config<V = Infer, K extends string = string>(key: K) {
    const parts = key.split('.');
    let cursor: any = this._configs;

    for (const part of parts) {
      cursor = cursor?.[part];
    }

    return cursor as V extends Infer ? KnownConfig<C, K> : V;
  }

  public plugin<V = Infer, K extends string = string>(name: K) {
    return (this._plugins as any)[name] as V extends Infer
      ? KnownPlugin<P, K>
      : V;
  }
};

const server = Server.load()
  .register('foo', 4)
  .register('bar', 'zoo')
  .configure('foo', 4)
  .configure('bar.baz', 'zoo')
  .configure('boo', { far: true });

server.plugins.foo; //number
server.plugins.bar; //string

server.configs.foo; //number
server.configs.bar.baz; //string
server.configs.boo.far; //boolean

server.plugin('foo'); //number
server.plugin('bar'); //string

server.config('foo'); //number
server.config('bar.baz'); //string
server.config('boo.far'); //boolean

function plugin(server: Server) {
  server.plugin<number>('foo'); //number
  server.plugin<string>('bar'); //string

  server.config<number>('foo'); //number
  server.config<string>('bar.baz'); //string
  server.config<boolean>('boo.far'); //boolean 
  
  
  server.plugin('foo'); //unknown
  server.config('bar.baz'); //unknown
}