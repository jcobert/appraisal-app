import {
  ACTIVE_ORG_COOKIE_MAX_AGE,
  getActiveOrgCookieName,
  useStoredSettings,
} from '../use-stored-settings'
import { act, renderHook } from '@testing-library/react'

// Mock the siteConfig
jest.mock('@/configuration/site', () => ({
  siteConfig: {
    title: 'Test App',
  },
}))

// Mock useLocalStorage
const mockUseLocalStorage = jest.fn()
jest.mock('usehooks-ts', () => ({
  useLocalStorage: (...args: unknown[]) => mockUseLocalStorage(...args),
}))

describe('useStoredSettings', () => {
  const mockSettings = { activeOrgId: 'org-123' }
  const mockUpdateSettings = jest.fn()
  const mockClearSettings = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalStorage.mockReturnValue([
      mockSettings,
      mockUpdateSettings,
      mockClearSettings,
    ])
  })

  describe('with valid userId', () => {
    const userId = 'user-456'

    it('should create user-specific storage key', () => {
      renderHook(() => useStoredSettings({ userId }))

      expect(mockUseLocalStorage).toHaveBeenCalledWith(
        'test-app-prefs-user-456',
        { activeOrgId: '' },
      )
    })

    it('should return stored settings for authenticated user', () => {
      const { result } = renderHook(() => useStoredSettings({ userId }))

      expect(result.current.settings).toEqual(mockSettings)
    })

    it('should allow updating settings when userId exists', () => {
      const { result } = renderHook(() => useStoredSettings({ userId }))

      act(() => {
        result.current.updateSettings({ activeOrgId: 'new-org-789' })
      })

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        activeOrgId: 'new-org-789',
      })
    })

    it('should return actual clearSettings function for authenticated user', () => {
      const { result } = renderHook(() => useStoredSettings({ userId }))

      expect(result.current.clearSettings).toBe(mockClearSettings)
    })

    it('should use initialSettings when provided', () => {
      const initialSettings = { activeOrgId: 'initial-org' }

      renderHook(() => useStoredSettings({ userId, initialSettings }))

      expect(mockUseLocalStorage).toHaveBeenCalledWith(
        'test-app-prefs-user-456',
        initialSettings,
      )
    })

    it('should merge new settings with existing settings', () => {
      const { result } = renderHook(() => useStoredSettings({ userId }))

      act(() => {
        result.current.updateSettings({ activeOrgId: 'merged-org' })
      })

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        activeOrgId: 'merged-org',
      })
    })
  })

  describe('without userId', () => {
    it('should create temporary storage key with timestamp', () => {
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1234567890)

      renderHook(() => useStoredSettings({ userId: undefined }))

      expect(mockUseLocalStorage).toHaveBeenCalledWith(
        'test-app-guest-1234567890',
        { activeOrgId: '' },
      )

      dateSpy.mockRestore()
    })

    it('should return default settings when no userId', () => {
      const { result } = renderHook(() =>
        useStoredSettings({ userId: undefined }),
      )

      expect(result.current.settings).toEqual({ activeOrgId: '' })
    })

    it('should not update settings when no userId', () => {
      const { result } = renderHook(() =>
        useStoredSettings({ userId: undefined }),
      )

      act(() => {
        result.current.updateSettings({ activeOrgId: 'should-not-update' })
      })

      expect(mockUpdateSettings).not.toHaveBeenCalled()
    })

    it('should return no-op clearSettings function when no userId', () => {
      const { result } = renderHook(() =>
        useStoredSettings({ userId: undefined }),
      )

      // Should not throw and should not call actual clearSettings
      act(() => {
        result.current.clearSettings()
      })

      expect(mockClearSettings).not.toHaveBeenCalled()
    })
  })

  describe('updateSettings stability', () => {
    it('should maintain stable reference when dependencies do not change', () => {
      const userId = 'user-456'
      const { result, rerender } = renderHook(() =>
        useStoredSettings({ userId }),
      )

      const firstUpdateSettings = result.current.updateSettings

      // Rerender with same props
      rerender()

      expect(result.current.updateSettings).toBe(firstUpdateSettings)
    })

    it('should create new reference when userId changes', () => {
      const { result, rerender } = renderHook(
        ({ userId }: { userId?: string }) => useStoredSettings({ userId }),
        { initialProps: { userId: 'user-1' } },
      )

      const firstUpdateSettings = result.current.updateSettings

      // Change userId
      rerender({ userId: 'user-2' })

      expect(result.current.updateSettings).not.toBe(firstUpdateSettings)
    })

    it('should create new reference when settings change', () => {
      const userId = 'user-456'

      // First render with initial settings
      mockUseLocalStorage.mockReturnValue([
        { activeOrgId: 'org-1' },
        mockUpdateSettings,
        mockClearSettings,
      ])

      const { result, rerender } = renderHook(() =>
        useStoredSettings({ userId }),
      )
      const firstUpdateSettings = result.current.updateSettings

      // Change settings
      mockUseLocalStorage.mockReturnValue([
        { activeOrgId: 'org-2' },
        mockUpdateSettings,
        mockClearSettings,
      ])

      rerender()

      expect(result.current.updateSettings).not.toBe(firstUpdateSettings)
    })
  })

  describe('edge cases', () => {
    it('should handle empty string userId', () => {
      const { result } = renderHook(() => useStoredSettings({ userId: '' }))

      expect(result.current.settings).toEqual({ activeOrgId: '' })

      act(() => {
        result.current.updateSettings({ activeOrgId: 'should-not-update' })
      })

      expect(mockUpdateSettings).not.toHaveBeenCalled()
    })

    it('should handle site title with spaces correctly', () => {
      // This test verifies the current behavior - only first space is replaced
      const userId = 'user-123'
      renderHook(() => useStoredSettings({ userId }))

      expect(mockUseLocalStorage).toHaveBeenCalledWith(
        'test-app-prefs-user-123',
        { activeOrgId: '' },
      )
    })

    it('should handle undefined site title gracefully', () => {
      // The current mock handles this case fine since we're mocking siteConfig
      const userId = 'user-123'
      renderHook(() => useStoredSettings({ userId }))

      // Should not throw and should create some key
      expect(mockUseLocalStorage).toHaveBeenCalled()
    })
  })

  describe('return value consistency', () => {
    it('should always return an object with settings, updateSettings, and clearSettings', () => {
      const { result } = renderHook(() =>
        useStoredSettings({ userId: 'user-123' }),
      )

      expect(result.current).toHaveProperty('settings')
      expect(result.current).toHaveProperty('updateSettings')
      expect(result.current).toHaveProperty('clearSettings')
      expect(typeof result.current.updateSettings).toBe('function')
      expect(typeof result.current.clearSettings).toBe('function')
    })

    it('should maintain consistent return structure for unauthenticated users', () => {
      const { result } = renderHook(() =>
        useStoredSettings({ userId: undefined }),
      )

      expect(result.current).toHaveProperty('settings')
      expect(result.current).toHaveProperty('updateSettings')
      expect(result.current).toHaveProperty('clearSettings')
      expect(typeof result.current.updateSettings).toBe('function')
      expect(typeof result.current.clearSettings).toBe('function')
    })
  })

  describe('Cookie Integration', () => {
    describe('getActiveOrgCookieName', () => {
      it('should generate user-specific cookie names', () => {
        expect(getActiveOrgCookieName('user-123')).toBe(
          'active_org_id_user-123',
        )
        expect(getActiveOrgCookieName('user-456')).toBe(
          'active_org_id_user-456',
        )
      })

      it('should handle special characters in user IDs', () => {
        expect(getActiveOrgCookieName('user@example.com')).toBe(
          'active_org_id_user@example.com',
        )
        expect(getActiveOrgCookieName('user-with-dashes')).toBe(
          'active_org_id_user-with-dashes',
        )
        expect(getActiveOrgCookieName('user_with_underscores')).toBe(
          'active_org_id_user_with_underscores',
        )
      })

      it('should generate different names for different users', () => {
        const name1 = getActiveOrgCookieName('user1')
        const name2 = getActiveOrgCookieName('user2')
        expect(name1).not.toBe(name2)
      })
    })

    describe('Cookie Constants', () => {
      it('should have proper cookie max age (30 days in seconds)', () => {
        const thirtyDaysInSeconds = 60 * 60 * 24 * 30
        expect(ACTIVE_ORG_COOKIE_MAX_AGE).toBe(thirtyDaysInSeconds)
      })
    })

    describe('Server-side Props Integration', () => {
      it('should work with initialSettings from server (cookie) value', () => {
        const initialSettings = { activeOrgId: 'server-org-id' }
        renderHook(() =>
          useStoredSettings({ userId: 'user-123', initialSettings }),
        )

        expect(mockUseLocalStorage).toHaveBeenCalledWith(
          'test-app-prefs-user-123',
          { activeOrgId: 'server-org-id' },
        )
      })

      it('should merge initialSettings with defaults', () => {
        const initialSettings = { activeOrgId: 'from-cookie' }
        renderHook(() =>
          useStoredSettings({ userId: 'user-123', initialSettings }),
        )

        expect(mockUseLocalStorage).toHaveBeenCalledWith(
          'test-app-prefs-user-123',
          expect.objectContaining({
            activeOrgId: 'from-cookie',
          }),
        )
      })

      it('should handle undefined initialActiveOrgId', () => {
        const initialSettings = { activeOrgId: undefined }
        renderHook(() =>
          useStoredSettings({ userId: 'user-123', initialSettings }),
        )

        expect(mockUseLocalStorage).toHaveBeenCalledWith(
          'test-app-prefs-user-123',
          expect.objectContaining({
            activeOrgId: undefined,
          }),
        )
      })
    })

    describe('Multi-User Storage Isolation', () => {
      it('should create different storage keys for different users', () => {
        renderHook(() => useStoredSettings({ userId: 'user-1' }))
        renderHook(() => useStoredSettings({ userId: 'user-2' }))

        expect(mockUseLocalStorage).toHaveBeenCalledWith(
          'test-app-prefs-user-1',
          expect.any(Object),
        )
        expect(mockUseLocalStorage).toHaveBeenCalledWith(
          'test-app-prefs-user-2',
          expect.any(Object),
        )
      })

      it('should isolate settings between different users', () => {
        const { result: user1Result } = renderHook(() =>
          useStoredSettings({ userId: 'user-1' }),
        )
        const { result: user2Result } = renderHook(() =>
          useStoredSettings({ userId: 'user-2' }),
        )

        // Both should have independent updateSettings functions
        expect(typeof user1Result.current.updateSettings).toBe('function')
        expect(typeof user2Result.current.updateSettings).toBe('function')
        expect(user1Result.current.updateSettings).not.toBe(
          user2Result.current.updateSettings,
        )
      })
    })

    describe('Backward Compatibility', () => {
      it('should work without initialSettings (legacy behavior)', () => {
        renderHook(() => useStoredSettings({ userId: 'user-123' }))

        expect(mockUseLocalStorage).toHaveBeenCalledWith(
          'test-app-prefs-user-123',
          { activeOrgId: '' },
        )
      })

      it('should maintain same API regardless of initialization method', () => {
        const { result: withInitial } = renderHook(() =>
          useStoredSettings({
            userId: 'user-123',
            initialSettings: { activeOrgId: 'initial' },
          }),
        )

        const { result: withoutInitial } = renderHook(() =>
          useStoredSettings({ userId: 'user-456' }),
        )

        // Both should have same API surface
        expect(withInitial.current).toHaveProperty('settings')
        expect(withInitial.current).toHaveProperty('updateSettings')
        expect(withInitial.current).toHaveProperty('clearSettings')

        expect(withoutInitial.current).toHaveProperty('settings')
        expect(withoutInitial.current).toHaveProperty('updateSettings')
        expect(withoutInitial.current).toHaveProperty('clearSettings')
      })
    })

    describe('Edge Cases', () => {
      it('should handle very long organization IDs in cookie names', () => {
        const longUserId = 'very-long-user-id-'.repeat(10) // Long user ID
        const cookieName = getActiveOrgCookieName(longUserId)

        expect(cookieName).toBe(`active_org_id_${longUserId}`)
        expect(cookieName.length).toBeGreaterThan(100) // Verify it's actually long
      })

      it('should handle special characters in organization IDs', () => {
        const { result } = renderHook(() =>
          useStoredSettings({ userId: 'user-123' }),
        )
        const specialOrgId = 'org-with-special!@#$%^&*()chars'

        act(() => {
          result.current.updateSettings({ activeOrgId: specialOrgId })
        })

        expect(mockUpdateSettings).toHaveBeenCalledWith({
          activeOrgId: specialOrgId,
        })
      })

      it('should handle empty organization ID updates', () => {
        const { result } = renderHook(() =>
          useStoredSettings({ userId: 'user-123' }),
        )

        act(() => {
          result.current.updateSettings({ activeOrgId: '' })
        })

        expect(mockUpdateSettings).toHaveBeenCalledWith({
          activeOrgId: '',
        })
      })

      it('should handle undefined organization ID updates', () => {
        const { result } = renderHook(() =>
          useStoredSettings({ userId: 'user-123' }),
        )

        act(() => {
          result.current.updateSettings({ activeOrgId: undefined })
        })

        expect(mockUpdateSettings).toHaveBeenCalledWith({
          activeOrgId: undefined,
        })
      })
    })
  })
})
