import toast from 'react-hot-toast'

import { FetchErrorCode, FetchResponse } from '@/utils/fetch'
import {
  type ToastMessages,
  defaultToastMessages,
  toastyQuery,
} from '@/utils/toast'

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    promise: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock fetch utils
jest.mock('@/utils/fetch', () => ({
  FetchErrorCode: {
    INVALID_DATA: 'INVALID_DATA',
    AUTH: 'AUTH',
    FAILURE: 'FAILURE',
    DATABASE_FAILURE: 'DATABASE_FAILURE',
    DUPLICATE: 'DUPLICATE',
    NOT_FOUND: 'NOT_FOUND',
  },
  successful: jest.fn((status?: number) => {
    if (!status) return false
    return status >= 200 && status < 300
  }),
}))

describe('Toast Utils', () => {
  const mockToast = {
    error: toast.error as jest.MockedFunction<typeof toast.error>,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('defaultToastMessages', () => {
    it('should have correct default loading message', () => {
      expect(defaultToastMessages.loading).toBe('Saving changes...')
    })

    it('should have correct default success message', () => {
      expect(defaultToastMessages.success()).toBe(
        'Your changes have been saved!',
      )
    })

    it('should have correct default error messages', () => {
      const mockResponse = {
        status: 400,
        data: null,
        error: { message: 'Test error' },
      } as FetchResponse<unknown>

      expect(
        defaultToastMessages.error.INVALID_DATA?.({ response: mockResponse }),
      ).toBe('There was a problem with your request.\nError: Test error')

      expect(defaultToastMessages.error.AUTH?.()).toBe(
        'You are not authorized to do that.',
      )

      expect(defaultToastMessages.error.FAILURE?.()).toBe(
        'An unexpected error occurred. Please try again.',
      )
    })
  })

  describe('ToastMessages type', () => {
    it('should allow custom success messages with context', () => {
      const customMessages: ToastMessages<{ id: string }, { name: string }> = {
        success: ({ response, context }) =>
          `Created ${context?.name} with ID ${response.data?.id}!`,
      }

      const mockResponse = {
        status: 200,
        data: { id: 'test-id' },
      } as FetchResponse<{ id: string }>

      const context = { name: 'Test Organization' }

      const result = customMessages.success?.({
        response: mockResponse,
        context,
      })
      expect(result).toBe('Created Test Organization with ID test-id!')
    })

    it('should allow custom error messages with context', () => {
      const customMessages: ToastMessages<unknown, { field: string }> = {
        error: {
          INVALID_DATA: ({ response, context }) =>
            `Invalid ${context?.field}: ${response.error?.message}`,
        },
      }

      const mockResponse = {
        status: 400,
        data: null,
        error: { code: FetchErrorCode.INVALID_DATA, message: 'Required field' },
      } as FetchResponse<unknown>

      const context = { field: 'email' }

      const result = customMessages.error?.INVALID_DATA?.({
        response: mockResponse,
        context,
      })
      expect(result).toBe('Invalid email: Required field')
    })

    it('should allow custom loading messages', () => {
      const customMessages: ToastMessages<unknown, unknown> = {
        loading: 'Creating organization...',
      }

      expect(customMessages.loading).toBe('Creating organization...')
    })
  })

  describe('Error handling edge cases', () => {
    it('should handle missing error message', () => {
      const mockResponse = {
        status: 400,
        data: null,
        error: { code: FetchErrorCode.INVALID_DATA },
      } as FetchResponse<unknown>

      const result = defaultToastMessages.error.INVALID_DATA?.({
        response: mockResponse,
      })
      expect(result).toBe('There was a problem with your request.')
    })

    it('should handle different error codes', () => {
      const codes = [
        'AUTH',
        'FAILURE',
        'DATABASE_FAILURE',
        'DUPLICATE',
        'NOT_FOUND',
      ] as const

      codes.forEach((code) => {
        const errorHandler = defaultToastMessages.error[code]
        expect(typeof errorHandler).toBe('function')

        const result = errorHandler?.()
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Context handling', () => {
    it('should handle undefined context gracefully', () => {
      const customMessages: ToastMessages<{ id: string }, { name?: string }> = {
        success: ({ response, context }) =>
          `Created ${context?.name || 'item'} with ID ${response.data?.id}!`,
      }

      const mockResponse = {
        status: 200,
        data: { id: 'test-id' },
      } as FetchResponse<{ id: string }>

      const result = customMessages.success?.({
        response: mockResponse,
        context: undefined,
      })
      expect(result).toBe('Created item with ID test-id!')
    })

    it('should handle complex context objects', () => {
      type ComplexContext = {
        user: { id: string; name: string }
        organization: { id: string; name: string }
        action: string
      }

      const customMessages: ToastMessages<unknown, ComplexContext> = {
        success: ({ context }) =>
          `${context?.user.name} successfully performed ${context?.action} on ${context?.organization.name}`,
      }

      const context: ComplexContext = {
        user: { id: 'user-1', name: 'John Doe' },
        organization: { id: 'org-1', name: 'Acme Corp' },
        action: 'update',
      }

      const mockResponse = {
        status: 200,
        data: null,
      } as FetchResponse<unknown>

      const result = customMessages.success?.({
        response: mockResponse,
        context,
      })
      expect(result).toBe('John Doe successfully performed update on Acme Corp')
    })
  })

  describe('toastyQuery', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should return result when query succeeds', async () => {
      const mockResponse = { data: 'test' }
      const queryFn = jest.fn().mockResolvedValue(mockResponse)

      const result = await toastyQuery(queryFn)

      expect(result).toEqual(mockResponse)
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(mockToast.error).not.toHaveBeenCalled()
    })

    it('should show error toast and re-throw error when query fails', async () => {
      const mockError = new Error('Query failed')
      const queryFn = jest.fn().mockRejectedValue(mockError)

      await expect(toastyQuery(queryFn)).rejects.toThrow('Query failed')

      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(mockToast.error).toHaveBeenCalledWith(
        'An unexpected error occurred. Please try again.',
        undefined,
      )
    })

    it('should use custom error messages when provided', async () => {
      const mockError = { code: 'NOT_FOUND' }
      const queryFn = jest.fn().mockRejectedValue(mockError)
      const customMessages = {
        error: {
          NOT_FOUND: () => 'Custom not found message',
        },
      }

      try {
        await toastyQuery(queryFn, customMessages)
        // If we reach here, the function didn't throw
        fail('Expected toastyQuery to throw but it did not')
      } catch (error) {
        // Expected to throw
        expect(error).toEqual(mockError)
      }

      expect(mockToast.error).toHaveBeenCalledWith(
        'Custom not found message',
        undefined,
      )
    })

    it('should pass custom toast options', async () => {
      const mockError = new Error('Query failed')
      const queryFn = jest.fn().mockRejectedValue(mockError)
      const customOptions = { duration: 5000 }

      await expect(
        toastyQuery(queryFn, undefined, customOptions),
      ).rejects.toThrow()

      expect(mockToast.error).toHaveBeenCalledWith(
        'An unexpected error occurred. Please try again.',
        customOptions,
      )
    })
  })
})
