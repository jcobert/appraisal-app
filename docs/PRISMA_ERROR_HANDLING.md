# Prisma Error Handling Guide

This guide explains how to use the enhanced Prisma error handling in your API handlers and query functions.

## Overview

The enhanced error handling system provides:

1. **Automatic Prisma error parsing** with user-friendly messages
2. **Specific error classes** for different database scenarios
3. **Consistent error responses** across all API endpoints
4. **Developer-friendly debugging** information

## Error Classes

### Built-in Error Classes

```typescript
// Validation errors (400)
ValidationError - For Zod validation failures
DatabaseConstraintError - For database constraint violations

// Authorization errors (401/403)
AuthorizationError - For permission failures

// Not found errors (404)
NotFoundError - For missing resources

// Database errors (500/503)
DatabaseConnectionError - For connection failures
```

### Prisma Error Codes Handled

| Prisma Code | HTTP Status | Error Type | Description |
|-------------|-------------|------------|-------------|
| P2002 | 409 | DUPLICATE | Unique constraint violation |
| P2025 | 404 | NOT_FOUND | Record not found |
| P2003 | 400 | INVALID_DATA | Foreign key constraint violation |
| P2004 | 400 | INVALID_DATA | Constraint violation |
| P2011 | 400 | INVALID_DATA | Null constraint violation |
| P2012 | 400 | INVALID_DATA | Missing required value |
| P2013 | 400 | INVALID_DATA | Missing required argument |
| P2014 | 400 | INVALID_DATA | Invalid ID |
| P2015 | 404 | NOT_FOUND | Related record not found |
| P2016 | 400 | INVALID_DATA | Query interpretation error |
| P2017 | 400 | INVALID_DATA | Records not connected |
| P2018 | 404 | NOT_FOUND | Required connected records not found |
| P2019 | 400 | INVALID_DATA | Input error |
| P2020 | 400 | INVALID_DATA | Value out of range |
| P2021 | 500 | DATABASE_FAILURE | Table does not exist |
| P2022 | 500 | DATABASE_FAILURE | Column does not exist |
| P2023 | 500 | DATABASE_FAILURE | Inconsistent column data |
| P2024 | 503 | DATABASE_FAILURE | Connection pool timeout |
| P2027 | 500 | DATABASE_FAILURE | Multiple errors occurred |

## Usage Examples

### Basic Handler Usage

The enhanced error handling works automatically in your handlers:

```typescript
// src/lib/db/handlers/user-handlers.ts
export const handleCreateUser = async (payload: CreateUserPayload) => {
  return createApiHandler(
    async ({ user }) => {
      // Validation
      const validation = validatePayload(userProfileSchema.api, payload)
      if (!validation?.success) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      // Database operation - Prisma errors are automatically handled
      const result = await createUserProfile({ 
        data: withUserFields(payload, user?.id || '', ['createdBy', 'updatedBy'])
      })
      
      return result
    },
    {
      messages: {
        success: 'User created successfully.',
      },
      isMutation: true,
    },
  )
}
```

### Handling Specific Errors in Query Functions

For more granular control, use the `handlePrismaError` helper in your query functions:

```typescript
// src/lib/db/queries/user.ts
import { handlePrismaError } from '@/lib/db/errors'

export const createUserProfile = async (params: Prisma.UserCreateArgs) => {
  try {
    const data = await db.user.create(params)
    return data
  } catch (error) {
    // This will throw appropriate custom errors (DatabaseConstraintError, NotFoundError, etc.)
    handlePrismaError(error)
  }
}

export const updateUserProfile = async (params: Prisma.UserUpdateArgs) => {
  try {
    const data = await db.user.update(params)
    return data
  } catch (error) {
    handlePrismaError(error)
  }
}
```

### Custom Error Messages

You can throw custom errors for specific business logic:

```typescript
export const handleUpdateUserEmail = async (userId: string, email: string) => {
  return createApiHandler(
    async () => {
      // Check if email is already in use
      const existingUser = await getUserProfile({ where: { email } })
      if (existingUser && existingUser.id !== userId) {
        throw new DatabaseConstraintError(
          'This email address is already registered to another user.',
          'unique',
          'email'
        )
      }

      const result = await updateUserProfile({
        where: { id: userId },
        data: { email }
      })
      
      return result
    },
    {
      messages: {
        success: 'Email updated successfully.',
      },
      isMutation: true,
    },
  )
}
```

## Error Response Format

All errors follow a consistent format:

```typescript
{
  status: 409,
  data: null,
  error: {
    code: 'DUPLICATE',
    message: 'A record with this email already exists.',
    details?: { /* Zod field errors for validation errors */ }
  }
}
```

### Example Error Responses

**Unique Constraint Violation (P2002):**
```json
{
  "status": 409,
  "data": null,
  "error": {
    "code": "DUPLICATE",
    "message": "A record with this email already exists."
  }
}
```

**Record Not Found (P2025):**
```json
{
  "status": 404,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested record could not be found."
  }
}
```

**Foreign Key Constraint (P2003):**
```json
{
  "status": 400,
  "data": null,
  "error": {
    "code": "INVALID_DATA",
    "message": "Invalid reference: the organizationId record does not exist."
  }
}
```

**Database Connection Error:**
```json
{
  "status": 503,
  "data": null,
  "error": {
    "code": "DATABASE_FAILURE",
    "message": "Database connection failed."
  }
}
```

## Testing Error Scenarios

Test your error handling with these scenarios:

```typescript
// user-handlers.test.ts
describe('handleCreateUser', () => {
  it('should handle unique constraint violation', async () => {
    const prismaError = new PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['email'] }
      }
    )
    
    mockCreateUserProfile.mockRejectedValue(prismaError)
    
    const result = await handleCreateUser(validPayload)
    
    expect(result.status).toBe(409)
    expect(result.error?.code).toBe('DUPLICATE')
    expect(result.error?.message).toBe('A record with this email already exists.')
  })

  it('should handle record not found', async () => {
    const prismaError = new PrismaClientKnownRequestError(
      'Record not found',
      {
        code: 'P2025',
        clientVersion: '5.0.0'
      }
    )
    
    mockUpdateUserProfile.mockRejectedValue(prismaError)
    
    const result = await handleUpdateUser(userId, updatePayload)
    
    expect(result.status).toBe(404)
    expect(result.error?.code).toBe('NOT_FOUND')
  })
})
```

## Best Practices

1. **Let the system handle common Prisma errors automatically** - Don't catch and re-throw unless you need custom logic
2. **Use `handlePrismaError` in query functions** when you need more control over error handling
3. **Throw custom errors for business logic** using the provided error classes
4. **Test error scenarios thoroughly** to ensure proper error messages reach users
5. **Log detailed errors server-side** while returning user-friendly messages to clients

## Migration Guide

### Before (Manual Error Handling)
```typescript
export const handleCreateUser = async (payload: CreateUserPayload) => {
  try {
    const result = await createUserProfile({ data: payload })
    return { status: 200, data: result }
  } catch (error) {
    if (error.code === 'P2002') {
      return {
        status: 409,
        data: null,
        error: { code: 'DUPLICATE', message: 'Email already exists' }
      }
    }
    return {
      status: 500,
      data: null,
      error: { code: 'FAILURE', message: 'Unknown error' }
    }
  }
}
```

### After (Automatic Error Handling)
```typescript
export const handleCreateUser = async (payload: CreateUserPayload) => {
  return createApiHandler(
    async ({ user }) => {
      // Validation
      const validation = validatePayload(userProfileSchema.api, payload)
      if (!validation?.success) {
        throw new ValidationError('Invalid data provided.', validation.errors || {})
      }

      // Database operation - errors handled automatically
      const result = await createUserProfile({ 
        data: withUserFields(payload, user?.id || '', ['createdBy', 'updatedBy'])
      })
      
      return result
    },
    {
      messages: { success: 'User created successfully.' },
      isMutation: true,
    },
  )
}
```

The enhanced error handling system automatically provides better error messages, consistent formatting, and proper HTTP status codes without additional code.
