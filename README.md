# ᗊ Ingest

An unopinionated event driven serverless framework.

## Install

```bash
$ npm install @stackpress/ingest
```

## Usage

 1. Create an entry file called `entry.ts`

```js
// entry.ts
import { task } from '@stackpress/ingest/dist/helpers';

export default task(function UserDetail(req, res) {
  //get params
  const ctx = req.ctxFromRoute('/user/:id');
  const id = ctx.params.get('id');
  if (!id) {
    res.code = 400;
    res.status = 'Bad Request';
    res.body = { error: 'ID is required' };
    return;
  }
  //maybe get from database?
  const results = { 
    id: id, 
    name: 'John Doe', 
    age: 21, 
    created: new Date().toISOString() 
  };
  //send the response
  res.mimetype = 'text/json';
  res.body = results;
});
```

 2. Create a server file called `server.ts`

```js
// server.ts
import path from 'path';
import http from '@stackpress/ingest/http';

const server = http({ minify: false });
server.get('/user/:id', path.resolve(__dirname, 'user/detail'));

server.develop().listen(3000, () => {
  console.log('Server is running on port 3000');
  console.log('------------------------------');
  console.log(server.router.listeners);
});
```