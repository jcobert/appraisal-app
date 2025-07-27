import { useOrgPageRedirect } from '../use-org-page-redirect'
import { renderHook } from '@testing-library/react'
import { useRouter } from 'next/navigation'

import { useOrganizationContext } from '@/providers/organization-provider'

// Mock Next.js router
jest.mock('next/navigation')
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockPush = jest.fn()

// Mock organization context
jest.mock('@/providers/organization-provider')
const mockUseOrganizationContext =
  useOrganizationContext as jest.MockedFunction<typeof useOrganizationContext>

describe('useOrgPageRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default router mock
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any)
  })

  describe('Basic redirect behavior', () => {
    it('should redirect when activeOrgId differs from currentOrgId', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-2',
      } as any)

      renderHook(() => useOrgPageRedirect('org-1'))

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should not redirect when activeOrgId matches currentOrgId', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-1',
      } as any)

      renderHook(() => useOrgPageRedirect('org-1'))

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should not redirect when activeOrgId is null', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: null,
      } as any)

      renderHook(() => useOrgPageRedirect('org-1'))

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should not redirect when activeOrgId is undefined', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: undefined,
      } as any)

      renderHook(() => useOrgPageRedirect('org-1'))

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Custom redirect destination', () => {
    it('should redirect to custom path when provided', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-2',
      } as any)

      renderHook(() =>
        useOrgPageRedirect('org-1', { redirectTo: '/organizations' }),
      )

      expect(mockPush).toHaveBeenCalledWith('/organizations')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should redirect to complex path with parameters', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-2',
      } as any)

      renderHook(() =>
        useOrgPageRedirect('org-1', { redirectTo: '/dashboard?tab=overview' }),
      )

      expect(mockPush).toHaveBeenCalledWith('/dashboard?tab=overview')
    })
  })

  describe('Enabled/disabled behavior', () => {
    it('should not redirect when enabled is false', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-2',
      } as any)

      renderHook(() => useOrgPageRedirect('org-1', { enabled: false }))

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should redirect when enabled is explicitly true', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-2',
      } as any)

      renderHook(() => useOrgPageRedirect('org-1', { enabled: true }))

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should redirect when enabled is not provided (defaults to true)', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-2',
      } as any)

      renderHook(() => useOrgPageRedirect('org-1'))

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('Combined options', () => {
    it('should use custom redirectTo and respect enabled flag', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-2',
      } as any)

      renderHook(() =>
        useOrgPageRedirect('org-1', {
          redirectTo: '/custom-page',
          enabled: true,
        }),
      )

      expect(mockPush).toHaveBeenCalledWith('/custom-page')
    })

    it('should not redirect with custom redirectTo when disabled', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-2',
      } as any)

      renderHook(() =>
        useOrgPageRedirect('org-1', {
          redirectTo: '/custom-page',
          enabled: false,
        }),
      )

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Re-render behavior', () => {
    it('should redirect when activeOrgId changes on re-render', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-1', // Initially matches
      } as any)

      const { rerender } = renderHook(() => useOrgPageRedirect('org-1'))

      // No redirect on initial render
      expect(mockPush).not.toHaveBeenCalled()

      // Change activeOrgId to trigger redirect
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-2',
      } as any)

      rerender()

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should not redirect multiple times for same org change', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-2',
      } as any)

      const { rerender } = renderHook(() => useOrgPageRedirect('org-1'))

      // Should redirect on initial render
      expect(mockPush).toHaveBeenCalledTimes(1)

      // Re-render with same values shouldn't trigger another redirect
      rerender()

      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should redirect again when switching to a different org', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-2',
      } as any)

      const { rerender } = renderHook(() => useOrgPageRedirect('org-1'))

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockPush).toHaveBeenCalledTimes(1)

      // Switch to org-3
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-3',
      } as any)

      rerender()

      expect(mockPush).toHaveBeenCalledTimes(2)
      expect(mockPush).toHaveBeenLastCalledWith('/dashboard')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty string currentOrgId', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-1',
      } as any)

      renderHook(() => useOrgPageRedirect(''))

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle empty string activeOrgId', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: '',
      } as any)

      renderHook(() => useOrgPageRedirect('org-1'))

      // Empty string is falsy, so no redirect should occur
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle changing currentOrgId parameter', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-2',
      } as any)

      let currentOrgId = 'org-1'
      const { rerender } = renderHook(() => useOrgPageRedirect(currentOrgId))

      // Should redirect initially
      expect(mockPush).toHaveBeenCalledTimes(1)

      // Change currentOrgId to match activeOrgId - should not redirect again
      currentOrgId = 'org-2'
      rerender()

      expect(mockPush).toHaveBeenCalledTimes(1)

      // Change currentOrgId to different value - should redirect again
      currentOrgId = 'org-3'
      rerender()

      expect(mockPush).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error handling', () => {
    it('should handle missing organization context gracefully', () => {
      mockUseOrganizationContext.mockReturnValue({} as any)

      expect(() => {
        renderHook(() => useOrgPageRedirect('org-1'))
      }).not.toThrow()

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle router.push throwing an error', () => {
      // Reset mocks for this specific test
      jest.clearAllMocks()

      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-2',
      } as any)

      const mockPushWithError = jest.fn(() => {
        throw new Error('Navigation failed')
      })

      mockUseRouter.mockReturnValue({
        push: mockPushWithError,
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
      } as any)

      expect(() => {
        renderHook(() => useOrgPageRedirect('org-1'))
      }).toThrow('Navigation failed')

      expect(mockPushWithError).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle user switching from org-settings page to different org', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'new-org',
      } as any)

      renderHook(() =>
        useOrgPageRedirect('old-org', { redirectTo: '/dashboard' }),
      )

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle conditional redirect based on user permissions', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-2',
      } as any)

      const hasPermissionToViewOtherOrgs = false

      renderHook(() =>
        useOrgPageRedirect('org-1', {
          enabled: !hasPermissionToViewOtherOrgs,
        }),
      )

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should allow cross-org viewing when user has permission', () => {
      mockUseOrganizationContext.mockReturnValue({
        activeOrgId: 'org-2',
      } as any)

      const hasPermissionToViewOtherOrgs = true

      renderHook(() =>
        useOrgPageRedirect('org-1', {
          enabled: !hasPermissionToViewOtherOrgs,
        }),
      )

      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
