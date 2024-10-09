# ᗊ Ingest

An unopinionated event driven serverless framework.

## Install

```bash
$ npm install @stackpress/ingest
```

## Usage

 1. Create a route file called `/user/detail.ts`

```js
// /user/detail.ts
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
