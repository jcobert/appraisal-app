import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import { FetchResponse, coreFetch } from '@/utils/fetch'
import { toastyQuery, toastyRequest } from '@/utils/toast'

import { useCoreMutation } from '@/hooks/use-core-mutation'
import { useCoreQuery } from '@/hooks/use-core-query'

// Mock the fetch utilities
jest.mock('@/utils/fetch', () => ({
  ...jest.requireActual('@/utils/fetch'),
  coreFetch: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
}))

// Mock the toast utilities
jest.mock('@/utils/toast', () => ({
  toastyQuery: jest.fn(),
  toastyRequest: jest.fn(),
  ToastMessages: {},
}))

// Mock the progress hook
const mockStart = jest.fn()
const mockStop = jest.fn()
const mockUseProgress = jest.fn(() => ({
  start: mockStart,
  stop: mockStop,
}))

jest.mock('@bprogress/next', () => ({
  useProgress: () => mockUseProgress(),
}))

const mockFetch = {
  GET: coreFetch.GET as jest.MockedFunction<typeof coreFetch.GET>,
  POST: coreFetch.POST as jest.MockedFunction<typeof coreFetch.POST>,
}

const mockToastyQuery = toastyQuery as jest.MockedFunction<typeof toastyQuery>
const mockToastyRequest = toastyRequest as jest.MockedFunction<
  typeof toastyRequest
>

const mockSuccessResponse: FetchResponse<any> = {
  status: 200,
  data: { id: 'test-123', success: true },
}

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Progress Integration', () => {
  type TestData = { id: string; name: string }

  beforeEach(() => {
    jest.clearAllMocks()
    mockStart.mockClear()
    mockStop.mockClear()
    mockUseProgress.mockClear()

    mockFetch.GET.mockResolvedValue(mockSuccessResponse)
    mockFetch.POST.mockResolvedValue(mockSuccessResponse)
    mockToastyQuery.mockResolvedValue(mockSuccessResponse)
    mockToastyRequest.mockResolvedValue(mockSuccessResponse)
  })

  it('should handle multiple operations with different progress settings', async () => {
    const queryHook = renderHook(
      () =>
        useCoreQuery<TestData>({
          url: '/api/data',
          queryKey: ['test-query'],
          showProgress: true,
          toast: { enabled: false },
        }),
      { wrapper: createWrapper() },
    )

    const mutationHook = renderHook(
      () =>
        useCoreMutation<{ name: string }, TestData>({
          url: '/api/create',
          method: 'POST',
          showProgress: false, // Different setting
          toast: { enabled: false },
        }),
      { wrapper: createWrapper() },
    )

    // Wait for query to execute
    await waitFor(() => {
      expect(queryHook.result.current.isSuccess).toBe(true)
    })

    // Execute mutation
    await mutationHook.result.current.mutateAsync({ name: 'Test Item' })

    // Query should have started/stopped progress
    expect(mockStart).toHaveBeenCalledTimes(1)
    expect(mockStop).toHaveBeenCalledTimes(1)

    // Both operations should have worked
    expect(mockFetch.GET).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/data',
      }),
    )
    expect(mockFetch.POST).toHaveBeenCalledWith({
      url: '/api/create',
      payload: { name: 'Test Item' },
    })
  })

  it('should handle both query and mutation with progress enabled', async () => {
    const queryHook = renderHook(
      () =>
        useCoreQuery<TestData>({
          url: '/api/data',
          queryKey: ['test-query-2'],
          showProgress: true,
          toast: { enabled: false },
        }),
      { wrapper: createWrapper() },
    )

    const mutationHook = renderHook(
      () =>
        useCoreMutation<{ name: string }, TestData>({
          url: '/api/create',
          method: 'POST',
          showProgress: true,
          toast: { enabled: false },
        }),
      { wrapper: createWrapper() },
    )

    // Wait for query to execute
    await waitFor(() => {
      expect(queryHook.result.current.isSuccess).toBe(true)
    })

    // Clear the mocks to separate query vs mutation calls
    mockStart.mockClear()
    mockStop.mockClear()

    // Execute mutation
    await mutationHook.result.current.mutateAsync({ name: 'Test Item' })

    // Mutation should have started/stopped progress
    expect(mockStart).toHaveBeenCalledTimes(1)
    expect(mockStop).toHaveBeenCalledTimes(1)

    // Both operations should have worked
    expect(mockFetch.GET).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/data',
      }),
    )
    expect(mockFetch.POST).toHaveBeenCalledWith({
      url: '/api/create',
      payload: { name: 'Test Item' },
    })
  })

  it('should not interfere when both have progress disabled', async () => {
    const queryHook = renderHook(
      () =>
        useCoreQuery<TestData>({
          url: '/api/data',
          queryKey: ['test-query-3'],
          showProgress: false,
          toast: { enabled: false },
        }),
      { wrapper: createWrapper() },
    )

    const mutationHook = renderHook(
      () =>
        useCoreMutation<{ name: string }, TestData>({
          url: '/api/create',
          method: 'POST',
          showProgress: false,
          toast: { enabled: false },
        }),
      { wrapper: createWrapper() },
    )

    // Wait for query to execute
    await waitFor(() => {
      expect(queryHook.result.current.isSuccess).toBe(true)
    })

    // Execute mutation
    await mutationHook.result.current.mutateAsync({ name: 'Test Item' })

    // No progress should have been started
    expect(mockStart).not.toHaveBeenCalled()
    expect(mockStop).not.toHaveBeenCalled()

    // Both operations should still work
    expect(mockFetch.GET).toHaveBeenCalled()
    expect(mockFetch.POST).toHaveBeenCalledWith({
      url: '/api/create',
      payload: { name: 'Test Item' },
    })
  })
})
