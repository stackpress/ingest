# Notes About Filesystem

The `filesystem` files are used to load files in any filesystem that 
implement the `Filesystem` interface. This makes it possible to use 
virtual files for example. The primary class used is `FileLoader` 
which is a great help for finding the absolute path of relative files,
`node_module` files (like in monorepos) and cwd files denoted with `@`.

 - `buildtime` uses `FileLoader` to locate route files
 - `gateway` uses `FileLoader` to create build folders