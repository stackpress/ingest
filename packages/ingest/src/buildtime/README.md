# Notes About Buildtime

The main purpose of buildtime is to collect all the route and event
files used in the Project and map them to route paths and listeners.
This information is extracted by services to generate endpoints for 
various serverless services.

The major files in this folder derrive from the `framework` folder. The 
generics for buildtime files are the following.

 - A - Action. `ActionFile`
 - R - Request. `Request` defined in the `payload` folder
 - S - Response. `Response` defined in the `payload` folder

Other notes about the `buildtime` folder include the following.

 - Router includes a `manifest()` function used to access the `Manifest`
   class. The Manifest class works with the Builder class to generate 
   the final entry files per endpoint. The manifest class does the 
   actual bundling of files using `esbuild`.
 - The `Builder` class is used to programmatically template the entry 
   file loosely using `ts-morph`, and you are free to use your own 
   alternative.
 - `Server` is mainly used to easily start a development environment.