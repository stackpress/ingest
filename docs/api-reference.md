# API Reference

## HTTP Server

### Server Creation
```javascript
import { server } from '@stackpress/ingest/http';
const app = server();
```

### Route Handlers

#### GET Routes
```javascript
app.get(path: string, handler: RouteHandler)
```

#### POST Routes
```javascript
app.post(path: string, handler: RouteHandler)
```

#### PUT Routes
```javascript
app.put(path: string, handler: RouteHandler)
```

#### DELETE Routes
```javascript
app.delete(path: string, handler: RouteHandler)
```

### Response Methods

#### HTML Response
```javascript
res.setHTML(content: string)
```

#### JSON Response
```javascript
res.json(data: any)
```

#### Status Codes
```javascript
res.status(code: number)
```

### Request Object

#### Properties
- `req.url`: URL of the request
- `req.method`: HTTP method
- `req.headers`: Request headers
- `req.query`: Query parameters
- `req.body`: Request body (for POST/PUT requests)

### Middleware

```javascript
app.use(middleware: MiddlewareFunction)
```

### Server Lifecycle

```javascript
const server = app.create()
server.listen(port: number)
```

## Plugin System

### Creating Plugins
```javascript
export default function myPlugin(options) {
  return {
    name: 'my-plugin',
    setup(app) {
      // Plugin setup code
    }
  }
}
```

### Using Plugins
```javascript
app.use(myPlugin(options))
```

For practical examples of API usage, refer to the [Examples](./examples.md) section.
