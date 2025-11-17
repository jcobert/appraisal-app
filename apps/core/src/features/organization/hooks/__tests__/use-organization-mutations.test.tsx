import { useOrganizationMutations } from '../use-organization-mutations'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import useCoreMutation from '@/hooks/use-core-mutation'

// Mock dependencies
jest.mock('@/hooks/use-core-mutation')

const mockUseCoreMutation = useCoreMutation as jest.MockedFunction<
  typeof useCoreMutation
>

describe('useOrganizationMutations', () => {
  let queryClient: QueryClient
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element

  // Mock mutation return values
  const mockMutate = jest.fn()
  const mockMutateAsync = jest.fn()
  const mockReset = jest.fn()

  const createMockMutation = (): any => ({
    mutate: mockMutate,
    mutateAsync: mockMutateAsync,
    reset: mockReset,
    data: undefined,
    error: null,
    isError: false,
    isIdle: true,
    isPending: false,
    isSuccess: false,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    status: 'idle' as const,
    variables: undefined,
    submittedAt: 0,
    context: undefined,
  })

  beforeEach(() => {
    jest.clearAllMocks()

    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    // Create wrapper with QueryClientProvider
    wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    // Setup mock implementation
    mockUseCoreMutation.mockReturnValue(createMockMutation())
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('createOrganization', () => {
    it('should configure mutation with correct endpoint and method', () => {
      const { result } = renderHook(() => useOrganizationMutations(), {
        wrapper,
      })

      expect(result.current.createOrganization).toBeDefined()
      expect(mockUseCoreMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          url: CORE_API_ENDPOINTS.organization,
          method: 'POST',
          sanitize: { name: 'text' },
          toast: {
            messages: {
              success: expect.any(Function),
            },
          },
        }),
      )
    })

    it('should include custom success toast message', () => {
      renderHook(() => useOrganizationMutations(), { wrapper })

      const callArgs = mockUseCoreMutation.mock.calls[0]?.[0]
      const successMessage = callArgs?.toast?.messages?.success

      if (typeof successMessage === 'function') {
        const message = successMessage({
          response: { status: 200, data: {} },
          context: { name: 'Test Org' },
        })
        expect(message).toBe('Organization Test Org has been created!')
      }
    })

    it('should invalidate queries on success', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

      renderHook(() => useOrganizationMutations(), { wrapper })

      const callArgs = mockUseCoreMutation.mock.calls[0]?.[0]
      await callArgs?.onSuccess?.(
        { status: 200, data: {} },
        {} as any,
        undefined,
      )

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(['organizations']),
        exact: true,
      })
    })
  })

  describe('updateOrganization', () => {
    const organizationId = 'org-123'

    it('should configure mutation with correct endpoint and method', () => {
      const { result } = renderHook(
        () => useOrganizationMutations({ organizationId }),
        { wrapper },
      )

      expect(result.current.updateOrganization).toBeDefined()
      expect(mockUseCoreMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${CORE_API_ENDPOINTS.organization}/${organizationId}`,
          method: 'PUT',
          sanitize: { name: 'text' },
        }),
      )
    })

    it('should refetch specific organization and invalidate all on success', async () => {
      const refetchSpy = jest.spyOn(queryClient, 'refetchQueries')
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

      renderHook(() => useOrganizationMutations({ organizationId }), {
        wrapper,
      })

      const callArgs = mockUseCoreMutation.mock.calls[1]?.[0]
      await callArgs?.onSuccess?.(
        { status: 200, data: {} },
        {} as any,
        undefined,
      )

      expect(refetchSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining([
          'organizations',
          { id: organizationId },
        ]),
        exact: true,
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(['organizations']),
        exact: true,
      })
    })
  })

  describe('deleteOrganization', () => {
    const organizationId = 'org-123'

    it('should configure mutation with correct endpoint and method', () => {
      const { result } = renderHook(
        () => useOrganizationMutations({ organizationId }),
        { wrapper },
      )

      expect(result.current.deleteOrganization).toBeDefined()
      expect(mockUseCoreMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${CORE_API_ENDPOINTS.organization}/${organizationId}`,
          method: 'DELETE',
        }),
      )
    })

    it('should remove specific organization query and invalidate all on success', async () => {
      const removeSpy = jest.spyOn(queryClient, 'removeQueries')
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

      renderHook(() => useOrganizationMutations({ organizationId }), {
        wrapper,
      })

      const callArgs = mockUseCoreMutation.mock.calls[2]?.[0]
      await callArgs?.onSuccess?.(
        { status: 200, data: {} },
        {} as any,
        undefined,
      )

      expect(removeSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining([
          'organizations',
          { id: organizationId },
        ]),
        exact: true,
        type: 'all',
        stale: true,
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(['organizations']),
        exact: true,
      })
    })
  })

  describe('updateOrgMember', () => {
    const organizationId = 'org-123'
    const memberId = 'member-456'

    it('should configure mutation with correct endpoint and method', () => {
      const { result } = renderHook(
        () => useOrganizationMutations({ organizationId, memberId }),
        { wrapper },
      )

      expect(result.current.updateOrgMember).toBeDefined()
      expect(mockUseCoreMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/members/${memberId}`,
          method: 'PUT',
        }),
      )
    })

    it('should refetch specific organization and invalidate all on success', async () => {
      const refetchSpy = jest.spyOn(queryClient, 'refetchQueries')
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

      renderHook(() => useOrganizationMutations({ organizationId, memberId }), {
        wrapper,
      })

      const callArgs = mockUseCoreMutation.mock.calls[3]?.[0]
      await callArgs?.onSuccess?.(
        { status: 200, data: {} },
        {} as any,
        undefined,
      )

      expect(refetchSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining([
          'organizations',
          { id: organizationId },
        ]),
        exact: true,
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(['organizations']),
        exact: true,
      })
    })
  })

  describe('deleteOrgMember', () => {
    const organizationId = 'org-123'
    const memberId = 'member-456'

    it('should configure mutation with correct endpoint and method', () => {
      const { result } = renderHook(
        () => useOrganizationMutations({ organizationId, memberId }),
        { wrapper },
      )

      expect(result.current.deleteOrgMember).toBeDefined()
      expect(mockUseCoreMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/members/${memberId}`,
          method: 'DELETE',
        }),
      )
    })

    it('should refetch specific organization and invalidate all on success', async () => {
      const refetchSpy = jest.spyOn(queryClient, 'refetchQueries')
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

      renderHook(() => useOrganizationMutations({ organizationId, memberId }), {
        wrapper,
      })

      const callArgs = mockUseCoreMutation.mock.calls[4]?.[0]
      await callArgs?.onSuccess?.(
        { status: 200, data: {} },
        {} as any,
        undefined,
      )

      expect(refetchSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining([
          'organizations',
          { id: organizationId },
        ]),
        exact: true,
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(['organizations']),
        exact: true,
      })
    })
  })

  describe('custom options', () => {
    it('should merge custom options with default configuration', () => {
      const customOptions = {
        onError: jest.fn(),
        onSettled: jest.fn(),
      }

      renderHook(() => useOrganizationMutations({ options: customOptions }), {
        wrapper,
      })

      expect(mockUseCoreMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          url: CORE_API_ENDPOINTS.organization,
          method: 'POST',
          onError: customOptions.onError,
          onSettled: customOptions.onSettled,
        }),
      )
    })

    it('should allow custom options to override defaults', () => {
      const customToast = {
        messages: {
          success: () => 'Custom success message',
        },
      }

      renderHook(
        () =>
          useOrganizationMutations({
            options: { toast: customToast } as any,
          }),
        { wrapper },
      )

      const callArgs = mockUseCoreMutation.mock.calls[0]?.[0]
      expect(callArgs?.toast).toEqual(customToast)
    })
  })

  describe('refreshData callback', () => {
    it('should only invalidate queries when mode is create', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
      const removeSpy = jest.spyOn(queryClient, 'removeQueries')

      renderHook(() => useOrganizationMutations(), { wrapper })

      const callArgs = mockUseCoreMutation.mock.calls[0]?.[0]
      await callArgs?.onSuccess?.(
        { status: 200, data: {} },
        {} as any,
        undefined,
      )

      // Should only invalidate all organizations (no remove)
      expect(removeSpy).not.toHaveBeenCalled()
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(['organizations']),
        exact: true,
      })
    })

    it('should refetch and invalidate when mode is update', async () => {
      const organizationId = 'org-123'
      const refetchSpy = jest.spyOn(queryClient, 'refetchQueries')
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
      const removeSpy = jest.spyOn(queryClient, 'removeQueries')

      renderHook(() => useOrganizationMutations({ organizationId }), {
        wrapper,
      })

      // updateOrganization calls refreshData({ mode: 'update' })
      const callArgs = mockUseCoreMutation.mock.calls[1]?.[0]
      await callArgs?.onSuccess?.(
        { status: 200, data: {} },
        {} as any,
        undefined,
      )

      // Should refetch specific organization (no remove)
      expect(removeSpy).not.toHaveBeenCalled()
      expect(refetchSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining([
          'organizations',
          { id: organizationId },
        ]),
        exact: true,
      })
      // Should also invalidate all
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(['organizations']),
        exact: true,
      })
    })

    it('should remove query and invalidate when mode is delete', async () => {
      const organizationId = 'org-123'
      const removeSpy = jest.spyOn(queryClient, 'removeQueries')
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

      renderHook(() => useOrganizationMutations({ organizationId }), {
        wrapper,
      })

      // deleteOrganization calls refreshData({ mode: 'delete' })
      const callArgs = mockUseCoreMutation.mock.calls[2]?.[0]
      await callArgs?.onSuccess?.(
        { status: 200, data: {} },
        {} as any,
        undefined,
      )

      // Should remove specific organization query
      expect(removeSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining([
          'organizations',
          { id: organizationId },
        ]),
        exact: true,
        type: 'all',
        stale: true,
      })
      // Should also invalidate all
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(['organizations']),
        exact: true,
      })
    })
  })

  describe('return values', () => {
    it('should return all mutation functions', () => {
      const { result } = renderHook(
        () =>
          useOrganizationMutations({
            organizationId: 'org-123',
            memberId: 'member-456',
          }),
        { wrapper },
      )

      expect(result.current).toEqual({
        createOrganization: expect.any(Object),
        updateOrganization: expect.any(Object),
        deleteOrganization: expect.any(Object),
        updateOrgMember: expect.any(Object),
        deleteOrgMember: expect.any(Object),
      })
    })

    it('should have all standard mutation properties', () => {
      const { result } = renderHook(() => useOrganizationMutations(), {
        wrapper,
      })

      const mutation = result.current.createOrganization
      expect(mutation).toHaveProperty('mutate')
      expect(mutation).toHaveProperty('mutateAsync')
      expect(mutation).toHaveProperty('reset')
      expect(mutation).toHaveProperty('isIdle')
      expect(mutation).toHaveProperty('isPending')
      expect(mutation).toHaveProperty('isSuccess')
      expect(mutation).toHaveProperty('isError')
    })
  })
})
