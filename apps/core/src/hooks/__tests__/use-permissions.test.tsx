import { useCoreQuery } from '../use-core-query'
import { usePermissions } from '../use-permissions'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'

import { FetchError } from '@/utils/fetch'

// Mock the useCoreQuery hook
jest.mock('../use-core-query')
const mockUseCoreQuery = useCoreQuery as jest.MockedFunction<
  typeof useCoreQuery
>

// Common mock response properties
const baseMockResponse = {
  failureCount: 0,
  failureReason: null,
  errorUpdateCount: 0,
  isFetched: false,
  isFetchedAfterMount: false,
  isFetching: false,
  isRefetching: false,
  isStale: false,
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
  isInitialLoading: false,
  isPaused: false,
  isEnabled: true,
  fetchStatus: 'idle' as const,
  refetch: jest.fn(),
  promise: Promise.resolve({ data: null, status: 200 }),
} satisfies Partial<ReturnType<typeof mockUseCoreQuery>>

describe('usePermissions', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return false for any permission while loading', () => {
    mockUseCoreQuery.mockReturnValue({
      response: undefined,
      error: null,
      isError: false,
      isPending: true,
      isLoading: true,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: false,
      isPlaceholderData: false,
      status: 'pending',
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
    } as ReturnType<typeof mockUseCoreQuery>)

    const { result } = renderHook(
      () =>
        usePermissions({
          organizationId: '123',
        }),
      { wrapper },
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.can('organization:edit')).toBe(false)
    expect(result.current.can('members:edit')).toBe(false)
  })

  it('should return false for any permission when there is an error', () => {
    const error = new FetchError({ error: { message: 'Failed to fetch' } })
    mockUseCoreQuery.mockReturnValue({
      response: undefined,
      error,
      isError: true,
      isPending: false,
      isLoading: false,
      isLoadingError: true,
      isRefetchError: false,
      isSuccess: false,
      isPlaceholderData: false,
      status: 'error',
      ...baseMockResponse,
    })

    const { result } = renderHook(
      () =>
        usePermissions({
          organizationId: '123',
        }),
      { wrapper },
    )

    expect(result.current.error).toBeTruthy()
    expect(result.current.can('organization:edit')).toBe(false)
  })

  it('should return true for allowed permissions', () => {
    mockUseCoreQuery.mockReturnValue({
      response: {
        data: ['organization:edit', 'members:edit'],
        status: 200,
      },
      error: null,
      isError: false,
      isPending: false,
      isLoading: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isPlaceholderData: false,
      status: 'success',
      ...baseMockResponse,
    })

    const { result } = renderHook(
      () =>
        usePermissions({
          organizationId: '123',
        }),
      { wrapper },
    )

    expect(result.current.can('organization:edit')).toBe(true)
    expect(result.current.can('members:edit')).toBe(true)
    expect(result.current.can('organization:delete')).toBe(false)
  })

  it('should handle null response data', () => {
    mockUseCoreQuery.mockReturnValue({
      response: {
        data: null,
        status: 200,
      },
      error: null,
      isError: false,
      isPending: false,
      isLoading: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      isPlaceholderData: false,
      status: 'success',
      ...baseMockResponse,
    })

    const { result } = renderHook(
      () =>
        usePermissions({
          organizationId: '123',
        }),
      { wrapper },
    )

    expect(result.current.can('organization:edit')).toBe(false)
  })

  it('should pass query options to useCoreQuery', () => {
    const options = {
      enabled: false,
      staleTime: 5000,
    }

    renderHook(
      () =>
        usePermissions({
          organizationId: '123',
          options,
        }),
      { wrapper },
    )

    expect(mockUseCoreQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        staleTime: 5000,
      }),
    )
  })

  it('should use correct query key', () => {
    const organizationId = '123'

    renderHook(
      () =>
        usePermissions({
          organizationId,
        }),
      { wrapper },
    )

    expect(mockUseCoreQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['permissions', { organizationId }],
      }),
    )
  })
})
