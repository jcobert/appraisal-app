import { useCallback } from 'react'
import { useLocalStorage } from 'usehooks-ts'

import { siteConfig } from '@/configuration/site'

export const ACTIVE_ORG_COOKIE_NAME = 'active_org_id'
export const ACTIVE_ORG_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/**
 * Generate a user-specific cookie name for the active organization ID.
 */
export const getActiveOrgCookieName = (userId: string) =>
  `${ACTIVE_ORG_COOKIE_NAME}_${userId}`

export type StoredSettings = {
  /** The currently selected organization. */
  activeOrgId?: string
}

type UseStoredSettingsProps = {
  userId: string | undefined
  initialSettings?: StoredSettings
}

const defaultSettings = {
  activeOrgId: '',
} satisfies StoredSettings

export const useStoredSettings = ({
  userId,
  initialSettings,
}: UseStoredSettingsProps) => {
  const storedSettingsKey = userId
    ? `${siteConfig.title?.toLowerCase()?.trim()?.replace(' ', '-')}-prefs-${userId}`
    : `${siteConfig.title?.toLowerCase()?.trim()?.replace(' ', '-')}-guest-${Date.now()}` // Temp/fallback key

  const [settings, _updateSettings, clearSettings] =
    useLocalStorage<StoredSettings>(storedSettingsKey, {
      ...defaultSettings,
      ...initialSettings,
    })

  const updateSettings = useCallback(
    (newSettings: Partial<StoredSettings>) => {
      if (userId) {
        const updated = { ...settings, ...newSettings }
        _updateSettings(updated)

        // Also store activeOrgId in cookies for server access
        if ('activeOrgId' in newSettings && typeof window !== 'undefined') {
          const value = newSettings.activeOrgId || ''
          const cookieName = getActiveOrgCookieName(userId)
          document.cookie = `${cookieName}=${value}; path=/; max-age=${ACTIVE_ORG_COOKIE_MAX_AGE}`
        }
      }
    },
    [userId, settings, _updateSettings],
  )

  return {
    settings: userId ? settings : defaultSettings,
    updateSettings,
    clearSettings: userId ? clearSettings : () => {},
  }
}
