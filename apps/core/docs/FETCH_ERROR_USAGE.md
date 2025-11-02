# FetchError Usage Guide

This document explains how to use the new `FetchError` class for consistent, type-safe error handling.

## Benefits

1. **Type Safety**: TypeScript can properly narrow error types
2. **Instanceof Checks**: Use `isFetchError()` type guard
3. **Consistent Structure**: All fetch errors follow the same pattern
4. **Better Stack Traces**: Proper error stack for debugging
5. **Rich Context**: Access to status, code, details, and full response

## Basic Usage

### In React Query Hooks (Automatic)

React Query hooks (`useCoreQuery`, `useCoreMutation`) now automatically handle `FetchError`:

```typescript
const { data, error, isError } = useGetOrganizations()

// error is typed as FetchError<Organization[]>
if (isError && error) {
  console.log(error.status) // HTTP status code
  console.log(error.code) // FetchErrorCode enum
  console.log(error.message) // User-friendly message
  console.log(error.details) // Zod validation errors (if applicable)
  console.log(error.response) // Full FetchResponse object
}
```

### In Mutation Callbacks

```typescript
const { mutate } = useOrganizationMutations()

mutate(payload, {
  onSuccess: (data) => {
    // data is FetchResponse with successful data
    console.log(data.data)
  },
  onError: (error) => {
    // error is FetchError - fully typed!
    if (error.code === FetchErrorCode.NOT_AUTHORIZED) {
      router.push('/login')
    }

    // Access validation details
    if (error.details) {
      Object.entries(error.details).forEach(([field, messages]) => {
        console.log(`${field}: ${messages.join(', ')}`)
      })
    }
  },
})
```

### In Server Components (Prefetch Pattern)

Server components use React Query's `prefetchQuery` with the `prefetchQuery` utility:

```typescript
import { prefetchQuery } from '@/utils/query'

export default async function OrganizationPage({ params }: Props) {
  const queryClient = createQueryClient()

  // Prefetch data - errors are caught by React Query and stored in query state
  await queryClient.prefetchQuery({
    queryKey: organizationsQueryKey.filtered({ id: params.id }),
    queryFn: prefetchQuery(() => handleGetOrganization(params.id)),
  })

  // Page always renders - client components handle error state
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrganizationView organizationId={params.id} />
    </HydrationBoundary>
  )
}
```

The `prefetchQuery` utility:

1. Checks if the response status is successful
2. Throws a `FetchError` if not successful (React Query catches it)
3. Returns the response data if successful

The thrown error is **caught by React Query** and stored in the query state. Your client component can then access it:

```typescript
'use client'

export function OrganizationView({ organizationId }: Props) {
  const { data, error, isError } = useGetOrganization(organizationId)

  // Error state is automatically set if prefetch failed
  if (isError && error) {
    if (error.code === FetchErrorCode.NOT_FOUND) {
      return <NotFoundMessage />
    }

    if (error.code === FetchErrorCode.NOT_AUTHORIZED) {
      redirect('/login')
    }

    return <ErrorMessage error={error} />
  }

  if (!data) {
    return <LoadingSpinner />
  }

  return <OrganizationDetails data={data.data} />
}
```

**Key Point**: The error doesn't stop execution or trigger error boundaries. React Query catches it and makes it available via the `error` property in the query hook.

### Type Guards

Use the `isFetchError()` type guard for safe error handling:

```typescript
try {
  const result = await fetchRequest.POST({ url: '/api/example', payload })
} catch (error) {
  if (isFetchError(error)) {
    // TypeScript knows this is a FetchError
    console.log(error.status, error.code, error.message)

    // Access response data
    console.log(error.response.data)
  } else {
    // Some other error type
    console.error('Unexpected error:', error)
  }
}
```

## Error Codes

All errors include a `FetchErrorCode`:

```typescript
enum FetchErrorCode {
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_DATA = 'INVALID_DATA',
  DUPLICATE = 'DUPLICATE',
  DATABASE_FAILURE = 'DATABASE_FAILURE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

## Common Patterns

### Handling Validation Errors

```typescript
if (error.code === FetchErrorCode.INVALID_DATA && error.details) {
  // error.details is ZodFieldErrors
  setFormErrors(error.details)
}
```

### Handling Network Errors

```typescript
if (error.code === FetchErrorCode.NETWORK_ERROR) {
  toast.error('Check your internet connection')
}
```

### Handling Auth Errors

```typescript
if (error.code === FetchErrorCode.NOT_AUTHENTICATED) {
  router.push('/login')
}
```

### Custom Error Messages

```typescript
const { mutate } = useCoreMutation({
  url: '/api/organizations',
  method: 'POST',
  toast: {
    messages: {
      error: {
        DUPLICATE: () => 'An organization with this name already exists',
        INVALID_DATA: ({ response }) =>
          `Validation failed: ${response.error?.message}`,
      },
    },
  },
})
```

## Migration Notes

### Before (Manual Status Checks)

```typescript
onSuccess: async ({ status }) => {
  if (isStatusCodeSuccess(status)) {
    await refreshData()
  }
}
```

### After (Natural Separation)

```typescript
onSuccess: async () => {
  await refreshData()
},
onError: (error) => {
  console.error('Failed:', error.message)
}
```

## Best Practices

1. **Use Type Guards**: Always use `isFetchError()` when handling unknown errors
2. **Check Error Codes**: Use `error.code` for conditional logic, not status codes
3. **Access Details**: Check `error.details` for validation errors
4. **Leverage TypeScript**: Let TypeScript narrow types in error handlers
5. **Don't Catch Unnecessarily**: In React Query, let errors bubble to `onError`
6. **Log for Debugging**: Include `error.status` and `error.code` in logs

## Example: Complete Form Mutation

```typescript
const { mutate, isPending, error } = useCoreMutation<FormData, Organization>({
  url: '/api/organizations',
  method: 'POST',
  sanitize: { name: 'text' },
  toast: {
    messages: {
      success: ({ response }) => `${response.data?.name} created successfully!`,
      error: {
        DUPLICATE: () => 'Organization name already exists',
        INVALID_DATA: ({ response }) =>
          `Validation failed: ${response.error?.message}`,
      },
    },
  },
})

const onSubmit = (data: FormData) => {
  mutate(data, {
    onSuccess: () => router.push('/organizations'),
    onError: (error) => {
      // Log for debugging
      console.error('Create failed:', error.code, error.status)

      // Handle validation errors in form
      if (error.code === FetchErrorCode.INVALID_DATA && error.details) {
        setFormErrors(error.details)
      }
    },
  })
}
```
