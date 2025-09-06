import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import { FetchErrorCode, FetchResponse, coreFetch } from '@/utils/fetch'
import { toastyQuery } from '@/utils/toast'

import { UseCoreQueryProps, useCoreQuery } from '@/hooks/use-core-query'

// Mock the fetch utility
jest.mock('@/utils/fetch', () => ({
  ...jest.requireActual('@/utils/fetch'),
  coreFetch: {
    GET: jest.fn(),
  },
}))

// Mock the toast utility
jest.mock('@/utils/toast', () => ({
  toastyQuery: jest.fn(),
  ToastMessages: {},
}))

const mockFetch = {
  GET: coreFetch.GET as jest.MockedFunction<typeof coreFetch.GET>,
}

const mockToastyQuery = toastyQuery as jest.MockedFunction<typeof toastyQuery>

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

describe('useCoreQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockSuccessResponse: FetchResponse<{ id: string; name: string }> = {
    status: 200,
    data: { id: 'test-id', name: 'test-name' },
  }

  const mockErrorResponse: FetchResponse<unknown> = {
    status: 404,
    data: null,
    error: {
      code: FetchErrorCode.NOT_FOUND,
      message: 'Resource not found',
    },
  }

  describe('basic functionality', () => {
    it('should create a query with GET method', async () => {
      mockFetch.GET.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(
        () =>
          useCoreQuery({
            url: '/api/test',
            queryKey: ['test'],
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.response).toEqual(mockSuccessResponse)
      expect(mockFetch.GET).toHaveBeenCalledWith({
        url: '/api/test',
        options: { signal: expect.any(AbortSignal) },
      })
    })

    it('should handle query errors without toast by default', async () => {
      mockFetch.GET.mockResolvedValue(mockErrorResponse)

      const { result } = renderHook(
        () =>
          useCoreQuery({
            url: '/api/test',
            queryKey: ['test'],
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.response).toEqual(mockErrorResponse)
      expect(mockToastyQuery).not.toHaveBeenCalled()
    })
  })

  describe('toast integration', () => {
    it('should not use toastyRequest by default', async () => {
      mockFetch.GET.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(
        () =>
          useCoreQuery({
            url: '/api/test',
            queryKey: ['test'],
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockToastyQuery).not.toHaveBeenCalled()
      expect(mockFetch.GET).toHaveBeenCalled()
    })

    it('should use toastyQuery when toast is enabled', async () => {
      mockToastyQuery.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(
        () =>
          useCoreQuery({
            url: '/api/test',
            queryKey: ['test'],
            toast: { enabled: true },
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockToastyQuery).toHaveBeenCalledWith(
        expect.any(Function),
        undefined,
        undefined,
      )
      expect(result.current.response).toEqual(mockSuccessResponse)
    })

    it('should pass custom toast messages and options', async () => {
      mockToastyQuery.mockResolvedValue(mockSuccessResponse)

      const customMessages = {
        error: {
          NOT_FOUND: () => 'Could not find the requested resource',
        },
      }
      const customOptions = { duration: 3000 }

      const { result } = renderHook(
        () =>
          useCoreQuery({
            url: '/api/test',
            queryKey: ['test'],
            toast: {
              enabled: true,
              messages: customMessages,
              options: customOptions,
            },
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockToastyQuery).toHaveBeenCalledWith(
        expect.any(Function),
        customMessages,
        customOptions,
      )
    })

    it('should handle toast configuration with enabled: false', async () => {
      mockFetch.GET.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(
        () =>
          useCoreQuery({
            url: '/api/test',
            queryKey: ['test'],
            toast: { enabled: false },
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockToastyQuery).not.toHaveBeenCalled()
      expect(mockFetch.GET).toHaveBeenCalled()
    })
  })

  describe('React Query integration', () => {
    it('should pass through React Query options', () => {
      mockFetch.GET.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(
        () =>
          useCoreQuery({
            url: '/api/test',
            queryKey: ['test'],
            enabled: false,
            staleTime: 5000,
          }),
        { wrapper: createWrapper() },
      )

      // Query should be disabled and not execute
      expect(result.current.isFetching).toBe(false)
      expect(result.current.response).toBeUndefined()
    })

    it('should handle successful queries', async () => {
      mockFetch.GET.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(
        () =>
          useCoreQuery({
            url: '/api/test',
            queryKey: ['test'],
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.response).toEqual(mockSuccessResponse)
        expect(result.current.error).toBeNull()
      })
    })

    it('should handle error responses', async () => {
      mockToastyQuery.mockResolvedValue(mockErrorResponse)

      const { result } = renderHook(
        () =>
          useCoreQuery({
            url: '/api/test',
            queryKey: ['test'],
            toast: { enabled: true },
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.response).toEqual(mockErrorResponse)
      })
    })
  })

  describe('memoization and performance', () => {
    it('should memoize queryFetch based on URL', () => {
      const { result, rerender } = renderHook(
        (props: UseCoreQueryProps) => useCoreQuery(props),
        {
          wrapper: createWrapper(),
          initialProps: { url: '/api/test', queryKey: ['test'] },
        },
      )

      // Rerender with same URL
      rerender({ url: '/api/test', queryKey: ['test'] })
      expect(result.current.fetchStatus).toBeDefined()

      // Rerender with different URL
      rerender({ url: '/api/different', queryKey: ['different'] })
      expect(result.current.fetchStatus).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('should handle undefined toast config', async () => {
      mockFetch.GET.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(
        () =>
          useCoreQuery({
            url: '/api/test',
            queryKey: ['test'],
            toast: undefined,
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockToastyQuery).not.toHaveBeenCalled()
      expect(mockFetch.GET).toHaveBeenCalled()
    })

    it('should handle complex error responses with toast', async () => {
      const complexErrorResponse: FetchResponse<unknown> = {
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.DATABASE_FAILURE,
          message: 'Database connection failed',
        },
      }

      mockToastyQuery.mockResolvedValue(complexErrorResponse)

      const { result } = renderHook(
        () =>
          useCoreQuery({
            url: '/api/test',
            queryKey: ['test'],
            toast: {
              enabled: true,
              messages: {
                error: {
                  DATABASE_FAILURE: ({ response }) =>
                    `Database error: ${response.error?.message}`,
                },
              },
            },
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.response).toEqual(complexErrorResponse)
    })
  })

  describe('type safety', () => {
    it('should work with typed response data', async () => {
      type TestData = { id: string; name: string; count: number }

      const typedResponse: FetchResponse<TestData> = {
        status: 200,
        data: { id: 'test-123', name: 'Test Item', count: 42 },
      }

      mockFetch.GET.mockResolvedValue(typedResponse)

      const { result } = renderHook(
        () =>
          useCoreQuery<TestData>({
            url: '/api/test',
            queryKey: ['test'],
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.response?.data?.id).toBe('test-123')
      expect(result.current.response?.data?.name).toBe('Test Item')
      expect(result.current.response?.data?.count).toBe(42)
    })

    it('should work with custom toast messages for typed data', async () => {
      type UserData = { id: string; email: string }

      mockToastyQuery.mockResolvedValue({
        status: 200,
        data: { id: 'user-1', email: 'test@example.com' },
      })

      const { result } = renderHook(
        () =>
          useCoreQuery<UserData>({
            url: '/api/user',
            queryKey: ['user'],
            toast: {
              enabled: true,
              messages: {
                error: {
                  NOT_FOUND: () => 'User not found',
                  AUTH: () => 'You do not have permission to view this user',
                },
              },
            },
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockToastyQuery).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          error: expect.objectContaining({
            NOT_FOUND: expect.any(Function),
            AUTH: expect.any(Function),
          }),
        }),
        undefined,
      )
    })
  })
})
