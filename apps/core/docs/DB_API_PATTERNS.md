# Database & API Patterns Architecture

## Overview

This document outlines the comprehensive architecture for database and API operations in our Next.js application, focusing on the three-layer pattern of **Routes** → **Handlers** → **Query Functions** that provides consistent authentication, validation, error handling, and code reuse across both API endpoints and server-side components.

## Architecture Layers

### 1. API Routes Layer

**Location**: `/src/app/api/core/`
**Purpose**: Thin HTTP interface layer
**Responsibility**: Request/response handling only

### 2. Handlers Layer

**Location**: `/src/lib/db/handlers/`
**Purpose**: Business logic, authentication, validation
**Responsibility**: Core application logic that can be used anywhere

### 3. Query Functions Layer

**Location**: `/src/lib/db/queries/`
**Purpose**: Pure database operations
**Responsibility**: Database interactions only

## Core Principles

### 🎯 **Single Source of Truth**

Handlers contain the business logic once, used everywhere:

- API routes
- Server-side page prefetching
- Server components
- Server actions

### 🔒 **Authentication at the Right Level**

- **Handlers**: Contain authentication via `createApiHandler`
- **Query Functions**: Pure database operations (no redundant auth when only used by handlers)
- **API Routes**: Delegate all auth to handlers

### ✅ **Consistent Error Handling**

Standardized error responses across all endpoints and server operations.

## Implementation Patterns

### Handler Pattern

```typescript
// /src/lib/db/handlers/user-handlers.ts
export async function handleGetUsers() {
  return createApiHandler(async () => {
    const users = await getUserProfiles()
    return users || []
  })
}

export async function handleCreateUserProfile(
  payload: Parameters<typeof createUserProfile>[0]['data'],
) {
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

      // Add audit fields
      const dataWithUserFields = withUserFields(payload, user?.id || '', [
        'createdBy',
        'updatedBy',
      ])

      const result = await createUserProfile({ data: dataWithUserFields })
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

### API Route Pattern

```typescript
// /src/app/api/core/user/route.ts
import { toNextResponse } from '@/lib/api-handlers'
import {
  handleCreateUserProfile,
  handleGetUsers,
} from '@/lib/db/handlers/user-handlers'

export const GET = async (_req: NextRequest) => {
  const result = await handleGetUsers()
  return toNextResponse(result)
}

export const POST = async (req: NextRequest) => {
  const payload = (await req.json()) as Parameters<
    typeof handleCreateUserProfile
  >[0]
  const result = await handleCreateUserProfile(payload)
  return toNextResponse(result)
}
```

### Query Function Pattern

```typescript
// /src/lib/db/queries/user.ts
export const getUserProfiles = async (
  params?: Prisma.UserFindManyArgs,
  authOptions?: CanQueryOptions,
) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const data = await db.user.findMany(params)
  return data
}

// Pure CRUD operations (used only by handlers)
export const createUserProfile = async (params: Prisma.UserCreateArgs) => {
  const data = await db.user.create(params)
  return data
}
```

## Usage Patterns

### 1. API Routes

```typescript
// Simple delegation to handlers
export const GET = async (_req: NextRequest) => {
  const result = await handleGetUsers()
  return toNextResponse(result)
}
```

### 2. Server-Side Prefetching

```typescript
// /src/app/(authorized)/users/page.tsx
const Page: FC<Props> = async () => {
  const queryClient = createQueryClient()

  // Use same handlers as API routes
  await queryClient.prefetchQuery({
    queryKey: usersQueryKey.all,
    queryFn: async () => {
      const result = await handleGetUsers()
      if (!successful(result.status)) {
        throw new Error(result.error?.message || 'Failed to fetch users')
      }
      return result
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersPage />
    </HydrationBoundary>
  )
}
```

### 3. Server Components

```typescript
// Direct handler usage in server components
const ServerComponent = async () => {
  const result = await handleGetUsers()

  if (!successful(result.status)) {
    return <ErrorComponent message={result.error?.message} />
  }

  return <UsersDisplay users={result.data} />
}
```

### 4. Server Actions

```typescript
// /src/features/user/actions.ts
'use server'

export async function createUserAction(formData: FormData) {
  const payload = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    email: formData.get('email') as string,
  }

  const result = await handleCreateUserProfile(payload)

  if (!successful(result.status)) {
    return { error: result.error }
  }

  revalidatePath('/users')
  return { success: true, data: result.data }
}
```

## Authentication Patterns

### Handler-Level Authentication

```typescript
export async function handleGetUserProfile(userId: string) {
  return createApiHandler(async () => {
    // createApiHandler automatically handles:
    // - Authentication check
    // - User session extraction
    // - Error standardization

    if (!userId) {
      throw new Error('User ID is required')
    }

    const user = await getUserProfile({ where: { id: userId } })
    return user
  })
}
```

### Authorization Patterns

```typescript
export async function handleUpdateOrgMember(
  organizationId: string,
  memberId: string,
  payload: UpdateOrgMemberPayload,
) {
  return createApiHandler(
    async ({ user }) => {
      // Business logic here
      const result = await updateOrgMember({
        organizationId,
        memberId,
        payload: dataWithUserFields,
      })
      return result
    },
    {
      // Custom authorization check
      authorizationCheck: async () => {
        const isOwner = await userIsOwner({ organizationId })
        return isOwner
      },
      messages: {
        unauthorized: 'Unauthorized to update organization members.',
        success: 'Member updated successfully.',
      },
      isMutation: true,
    },
  )
}
```

## Error Handling

### Standardized Error Response

```typescript
type FetchResponse<TData = any> = {
  status?: number
  data: TData | null
  message?: string
  error?: {
    code: FetchErrorCode
    message: string
    details?: ZodFieldErrors
  }
}
```

### Error Types

```typescript
enum FetchErrorCode {
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED', // 401 - User needs to sign in
  NOT_AUTHORIZED = 'NOT_AUTHORIZED', // 403 - User lacks permission
  NOT_FOUND = 'NOT_FOUND',
  INVALID_DATA = 'INVALID_DATA',
  DUPLICATE = 'DUPLICATE',
  DATABASE_FAILURE = 'DATABASE_FAILURE',
  NETWORK_ERROR = 'NETWORK_ERROR', // Network/connectivity issues
  INTERNAL_ERROR = 'INTERNAL_ERROR', // Server/application errors
}
```

### Automatic Error Handling

The `createApiHandler` automatically handles:

- **Authentication failures** → `401` with `NOT_AUTHENTICATED` code
- **Authorization failures** → `403` with `NOT_AUTHORIZED` code
- **Validation errors** → `400` with `INVALID_DATA` code
- **Not found (null returns)** → `404` with `NOT_FOUND` code
- **Generic errors** → `500` with `INTERNAL_ERROR` code

## Validation Patterns

### Zod Schema Validation

```typescript
// Schema definition
export const userProfileSchema = {
  form: baseSchema.extend({
    phone: baseSchema.shape.phone.or(z.literal('')),
  }),
  api: baseSchema,
} satisfies SchemaBundle

// Usage in handlers
const validation = validatePayload(userProfileSchema.api, payload)
if (!validation?.success) {
  throw new ValidationError('Invalid data provided.', validation.errors || {})
}
```

### Validation Error Response

```typescript
{
  status: 400,
  data: null,
  error: {
    code: 'INVALID_DATA',
    message: 'Invalid data provided.',
    details: {
      firstName: { code: 'too_small', message: 'First name is required' },
      email: { code: 'invalid_string', message: 'Invalid email format' }
    }
  }
}
```

## Testing Patterns

### Handler Testing with ES6 Imports

```typescript
// Mock dependencies with ES6 imports
jest.mock('@/utils/auth', () => ({
  isAuthenticated: jest.fn(),
}))

jest.mock('@/lib/db/queries/user', () => ({
  getUserProfiles: jest.fn(),
  createUserProfile: jest.fn(),
}))

// Typed mocks
const mockGetUserProfiles = getUserProfiles as jest.MockedFunction<
  typeof getUserProfiles
>

describe('user-handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockIsAuthenticated.mockResolvedValue({
      allowed: true,
      user: mockUser,
    })
  })

  it('should return all users successfully', async () => {
    const mockUsers = [mockUserProfile]
    mockGetUserProfiles.mockResolvedValue(mockUsers)

    const result = await handleGetUsers()

    expect(result.status).toBe(200)
    expect(result.data).toEqual(mockUsers)
  })
})
```

## File Structure

```
src/
├── app/api/core/           # API Routes (thin HTTP layer)
│   ├── user/
│   │   ├── route.ts        # GET, POST /api/core/user
│   │   └── [id]/route.ts   # GET /api/core/user/[id]
│   └── organization/
│       ├── route.ts
│       └── [id]/route.ts
├── lib/db/
│   ├── handlers/           # Business Logic Layer
│   │   ├── user-handlers.ts
│   │   ├── organization-handlers.ts
│   │   └── __tests__/
│   │       ├── user-handlers.test.ts
│   │       └── organization-handlers.test.ts
│   └── queries/            # Database Layer
│       ├── user.ts
│       └── organization.ts
└── features/               # Feature-specific code
    ├── user/
    │   ├── actions.ts      # Server actions
    │   └── hooks/
    └── organization/
```

## Benefits

### 🔄 **Code Reuse**

- Same business logic for API routes, server components, and server actions
- No duplication of authentication, validation, or error handling logic

### 🔒 **Security**

- Centralized authentication and authorization
- Consistent security patterns across all access methods

### 🧪 **Testability**

- Business logic isolated in testable handlers
- Comprehensive test coverage with proper mocking

### 🛠 **Maintainability**

- Single place to update business logic
- Consistent error handling and response formats
- Clear separation of concerns

### 📊 **Type Safety**

- Full TypeScript support across all layers
- Strongly typed request/response patterns
- Exported types for consuming code

## Migration Guide

### Converting Direct DB Calls to Handlers

❌ **Before** (Direct database calls in API routes):

```typescript
export const GET = async () => {
  const { allowed } = await isAuthenticated()
  if (!allowed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const users = await db.user.findMany()
    return NextResponse.json({ data: users })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

✅ **After** (Using handlers):

```typescript
export const GET = async () => {
  const result = await handleGetUsers()
  return toNextResponse(result)
}
```

### Converting require() to ES6 Imports in Tests

❌ **Before**:

```typescript
const { getUserProfiles } = require('@/lib/db/queries/user')
```

✅ **After**:

```typescript
import { getUserProfiles } from '@/lib/db/queries/user'

jest.mock('@/lib/db/queries/user', () => ({
  getUserProfiles: jest.fn(),
}))

const mockGetUserProfiles = getUserProfiles as jest.MockedFunction<
  typeof getUserProfiles
>
```

## Best Practices

1. **Always use handlers** for business logic, never direct database calls in routes
2. **Keep API routes thin** - delegate everything to handlers
3. **Use the same handlers** for API routes, server components, and server actions
4. **Test handlers thoroughly** with comprehensive error scenarios
5. **Follow consistent patterns** across all entities (users, organizations, etc.)
6. **Use TypeScript strictly** for type safety across all layers
7. **Keep query functions pure** when used only by handlers (no redundant auth)
8. **Add canQuery auth** only for query functions used directly by components
