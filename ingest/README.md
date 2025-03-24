# ᗊ Ingest

[![NPM Package](https://img.shields.io/npm/v/@stackpress/ingest.svg?style=flat)](https://www.npmjs.com/package/@stackpress/ingest)
[![Tests Status](https://img.shields.io/github/actions/workflow/status/stackpress/ingest/test.yml)](https://github.com/stackpress/ingest/actions)
[![Coverage Status](https://coveralls.io/repos/github/stackpress/ingest/badge.svg?branch=main)](https://coveralls.io/github/stackpress/ingest?branch=main)
[![Commits](https://img.shields.io/github/last-commit/stackpress/ingest)](https://github.com/stackpress/ingest/commits/main/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat)](https://github.com/stackpress/ingest/blob/main/LICENSE)

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