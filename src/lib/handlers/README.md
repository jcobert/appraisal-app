# Reusable API Handlers

This directory contains reusable handlers that can be used both in API routes and server components for React Query prefetching. This ensures complete parity between prefetched data and API responses, eliminating the production issues where internal API routes aren't available during server-side rendering.

## Problem Solved

Previously, server components were calling internal API routes for prefetching, which could fail in production environments when the routes aren't yet available. This caused inconsistencies between prefetched data and client-side fetches.

## Solution

Reusable handlers that:
- Extract business logic from API routes into standalone functions
- Can be used directly in server components for prefetching
- Can be used in API routes to maintain existing endpoints
- Ensure complete data format parity between usage patterns
- Provide consistent error handling and authentication

## File Structure

```
src/lib/handlers/
├── index.ts                    # Export all handlers
├── example-usage.tsx           # Comprehensive usage examples
├── organization-handlers.ts    # Organization-specific handlers
├── user-handlers.ts           # User-specific handlers
└── [feature]-handlers.ts      # Additional feature handlers
```

## Base Infrastructure

### `src/lib/api-handlers.ts`

Core utilities:
- `createApiHandler()` - Unified handler with auth, authorization, and error handling
- `createMutationHandler()` - Convenience wrapper for mutations (sets `isMutation: true`)
- `createAuthorizedHandler()` - Convenience wrapper for authorized operations
- `ApiHandlerResult<T>` - Return type that includes both data and NextResponse

### Handler Configuration

The `createApiHandler` function accepts an optional config object:

```typescript
type ApiHandlerConfig = {
  requireAuth?: boolean                    // Require authentication (default: true)
  authorizationCheck?: () => Promise<boolean>  // Additional authorization check
  messages?: {                             // Optional custom messages
    success?: string                       // Success message for response
    unauthorized?: string                  // Custom unauthorized message
    authRequired?: string                  // Custom auth required message
    notFound?: string                      // Custom not found message
    forbidden?: string                     // Custom forbidden message
    databaseFailure?: string               // Custom database failure message
  }
  isMutation?: boolean                     // Handle nulls as DB failures vs not found
}
```

### Handler Return Type

All handlers return an `ApiHandlerResult<T>` with:
```typescript
{
  data: T | null,           // The actual data (for server components)
  response: NextResponse,   // The HTTP response (for API routes)
  status: number,          // HTTP status code
  success: boolean,        // Whether the operation succeeded
  error?: {                // Error details if failed
    code: FetchErrorCode,
    message: string,
    details?: any
  }
}
```

## Usage Patterns

### 1. In API Routes

Replace the route handler logic with handler calls:

**Before:**
```typescript
export const GET = async (req: NextRequest, { params }) => {
  const { allowed } = await isAuthenticated()
  if (!allowed) {
    return NextResponse.json({ error: { ... } }, { status: 401 })
  }
  
  try {
    const data = await getOrganization({ organizationId })
    if (!data) {
      return NextResponse.json({ error: { ... } }, { status: 404 })
    }
    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: { ... } }, { status: 500 })
  }
}
```

**After:**
```typescript
export const GET = async (req: NextRequest, { params }) => {
  const organizationId = (await params)?.id
  const result = await handleGetOrganization(organizationId)
  return result.response
}
```

### 2. In Server Components for Prefetching

Replace fetch calls with direct handler calls:

**Before:**
```typescript
await queryClient.prefetchQuery({
  queryKey: organizationsQueryKey.filtered({ id: organizationId }),
  queryFn: () =>
    fetch.GET({
      url: getAbsoluteUrl(`${CORE_API_ENDPOINTS.organization}/${organizationId}`),
    }),
})
```

**After:**
```typescript
await queryClient.prefetchQuery({
  queryKey: organizationsQueryKey.filtered({ id: organizationId }),
  queryFn: async () => {
    const result = await handleGetOrganization(organizationId)
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch organization')
    }
    return result.data
  },
})
```

### 3. Client-Side Usage (No Changes Required)

Your existing `useQuery` hooks continue to work unchanged:

```typescript
const { data } = useGetOrganizations({ id: organizationId })
```

## Benefits

1. **Complete Parity**: Identical data shapes between prefetching and API calls
2. **No Production Failures**: Server components use direct DB queries
3. **Type Safety**: Full TypeScript support across all usage patterns
4. **DRY Principle**: Single source of truth for each operation
5. **Consistent Error Handling**: Standardized error responses
6. **Easy Migration**: Incremental adoption possible
7. **Better Performance**: Direct DB access in server components

## Migration Strategy

1. **Create Handlers**: Extract logic from existing API routes into handlers
2. **Update API Routes**: Replace route logic with handler calls (keep validation if needed)
3. **Update Server Components**: Replace fetch calls with direct handler usage
4. **Test Parity**: Ensure data shapes match between patterns
5. **Deploy Incrementally**: Migrate route by route to reduce risk

## Available Handlers

### Organization Handlers
- `handleGetUserOrganizations()` - Get user's organizations
- `handleGetOrganization(id)` - Get single organization
- `handleUpdateOrganization(id, payload)` - Update organization (requires owner)
- `handleDeleteOrganization(id)` - Delete organization (requires owner)
- `handleGetOrganizationPermissions(id)` - Get user permissions for org

### User Handlers
- `handleGetUsers()` - Get all users
- `handleGetActiveUser()` - Get current user profile
- `handleGetUser(id)` - Get user by ID

## Error Handling

All handlers provide consistent error handling:
- Authentication errors (401)
- Authorization errors (403)
- Validation errors (400)
- Not found errors (404)
- Database errors (500)
- Generic failures (500)

## Adding New Handlers

1. Create handler function in appropriate file
2. Use `createApiHandler()`, `createMutationHandler()`, or `createAuthorizedHandler()`
3. Export from the feature handler file
4. Add to `index.ts` exports
5. Update API route to use handler
6. Update server components to use handler

## Example: Adding a New Feature Handler

```typescript
// Basic query handler
export async function handleGetOrder(orderId: string) {
  return createApiHandler(async () => {
    if (!orderId) {
      throw new Error('Order ID is required')
    }
    const order = await getOrder({ orderId })
    return order
  })
}

// Authorized mutation handler
export async function handleUpdateOrder(orderId: string, payload: any) {
  return createApiHandler(
    async () => {
      const order = await updateOrder({ orderId, payload })
      return order
    },
    {
      authorizationCheck: async () => {
        return await userCanEditOrder(orderId)
      },
      messages: {
        unauthorized: 'You cannot edit this order.',
        success: 'Order updated successfully.',
      },
      isMutation: true,
    }
  )
}

// Public endpoint (no auth required)
export async function handleGetPublicData() {
  return createApiHandler(
    async () => {
      const data = await getPublicData()
      return data
    },
    {
      requireAuth: false,
    }
  )
}

// API route usage
export const GET = async (req: NextRequest, { params }) => {
  const orderId = (await params)?.id
  const result = await handleGetOrder(orderId)
  return result.response
}

// Server component usage
const result = await handleGetOrder(orderId)
if (result.success) {
  // Use result.data for prefetching
}
```

This pattern ensures your application has robust, consistent data fetching across all usage scenarios while eliminating production environment issues.
