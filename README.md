# ᗊ Ingest

An unopinionated, event driven, pluggable, serverless framework.

## Install

```bash
npm i @stackpress/ingest
```

## Usage

```js
// src/server.ts
import { server } from '@stackpress/ingest/http';

//make a new app
const app = server();
//add a route
app.get('/', function HomePage(req, res) { 
  res.setHTML('Hello, World');
});
//start the server
app.create().listen(3000);
```

### Entry Files

You can route to files as well.

```js
import path from 'node:path';
import { server } from '@stackpress/ingest/http';

//make a new app
const app = server();
//add a route
route.get('/', path.join(__dirname, 'home'));
//start the server
app.create().listen(3000);
```

```js
// src/home.ts
export default function HomePage(req, res) { 
  res.setHTML('Hello, World');
};
```