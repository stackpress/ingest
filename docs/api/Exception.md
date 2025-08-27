# Exception

Enhanced error handling with expressive error reporting and stack trace support.

## Overview

The Exception class provides:
- Template-based error messages with parameter substitution
- Validation error aggregation
- Enhanced stack trace parsing
- HTTP status code integration
- Structured error responses

```typescript
import { Exception } from '@stackpress/ingest';

const exception = new Exception('Invalid Parameters: %s', 400)
  .withErrors({
    name: 'required',
    email: 'invalid format'
  })
  .withPosition(100, 200);
```

## Static Methods

The following methods can be accessed directly from Exception itself.

### Creating Exceptions with Templates

The following example shows how to create exceptions with template strings.

```typescript
throw Exception.for('Something %s is %s', 'good', 'bad');
// Results in: "Something good is bad"

throw Exception.for('User %s not found', userId);
// Results in: "User 123 not found"
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `message` | `string` | Template message with %s placeholders |
| `...values` | `unknown[]` | Values to replace %s placeholders |

**Returns**

A new Exception instance with the formatted message.

### Creating Exceptions from Response Objects

The following example shows how to create exceptions from response objects.

```typescript
const response = { 
  code: 400, 
  error: 'Bad Request', 
  errors: { field: 'required' } 
};
throw Exception.forResponse(response);

// With fallback message
throw Exception.forResponse(response, 'Default error message');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `response` | `Partial<StatusResponse>` | Response object with error details |
| `message` | `string` | Fallback message if response.error is not provided |

**Returns**

A new Exception instance configured from the response object.

### Creating Exceptions for Validation Errors

The following example shows how to create exceptions for validation errors.

```typescript
throw Exception.forErrors({
  name: 'required',
  email: 'invalid format',
  age: ['must be a number', 'must be greater than 0']
});
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `errors` | `NestedObject<string\|string[]>` | Object containing validation errors |

**Returns**

A new Exception instance with "Invalid Parameters" message and error details.

### Requiring Conditions

The following example shows how to assert conditions and throw if they fail.

```typescript
Exception.require(count > 0, 'Count %s must be positive', count);
Exception.require(user.isActive, 'User %s is not active', user.id);

// Will throw if condition is false
Exception.require(false, 'This will always throw');
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `condition` | `boolean` | Condition that must be true |
| `message` | `string` | Error message with %s placeholders |
| `...values` | `any[]` | Values to replace %s placeholders |

**Returns**

Void if condition is true, throws Exception if false.

### Try-Catch Wrapper

The following example shows how to use the synchronous try-catch wrapper.

```typescript
const result = Exception
  .try(() => riskyOperation())
  .catch((error, kind) => {
    console.log('Error type:', kind); // 'Exception' or 'Error'
    return defaultValue;
  });

// With async operations
const asyncResult = await Exception
  .try(async () => await asyncRiskyOperation())
  .catch((error, kind) => {
    if (kind === 'Exception') {
      console.log('Custom exception:', error.message);
    } else {
      console.log('Standard error:', error.message);
    }
    return defaultValue;
  });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `callback` | `() => T` | Function to execute safely |

**Returns**

An object with a `catch` method for handling errors.

### Upgrading Errors

The following example shows how to upgrade regular errors to exceptions.

```typescript
try {
  // some operation that might throw a regular Error
  JSON.parse(invalidJson);
} catch (error) {
  throw Exception.upgrade(error, 400);
}

// Upgrade with custom message
try {
  await databaseOperation();
} catch (error) {
  const upgraded = Exception.upgrade(error, 500);
  upgraded.message = 'Database operation failed';
  throw upgraded;
}
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `error` | `Error` | The error to upgrade |
| `code` | `number` | HTTP status code (default: 500) |

**Returns**

An Exception instance (returns original if already an Exception).

## Properties

The following properties are available when instantiating an Exception.

| Property | Type | Description |
|----------|------|-------------|
| `code` | `number` | HTTP status code |
| `end` | `number` | Ending character position of the error |
| `errors` | `object` | Validation errors object |
| `start` | `number` | Starting character position of the error |
| `type` | `string` | Exception type name |

## Methods

The following methods are available when instantiating an Exception.

### Setting Error Code

The following example shows how to set the HTTP status code.

```typescript
const exception = new Exception('User not found');
exception.withCode(404);

// Method chaining
throw new Exception('Validation failed')
  .withCode(400)
  .withErrors({ name: 'required' });
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `code` | `number` | HTTP status code |

**Returns**

The Exception instance to allow method chaining.

### Adding Validation Errors

The following example shows how to add validation errors.

```typescript
const exception = new Exception('Validation failed');
exception.withErrors({
  name: 'required',
  email: ['required', 'invalid format'],
  age: 'must be a number'
});

// Method chaining
throw new Exception('Invalid input')
  .withErrors({
    username: 'already exists',
    password: ['too short', 'must contain numbers']
  })
  .withCode(400);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `errors` | `NestedObject<string\|string[]>` | Validation errors object |

**Returns**

The Exception instance to allow method chaining.

### Setting Position Information

The following example shows how to set character position information.

```typescript
const exception = new Exception('Syntax error');
exception.withPosition(100, 200);

// For parsing errors
throw new Exception('Invalid JSON')
  .withPosition(line * 80 + column, line * 80 + column + tokenLength)
  .withCode(400);
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `start` | `number` | Starting character position |
| `end` | `number` | Ending character position |

**Returns**

The Exception instance to allow method chaining.

### Converting to Response Object

The following example shows how to convert the exception to a response object.

```typescript
const exception = new Exception('User not found')
  .withCode(404)
  .withErrors({ id: 'does not exist' });

const response = exception.toResponse();
console.log(response);
// Returns: { 
//   code: 404, 
//   status: 'Not Found', 
//   error: 'User not found',
//   errors: { id: 'does not exist' },
//   stack: [...] 
// }

// With custom stack trace range
const response = exception.toResponse(1, 5); // Skip first frame, show 4 frames
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `start` | `number` | Starting index for stack trace (default: 0) |
| `end` | `number` | Ending index for stack trace (default: 0) |

**Returns**

An ErrorResponse object with all exception details.

### Converting to JSON

The following example shows how to convert the exception to JSON.

```typescript
const exception = new Exception('Database error')
  .withCode(500)
  .withErrors({ connection: 'timeout' });

const json = exception.toJSON();
console.log(json); // Pretty-printed JSON string

// Use in API responses
res.setHeader('Content-Type', 'application/json');
res.end(exception.toJSON());
```

**Returns**

A formatted JSON string representation of the exception.

### Getting Stack Trace

The following example shows how to get the parsed stack trace.

```typescript
const exception = new Exception('Something went wrong');
const trace = exception.trace();

trace.forEach((frame, index) => {
  console.log(`${index}: ${frame.method} at ${frame.file}:${frame.line}:${frame.char}`);
});

// Get limited stack trace
const limitedTrace = exception.trace(1, 3); // Skip first frame, show 2 frames
```

**Parameters**

| Parameter | Type | Description |
|----------|------|-------------|
| `start` | `number` | Starting index for stack trace (default: 0) |
| `end` | `number` | Ending index for stack trace (default: 0) |

**Returns**

An array of Trace objects with method, file, line, and char information.

## Usage in Route Handlers

### Basic Error Handling

```typescript
import { server, Exception } from '@stackpress/ingest/http';

const app = server();

app.get('/api/users/:id', async (req, res) => {
  const userId = req.data.get('id');
  
  // Validate input
  if (!userId) {
    throw Exception.for('User ID is required').withCode(400);
  }
  
  if (isNaN(parseInt(userId))) {
    throw Exception.for('User ID must be a number').withCode(400);
  }
  
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      throw Exception.for('User %s not found', userId).withCode(404);
    }
    
    res.setJSON({ user });
  } catch (error) {
    if (error instanceof Exception) {
      throw error; // Re-throw custom exceptions
    }
    
    // Upgrade regular errors
    throw Exception.upgrade(error, 500);
  }
});
```

### Validation Error Handling

```typescript
app.post('/api/users', async (req, res) => {
  await req.load();
  const userData = req.data.get();
  
  // Validate required fields
  const errors = {};
  
  if (!userData.name) {
    errors.name = 'Name is required';
  }
  
  if (!userData.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(userData.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!userData.password) {
    errors.password = 'Password is required';
  } else if (userData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  
  if (Object.keys(errors).length > 0) {
    throw Exception.forErrors(errors);
  }
  
  try {
    const user = await createUser(userData);
    res.setJSON({ user }, 201);
  } catch (error) {
    if (error.code === 'DUPLICATE_EMAIL') {
      throw Exception.for('Email %s already exists', userData.email)
        .withCode(409)
        .withErrors({ email: 'already exists' });
    }
    
    throw Exception.upgrade(error, 500);
  }
});
```

### Global Error Handler

```typescript
app.on('error', (error, req, res) => {
  console.error('Global error:', error);
  
  if (!res.sent) {
    if (error instanceof Exception) {
      // Use the exception's response format
      const errorResponse = error.toResponse();
      res.setError(
        errorResponse.error,
        errorResponse.errors || {},
        errorResponse.stack || [],
        errorResponse.code,
        errorResponse.status
      );
    } else {
      // Convert regular errors to exceptions
      const exception = Exception.upgrade(error, 500);
      const errorResponse = exception.toResponse();
      res.setError(
        'Internal Server Error',
        {},
        errorResponse.stack || [],
        500
      );
    }
  }
});
```

### Conditional Error Handling

```typescript
app.get('/api/admin/users', async (req, res) => {
  const user = req.data.get('user');
  
  // Check authentication
  Exception.require(user, 'Authentication required');
  
  // Check authorization
  Exception.require(
    user.role === 'admin', 
    'Admin access required for user %s', 
    user.username
  );
  
  try {
    const users = await getAllUsers();
    res.setJSON({ users });
  } catch (error) {
    throw Exception.upgrade(error, 500);
  }
});
```

### File Processing with Position Errors

```typescript
app.post('/api/parse-csv', async (req, res) => {
  await req.load();
  const csvData = req.data.get('csv');
  
  if (!csvData) {
    throw Exception.for('CSV data is required').withCode(400);
  }
  
  try {
    const lines = csvData.split('\n');
    const results = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        const parsed = parseCSVLine(line);
        results.push(parsed);
      } catch (error) {
        const lineStart = csvData.indexOf(line);
        const lineEnd = lineStart + line.length;
        
        throw Exception.for('Parse error on line %d: %s', i + 1, error.message)
          .withCode(400)
          .withPosition(lineStart, lineEnd)
          .withErrors({ [`line_${i + 1}`]: error.message });
      }
    }
    
    res.setJSON({ results, count: results.length });
  } catch (error) {
    if (error instanceof Exception) {
      throw error;
    }
    throw Exception.upgrade(error, 500);
  }
});
```

## Integration with Response Class

The Exception class integrates seamlessly with the Response class:

```typescript
app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = req.data.get('id');
    const user = await getUserById(userId);
    
    if (!user) {
      throw Exception.for('User %s not found', userId).withCode(404);
    }
    
    res.setJSON({ user });
  } catch (error) {
    if (error instanceof Exception) {
      // Convert exception to response
      const errorResponse = error.toResponse();
      res.fromStatusResponse(errorResponse);
    } else {
      res.setError('Internal Server Error', {}, [], 500);
    }
  }
});
```

## Best Practices

### Use Template Messages

```typescript
// Good: Template with parameters
throw Exception.for('User %s not found in organization %s', userId, orgId);

// Avoid: String concatenation
throw new Exception('User ' + userId + ' not found in organization ' + orgId);
```

### Provide Meaningful Error Codes

```typescript
// Good: Specific HTTP status codes
throw Exception.for('User not found').withCode(404);
throw Exception.for('Access denied').withCode(403);
throw Exception.for('Invalid input').withCode(400);

// Avoid: Generic error codes
throw Exception.for('Error occurred').withCode(500);
```

### Include Validation Details

```typescript
// Good: Detailed validation errors
throw Exception.forErrors({
  email: 'Invalid email format',
  password: ['Too short', 'Must contain numbers'],
  age: 'Must be a positive number'
});

// Avoid: Generic validation messages
throw new Exception('Validation failed');
```

### Use Method Chaining

```typescript
// Good: Fluent interface
throw Exception.for('Invalid user data')
  .withCode(400)
  .withErrors({ name: 'required', email: 'invalid' })
  .withPosition(startPos, endPos);

// Avoid: Multiple statements
const ex = new Exception('Invalid user data');
ex.withCode(400);
ex.withErrors({ name: 'required' });
throw ex;
```

The Exception class provides a powerful and flexible way to handle errors in Ingest applications, offering structured error information that can be easily consumed by both developers and API clients.
