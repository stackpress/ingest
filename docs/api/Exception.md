# Exception

Enhanced error handling with expressive error reporting, stack trace support, and structured error responses for robust application development.

```typescript
import { Exception } from '@stackpress/ingest';

const exception = new Exception('Invalid Parameters: %s', 400)
  .withErrors({
    name: 'required',
    email: 'invalid format'
  })
  .withPosition(100, 200);
```

 1. [Static Methods](#1-static-methods)
 2. [Properties](#2-properties)
 3. [Methods](#3-methods)
 4. [Usage in Route Handlers](#4-usage-in-route-handlers)
 5. [Integration with Response Class](#5-integration-with-response-class)
 6. [Best Practices](#6-best-practices)
 7. [Examples](#7-examples)

## 1. Static Methods

The following methods can be accessed directly from Exception itself.

### 1.1. Creating Exceptions with Templates

The following example shows how to create exceptions with template strings for dynamic error messages.

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

### 1.2. Creating Exceptions from Response Objects

The following example shows how to create exceptions from response objects for consistent error handling.

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

### 1.3. Creating Exceptions for Validation Errors

The following example shows how to create exceptions for validation errors with detailed field information.

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

### 1.4. Requiring Conditions

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

### 1.5. Try-Catch Wrapper

The following example shows how to use the synchronous try-catch wrapper for safe operation execution.

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

### 1.6. Upgrading Errors

The following example shows how to upgrade regular errors to exceptions for consistent error handling.

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

## 2. Properties

The following properties are available when instantiating an Exception.

| Property | Type | Description |
|----------|------|-------------|
| `code` | `number` | HTTP status code |
| `end` | `number` | Ending character position of the error |
| `errors` | `object` | Validation errors object |
| `start` | `number` | Starting character position of the error |
| `type` | `string` | Exception type name |

## 3. Methods

The following methods are available when instantiating an Exception.

### 3.1. Setting Error Code

The following example shows how to set the HTTP status code for proper error classification.

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

### 3.2. Adding Validation Errors

The following example shows how to add validation errors for detailed field-level feedback.

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

### 3.3. Setting Position Information

The following example shows how to set character position information for parsing errors.

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

### 3.4. Converting to Response Object

The following example shows how to convert the exception to a response object for API responses.

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

### 3.5. Converting to JSON

The following example shows how to convert the exception to JSON for serialization.

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

### 3.6. Getting Stack Trace

The following example shows how to get the parsed stack trace for debugging.

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

## 4. Usage in Route Handlers

The Exception class integrates seamlessly with route handlers for comprehensive error management.

### 4.1. Basic Error Handling

Handle common error scenarios with proper HTTP status codes and messages.

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

async function getUserById(id: string) {
  // User lookup logic
  return { id, name: 'John Doe', email: 'john@example.com' };
}
```

### 4.2. Validation Error Handling

Implement comprehensive validation with detailed error feedback.

```typescript
app.post('/api/users', async (req, res) => {
  await req.load();
  const userData = req.data.get();
  
  // Validate required fields
  const errors: Record<string, string> = {};
  
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
  } catch (e) {
    const error = e as Error;
    if (error.code === 'DUPLICATE_EMAIL') {
      throw Exception.for('Email %s already exists', userData.email)
        .withCode(409)
        .withErrors({ email: 'already exists' });
    }
    
    throw Exception.upgrade(error, 500);
  }
});

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function createUser(userData: any) {
  // User creation logic
  return { id: Date.now(), ...userData };
}
```

### 4.3. Global Error Handler

Implement centralized error handling for consistent error responses.

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

## 5. Integration with Response Class

The Exception class integrates seamlessly with the Response class for consistent error handling.

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

## 6. Best Practices

The following best practices ensure effective error handling and debugging capabilities.

### 6.1. Use Template Messages

Create dynamic error messages with proper parameter substitution.

```typescript
// Good: Template with parameters
throw Exception.for('User %s not found in organization %s', userId, orgId);

// Avoid: String concatenation
throw new Exception('User ' + userId + ' not found in organization ' + orgId);
```

### 6.2. Provide Meaningful Error Codes

Use specific HTTP status codes for proper error classification.

```typescript
// Good: Specific HTTP status codes
throw Exception.for('User not found').withCode(404);
throw Exception.for('Access denied').withCode(403);
throw Exception.for('Invalid input').withCode(400);

// Avoid: Generic error codes
throw Exception.for('Error occurred').withCode(500);
```

### 6.3. Include Validation Details

Provide detailed validation errors for better user experience.

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

### 6.4. Use Method Chaining

Leverage the fluent interface for concise exception creation.

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

## 7. Examples

The following examples demonstrate advanced Exception usage patterns for real-world applications.

### 7.1. Conditional Error Handling

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

async function getAllUsers() {
  // User retrieval logic
  return [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
}
```

### 7.2. File Processing with Position Errors

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
      } catch (e) {
        const error = e as Error;
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

## 7.3. Integration with Response Class

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

The Exception class provides a powerful and flexible way to handle errors in Ingest applications, offering structured error information that can be easily consumed by both developers and API clients.
