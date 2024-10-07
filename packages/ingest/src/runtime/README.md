# Notes About Runtime

The files included in the `runtime` are used by the actions. 

> Using `Router` and `Manifest` from `buildtime` in your actions will 
cause a build error because `esbuild` will try to bundle `esbuild`.

The major files in this folder derrive from the `framework` folder. The 
generics for buildtime files are the following.

 - A - Action. `AcionCallback`
 - R - Request. `Request` defined in the `payload` folder
 - S - Response. `Response` defined in the `payload` folder
