import { useCoreQuery } from '../use-core-query'
import { usePermissions } from '../use-permissions'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'

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
          area: 'organization',
          organizationId: '123',
        }),
      { wrapper },
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.can('edit_org_info')).toBe(false)
    expect(result.current.can('edit_org_members')).toBe(false)
  })

  it('should return false for any permission when there is an error', () => {
    const error = new Error('Failed to fetch')
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
          area: 'organization',
          organizationId: '123',
        }),
      { wrapper },
    )

    expect(result.current.error).toBeTruthy()
    expect(result.current.can('edit_org_info')).toBe(false)
  })

  it('should return true for allowed permissions', () => {
    mockUseCoreQuery.mockReturnValue({
      response: {
        data: {
          organization: ['edit_org_info', 'edit_org_members'],
        },
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
          area: 'organization',
          organizationId: '123',
        }),
      { wrapper },
    )

    expect(result.current.can('edit_org_info')).toBe(true)
    expect(result.current.can('edit_org_members')).toBe(true)
    expect(result.current.can('delete_org')).toBe(false)
  })

  it('should return false for permissions from different areas', () => {
    mockUseCoreQuery.mockReturnValue({
      response: {
        data: {
          organization: ['edit_org_info'],
          orders: ['create_order'],
        },
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
          area: 'organization',
          organizationId: '123',
        }),
      { wrapper },
    )

    expect(result.current.can('edit_org_info')).toBe(true)
    // @ts-expect-error - Testing invalid permission area
    expect(result.current.can('create_order')).toBe(false)
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
          area: 'organization',
          organizationId: '123',
        }),
      { wrapper },
    )

    expect(result.current.can('edit_org_info')).toBe(false)
  })

  it('should pass query options to useCoreQuery', () => {
    const options = {
      enabled: false,
      staleTime: 5000,
    }

    renderHook(
      () =>
        usePermissions({
          area: 'organization',
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
    const area = 'organization'

    renderHook(
      () =>
        usePermissions({
          area,
          organizationId,
        }),
      { wrapper },
    )

    expect(mockUseCoreQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['permissions', { organizationId, area }],
      }),
    )
  })
})
