// Import toast after mocking to get the mocked version
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
    success: jest.fn(),
  },
}))

const mockToast = {
  error: toast.error as jest.MockedFunction<typeof toast.error>,
  success: toast.success as jest.MockedFunction<typeof toast.success>,
}

describe('Toast Utils', () => {
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
      ).toBe('Error: Test error')

      expect(defaultToastMessages.error.NOT_AUTHENTICATED?.()).toBe(
        'Please sign in to continue.',
      )

      expect(defaultToastMessages.error.NOT_AUTHORIZED?.()).toBe(
        'You are not authorized to perform this action.',
      )

      expect(defaultToastMessages.error.INTERNAL_ERROR?.()).toBe(
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
        'NOT_AUTHENTICATED',
        'NOT_AUTHORIZED',
        'INTERNAL_ERROR',
        'DATABASE_FAILURE',
        'DUPLICATE',
        'NOT_FOUND',
        'NETWORK_ERROR',
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
      const mockResponse = { status: 200, data: 'test' }
      const queryFn = jest.fn().mockResolvedValue(mockResponse)

      const result = await toastyQuery(queryFn)

      expect(result).toEqual(mockResponse)
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(mockToast.error).not.toHaveBeenCalled()
      expect(mockToast.success).not.toHaveBeenCalled()
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
      const { FetchError, FetchErrorCode } = jest.requireActual('@/utils/fetch')
      const mockError = new FetchError({
        status: 404,
        data: null,
        error: {
          code: FetchErrorCode.NOT_FOUND,
          message: 'Not found',
        },
      })

      const queryFn = jest.fn().mockRejectedValue(mockError)
      const customMessages: ToastMessages = {
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

    it('should show success toast when configured and query succeeds', async () => {
      const mockResponse = { status: 200, data: 'test' }
      const queryFn = jest.fn().mockResolvedValue(mockResponse)
      const customMessages = {
        success: () => 'Query completed successfully!',
      }

      const result = await toastyQuery(queryFn, customMessages)

      expect(result).toEqual(mockResponse)
      expect(mockToast.success).toHaveBeenCalledWith(
        'Query completed successfully!',
        undefined,
      )
      expect(mockToast.error).not.toHaveBeenCalled()
    })

    it('should not show success toast when not configured', async () => {
      const mockResponse = { status: 200, data: 'test' }
      const queryFn = jest.fn().mockResolvedValue(mockResponse)

      const result = await toastyQuery(queryFn)

      expect(result).toEqual(mockResponse)
      expect(mockToast.success).not.toHaveBeenCalled()
      expect(mockToast.error).not.toHaveBeenCalled()
    })

    it('should return successful response without error toast', async () => {
      const mockResponse = {
        status: 200,
        data: { id: 1, name: 'test' },
      }
      const queryFn = jest.fn().mockResolvedValue(mockResponse)

      const result = await toastyQuery(queryFn)

      expect(result).toEqual(mockResponse)
      expect(mockToast.error).not.toHaveBeenCalled()
      expect(mockToast.success).not.toHaveBeenCalled()
    })
  })
})
