# Notes About Runtime

The files included in the `runtime` are used by the actions. 

> Using `Router` and `Manifest` from `buildtime` in your actions will 
cause a build error because `esbuild` will try to bundle `esbuild`.

The major files in this folder derrive from the `framework` folder.
