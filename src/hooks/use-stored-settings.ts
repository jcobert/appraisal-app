import { useCallback } from 'react'
import { useLocalStorage } from 'usehooks-ts'

import { siteConfig } from '@/configuration/site'

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
    useLocalStorage<StoredSettings>(
      storedSettingsKey,
      initialSettings ?? defaultSettings,
    )

  const updateSettings = useCallback(
    (newSettings: Partial<StoredSettings>) => {
      if (userId) {
        _updateSettings({ ...settings, ...newSettings })
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
