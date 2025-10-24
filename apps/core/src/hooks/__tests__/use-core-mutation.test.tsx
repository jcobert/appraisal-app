import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import { FetchErrorCode, FetchResponse, coreFetch } from '@/utils/fetch'
import { toastyRequest } from '@/utils/toast'
import { sanitizeFormData } from '@/utils/zod'

import {
  UseCoreMutationProps,
  useCoreMutation,
} from '@/hooks/use-core-mutation'

// Mock the fetch utility
jest.mock('@/utils/fetch', () => ({
  ...jest.requireActual('@/utils/fetch'),
  coreFetch: {
    POST: jest.fn(),
    PUT: jest.fn(),
    PATCH: jest.fn(),
    DELETE: jest.fn(),
  },
}))

// Mock the toast utility
jest.mock('@/utils/toast', () => ({
  toastyRequest: jest.fn(),
  ToastMessages: {},
}))

// Mock the sanitizeFormData utility
jest.mock('@/utils/zod', () => ({
  sanitizeFormData: jest.fn((data, _config) => data),
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
  POST: coreFetch.POST as jest.MockedFunction<typeof coreFetch.POST>,
  PUT: coreFetch.PUT as jest.MockedFunction<typeof coreFetch.PUT>,
  PATCH: coreFetch.PATCH as jest.MockedFunction<typeof coreFetch.PATCH>,
  DELETE: coreFetch.DELETE as jest.MockedFunction<typeof coreFetch.DELETE>,
}

const mockToastyRequest = toastyRequest as jest.MockedFunction<
  typeof toastyRequest
>

const mockSanitizeFormData = sanitizeFormData as jest.MockedFunction<
  typeof sanitizeFormData
>

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

describe('useCoreMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset progress mocks
    mockStart.mockClear()
    mockStop.mockClear()
    mockUseProgress.mockClear()
    // Ensure toastyRequest resolves by default for toast-enabled tests
    mockToastyRequest.mockResolvedValue(mockSuccessResponse)
  })

  const mockSuccessResponse: FetchResponse<{ id: string }> = {
    status: 200,
    data: { id: 'test-id' },
  }

  const mockErrorResponse: FetchResponse<unknown> = {
    status: 400,
    data: null,
    error: {
      code: FetchErrorCode.INVALID_DATA,
      message: 'Invalid input',
    },
  }

  describe('basic functionality', () => {
    it('should create a mutation with default POST method', () => {
      const { result } = renderHook(
        () => useCoreMutation({ url: '/api/test' }),
        { wrapper: createWrapper() },
      )

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
    })

    it('should handle different HTTP methods when toast is disabled', async () => {
      const methods = ['POST', 'PUT', 'PATCH', 'DELETE'] as const

      for (const method of methods) {
        mockFetch[method].mockResolvedValue(mockSuccessResponse)

        const { result } = renderHook(
          () =>
            useCoreMutation({
              url: '/api/test',
              method,
              toast: { enabled: false },
            }),
          { wrapper: createWrapper() },
        )

        await result.current.mutateAsync({ test: 'data' })

        expect(mockFetch[method]).toHaveBeenCalledWith(
          expect.objectContaining({
            url: '/api/test',
            ...(method !== 'DELETE' && { payload: { test: 'data' } }),
          }),
        )

        jest.clearAllMocks()
      }
    })
  })

  describe('payload transformation', () => {
    it('should transform payload when transform function is provided', async () => {
      mockFetch.POST.mockResolvedValue(mockSuccessResponse)

      const transform = jest.fn((payload: any) => ({
        ...payload,
        transformed: true,
      }))

      const { result } = renderHook(
        () =>
          useCoreMutation({
            url: '/api/test',
            transform,
            toast: { enabled: false },
          }),
        { wrapper: createWrapper() },
      )

      await result.current.mutateAsync({ test: 'data' })

      expect(transform).toHaveBeenCalledWith({ test: 'data' })
      expect(mockFetch.POST).toHaveBeenCalledWith({
        url: '/api/test',
        payload: { test: 'data', transformed: true },
      })
    })

    it('should not transform payload when no transform function is provided', async () => {
      mockFetch.POST.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(
        () =>
          useCoreMutation({
            url: '/api/test',
            toast: { enabled: false },
          }),
        { wrapper: createWrapper() },
      )

      await result.current.mutateAsync({ test: 'data' })

      expect(mockFetch.POST).toHaveBeenCalledWith({
        url: '/api/test',
        payload: { test: 'data' },
      })
    })
  })

  describe('toast integration', () => {
    it('should use toastyRequest by default', async () => {
      mockToastyRequest.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(
        () => useCoreMutation({ url: '/api/test' }),
        { wrapper: createWrapper() },
      )

      await result.current.mutateAsync({ test: 'data' })

      expect(mockToastyRequest).toHaveBeenCalledWith(
        expect.any(Function),
        undefined,
        undefined,
        { test: 'data' },
      )
    })

    it('Toasts should remain enabled when other toast config is provided.', async () => {
      // Make sure the mock returns a value
      mockToastyRequest.mockImplementation(async () => mockSuccessResponse)

      const { result } = renderHook(
        () =>
          useCoreMutation({
            url: '/api/test',
            toast: {
              messages: {
                success: () => 'Still enabled!',
              },
            },
          }),
        { wrapper: createWrapper() },
      )

      const response = await result.current.mutateAsync({})

      // Verify the mutation actually executed
      expect(response).toBeDefined()
      expect(mockToastyRequest).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          success: expect.any(Function),
        }),
        undefined,
        expect.objectContaining({}),
      )
    })

    it('should pass custom toast messages and options', async () => {
      // Make sure the mock returns a value
      mockToastyRequest.mockImplementation(async () => mockSuccessResponse)

      const { result } = renderHook(
        () =>
          useCoreMutation({
            url: '/api/test',
            toast: {
              enabled: true,
              messages: {
                success: ({ context }: any) => `Created ${context?.name}!`,
              },
              options: { duration: 5000 },
            },
          }),
        { wrapper: createWrapper() },
      )

      const payload = { name: 'Test Item' }

      const response = await result.current.mutateAsync(payload)

      // Verify the mutation actually executed
      expect(response).toBeDefined()
      expect(mockToastyRequest).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          success: expect.any(Function),
        }),
        { duration: 5000 },
        payload,
      )
    })

    it('should skip toastyRequest when toast is disabled', async () => {
      mockFetch.POST.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(
        () =>
          useCoreMutation({
            url: '/api/test',
            toast: { enabled: false },
          }),
        { wrapper: createWrapper() },
      )

      const response = await result.current.mutateAsync({ test: 'data' })

      expect(mockToastyRequest).not.toHaveBeenCalled()
      expect(mockFetch.POST).toHaveBeenCalled()
      expect(response).toEqual(mockSuccessResponse)
    })

    it('should handle toast configuration with enabled: true', async () => {
      mockToastyRequest.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(
        () =>
          useCoreMutation({
            url: '/api/test',
            toast: { enabled: true },
          }),
        { wrapper: createWrapper() },
      )

      await result.current.mutateAsync({ test: 'data' })

      expect(mockToastyRequest).toHaveBeenCalled()
    })
  })

  describe('React Query integration', () => {
    it('should pass through React Query options', () => {
      const onSuccess = jest.fn()
      const onError = jest.fn()

      const { result } = renderHook(
        () =>
          useCoreMutation({
            url: '/api/test',
            onSuccess,
            onError,
          }),
        { wrapper: createWrapper() },
      )

      // Verify mutation object has React Query properties
      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
      expect(result.current.isError).toBe(false)
      expect(result.current.isSuccess).toBe(false)
    })

    it('should handle successful mutations', async () => {
      mockToastyRequest.mockResolvedValue(mockSuccessResponse)
      const onSuccess = jest.fn()

      const { result } = renderHook(
        () =>
          useCoreMutation({
            url: '/api/test',
            onSuccess,
            toast: { enabled: true },
          }),
        { wrapper: createWrapper() },
      )

      await result.current.mutateAsync({ test: 'data' })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        // Check that onSuccess was called with the correct arguments
        // React Query calls with (data, variables, context) but context may be undefined
        expect(onSuccess).toHaveBeenCalledTimes(1)
        const [data, variables, context] = onSuccess.mock.calls[0]
        expect(data).toEqual(mockSuccessResponse)
        expect(variables).toEqual({ test: 'data' })
        // Context can be undefined in our test environment
        expect(context).toBeUndefined()
      })
    })

    it('should handle failed mutations', async () => {
      mockToastyRequest.mockResolvedValue(mockErrorResponse)

      const { result } = renderHook(
        () =>
          useCoreMutation({
            url: '/api/test',
            toast: { enabled: true },
          }),
        { wrapper: createWrapper() },
      )

      const response = await result.current.mutateAsync({ test: 'data' })

      // Since toastyRequest returns the error response instead of throwing,
      // the mutation completes and returns the error response
      expect(response).toEqual(mockErrorResponse)

      // Wait for React Query state to update
      await waitFor(() => {
        // The mutation should be considered successful by React Query
        // since the promise resolved, not rejected
        expect(result.current.isSuccess).toBe(true)
      })
    })
  })

  describe('memoization and performance', () => {
    it('should memoize mutationFetch based on dependencies', () => {
      const { result, rerender } = renderHook(
        (props: UseCoreMutationProps) => useCoreMutation(props),
        {
          wrapper: createWrapper(),
          initialProps: { url: '/api/test', method: 'POST' as const },
        },
      )

      const firstMutation = result.current

      // Rerender with same props
      rerender({ url: '/api/test', method: 'POST' as const })
      // Can't test reference equality on the entire result since React Query
      // creates new instances, but we can test that the hook is stable
      expect(result.current.mutate).toBeDefined()

      // Rerender with different URL
      rerender({ url: '/api/different', method: 'POST' as const })
      expect(result.current.mutate).toBeDefined()
      expect(result.current).not.toBe(firstMutation)
    })

    it('should create new mutation when transform function changes', () => {
      const transform1 = (data: any) => ({ ...data, v1: true })
      const transform2 = (data: any) => ({ ...data, v2: true })

      const { result, rerender } = renderHook(
        (props: UseCoreMutationProps) => useCoreMutation(props),
        {
          wrapper: createWrapper(),
          initialProps: { url: '/api/test', transform: transform1 },
        },
      )

      const firstMutation = result.current

      rerender({ url: '/api/test', transform: transform2 })
      expect(result.current).not.toBe(firstMutation)
    })
  })

  describe('edge cases', () => {
    it('should handle DELETE method without payload', async () => {
      mockFetch.DELETE.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(
        () =>
          useCoreMutation({
            url: '/api/test',
            method: 'DELETE',
            toast: { enabled: false },
          }),
        { wrapper: createWrapper() },
      )

      await result.current.mutateAsync({})

      expect(mockFetch.DELETE).toHaveBeenCalledWith({
        url: '/api/test',
      })
    })

    it('should handle undefined toast config', async () => {
      mockToastyRequest.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(
        () => useCoreMutation({ url: '/api/test', toast: undefined }),
        { wrapper: createWrapper() },
      )

      await result.current.mutateAsync({ test: 'data' })

      expect(mockToastyRequest).toHaveBeenCalled()
    })

    it('should handle empty payload object', async () => {
      mockFetch.POST.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(
        () =>
          useCoreMutation({
            url: '/api/test',
            toast: { enabled: false },
          }),
        { wrapper: createWrapper() },
      )

      await result.current.mutateAsync({})

      expect(mockFetch.POST).toHaveBeenCalledWith({
        url: '/api/test',
        payload: {},
      })
    })

    it('should handle complex payload transformations', async () => {
      mockFetch.POST.mockResolvedValue(mockSuccessResponse)

      const transform = (payload: any) => ({
        ...payload,
        timestamp: '2023-01-01',
        processed: true,
      })

      const { result } = renderHook(
        () =>
          useCoreMutation({
            url: '/api/test',
            transform,
            toast: { enabled: false },
          }),
        { wrapper: createWrapper() },
      )

      const originalPayload = { name: 'Test', value: 123 }
      await result.current.mutateAsync(originalPayload)

      expect(mockFetch.POST).toHaveBeenCalledWith({
        url: '/api/test',
        payload: {
          name: 'Test',
          value: 123,
          timestamp: '2023-01-01',
          processed: true,
        },
      })
    })
  })

  describe('type safety', () => {
    it('should work with typed payloads and responses', async () => {
      type TestPayload = { name: string; age: number }
      type TestResponse = { id: string; created: boolean }

      mockFetch.POST.mockResolvedValue({
        status: 200,
        data: { id: 'test-123', created: true },
      })
      mockToastyRequest.mockResolvedValue({
        status: 200,
        data: { id: 'test-123', created: true },
      })

      const { result } = renderHook(
        () =>
          useCoreMutation<TestPayload, TestResponse>({
            url: '/api/test',
            toast: {
              messages: {
                success: ({ response, context }) =>
                  `Created ${context?.name} with ID ${response.data?.id}`,
              },
            },
          }),
        { wrapper: createWrapper() },
      )

      const payload: TestPayload = { name: 'John', age: 30 }
      const response = await result.current.mutateAsync(payload)

      expect(response.data?.id).toBe('test-123')
      expect(response.data?.created).toBe(true)
    })
  })

  describe('form data sanitization', () => {
    beforeEach(() => {
      // Reset the mock to return the data unchanged by default
      mockSanitizeFormData.mockImplementation((data, _config) => data)
    })

    it('should apply sanitization when sanitize config is provided', async () => {
      mockFetch.POST.mockResolvedValue(mockSuccessResponse)

      const sanitizedData = { name: 'John', email: 'clean@example.com' }
      mockSanitizeFormData.mockReturnValue(sanitizedData)

      const { result } = renderHook(
        () =>
          useCoreMutation({
            url: '/api/test',
            sanitize: { name: 'name', email: 'email' },
            toast: { enabled: false },
          }),
        { wrapper: createWrapper() },
      )

      const payload = { name: 'John<script>', email: 'dirty<>@example.com' }
      await result.current.mutateAsync(payload)

      expect(mockSanitizeFormData).toHaveBeenCalledWith(payload, {
        name: 'name',
        email: 'email',
      })
      expect(mockFetch.POST).toHaveBeenCalledWith({
        url: '/api/test',
        payload: sanitizedData,
      })
    })

    it('should not apply sanitization when sanitize config is not provided', async () => {
      mockFetch.POST.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(
        () =>
          useCoreMutation({
            url: '/api/test',
            toast: { enabled: false },
          }),
        { wrapper: createWrapper() },
      )

      const payload = { name: 'John', email: 'test@example.com' }
      await result.current.mutateAsync(payload)

      expect(mockSanitizeFormData).not.toHaveBeenCalled()
      expect(mockFetch.POST).toHaveBeenCalledWith({
        url: '/api/test',
        payload,
      })
    })

    it('should apply sanitization after transform', async () => {
      mockFetch.POST.mockResolvedValue(mockSuccessResponse)

      const transformedData = {
        name: 'JOHN',
        email: 'test@example.com',
        transformed: true,
      }
      const sanitizedData = {
        name: 'JOHN',
        email: 'test@example.com',
        transformed: true,
      }
      mockSanitizeFormData.mockReturnValue(sanitizedData)

      const transform = jest.fn((payload: any) => ({
        ...payload,
        name: payload.name.toUpperCase(),
        transformed: true,
      }))

      const { result } = renderHook(
        () =>
          useCoreMutation({
            url: '/api/test',
            transform,
            sanitize: { name: 'name', email: 'email' },
            toast: { enabled: false },
          }),
        { wrapper: createWrapper() },
      )

      const payload = { name: 'john', email: 'test@example.com' }
      await result.current.mutateAsync(payload)

      expect(transform).toHaveBeenCalledWith(payload)
      expect(mockSanitizeFormData).toHaveBeenCalledWith(transformedData, {
        name: 'name',
        email: 'email',
      })
      expect(mockFetch.POST).toHaveBeenCalledWith({
        url: '/api/test',
        payload: sanitizedData,
      })
    })

    it('should work with different HTTP methods', async () => {
      const methods = ['PUT', 'PATCH'] as const

      for (const method of methods) {
        mockFetch[method].mockResolvedValue(mockSuccessResponse)
        mockSanitizeFormData.mockReturnValue({ name: 'Clean Name' })

        const { result } = renderHook(
          () =>
            useCoreMutation({
              url: '/api/test',
              method,
              sanitize: { name: 'name' },
              toast: { enabled: false },
            }),
          { wrapper: createWrapper() },
        )

        await result.current.mutateAsync({ name: 'Dirty<script>Name' })

        expect(mockSanitizeFormData).toHaveBeenCalledWith(
          { name: 'Dirty<script>Name' },
          { name: 'name' },
        )
        expect(mockFetch[method]).toHaveBeenCalledWith({
          url: '/api/test',
          payload: { name: 'Clean Name' },
        })

        jest.clearAllMocks()
      }
    })
  })

  describe('progress bar integration', () => {
    // Define types for progress tests
    type TestPayload = { name: string }
    type TestResponse = { id: string; success: boolean }

    beforeEach(() => {
      mockFetch.POST.mockResolvedValue(mockSuccessResponse)
    })

    it('should NOT start progress by default when showProgress is not specified', async () => {
      const { result } = renderHook(
        () =>
          useCoreMutation<TestPayload, TestResponse>({
            url: '/api/test',
            method: 'POST',
            toast: { enabled: false },
          }),
        { wrapper: createWrapper() },
      )

      await result.current.mutateAsync({ name: 'Test' })

      expect(mockStart).not.toHaveBeenCalled()
      expect(mockStop).not.toHaveBeenCalled()
    })

    it('should NOT start progress when showProgress is false', async () => {
      const { result } = renderHook(
        () =>
          useCoreMutation<TestPayload, TestResponse>({
            url: '/api/test',
            method: 'POST',
            toast: { enabled: false },
            showProgress: false,
          }),
        { wrapper: createWrapper() },
      )

      await result.current.mutateAsync({ name: 'Test' })

      expect(mockStart).not.toHaveBeenCalled()
      expect(mockStop).not.toHaveBeenCalled()
    })

    it('should start and stop progress when showProgress is true', async () => {
      const { result } = renderHook(
        () =>
          useCoreMutation<TestPayload, TestResponse>({
            url: '/api/test',
            method: 'POST',
            toast: { enabled: false },
            showProgress: true,
          }),
        { wrapper: createWrapper() },
      )

      await result.current.mutateAsync({ name: 'Test' })

      expect(mockStart).toHaveBeenCalledTimes(1)
      expect(mockStop).toHaveBeenCalledTimes(1)
    })

    it('should stop progress even when mutation fails', async () => {
      const mockError = new Error('Test error')
      mockFetch.POST.mockRejectedValue(mockError)

      const { result } = renderHook(
        () =>
          useCoreMutation<TestPayload, TestResponse>({
            url: '/api/test',
            method: 'POST',
            toast: { enabled: false },
            showProgress: true,
          }),
        { wrapper: createWrapper() },
      )

      try {
        await result.current.mutateAsync({ name: 'Test' })
      } catch {
        // Expected to throw
      }

      expect(mockStart).toHaveBeenCalledTimes(1)
      expect(mockStop).toHaveBeenCalledTimes(1)
    })

    it('should work with progress enabled alongside other features', async () => {
      const transform = jest.fn((data: TestPayload) => ({
        ...data,
        transformed: true,
      }))

      const { result } = renderHook(
        () =>
          useCoreMutation<TestPayload, TestResponse>({
            url: '/api/test',
            method: 'POST',
            transform,
            toast: { enabled: false }, // Disable toast to avoid conflicts in this test
            showProgress: true,
          }),
        { wrapper: createWrapper() },
      )

      await result.current.mutateAsync({ name: 'Test' })

      expect(mockStart).toHaveBeenCalledTimes(1)
      expect(mockStop).toHaveBeenCalledTimes(1)
      expect(transform).toHaveBeenCalledWith({ name: 'Test' })
    })

    it('should start progress before transform and API call', async () => {
      const callOrder: string[] = []

      const transform = jest.fn((data: TestPayload) => {
        callOrder.push('transform')
        return data
      })

      mockStart.mockImplementation(() => {
        callOrder.push('start')
      })

      mockFetch.POST.mockImplementation(async () => {
        callOrder.push('fetch')
        return mockSuccessResponse
      })

      mockStop.mockImplementation(() => {
        callOrder.push('stop')
      })

      const { result } = renderHook(
        () =>
          useCoreMutation<TestPayload, TestResponse>({
            url: '/api/test',
            method: 'POST',
            transform,
            toast: { enabled: false },
            showProgress: true,
          }),
        { wrapper: createWrapper() },
      )

      await result.current.mutateAsync({ name: 'Test' })

      expect(callOrder).toEqual(['start', 'transform', 'fetch', 'stop'])
    })
  })
})
