import { useLocalStorage } from 'usehooks-ts'

import { siteConfig } from '@/configuration/site'

export type StoredSettings = {
  /** The currently selected organization. */
  activeOrgId?: string
}

const storedSettingsKey =
  `${siteConfig.title?.toLowerCase()?.trim()?.replace(' ', '-')}-prefs` as const

const defaultSettings = {
  activeOrgId: '',
} satisfies StoredSettings

type UseStoredSettingsProps = {
  initialSettings?: StoredSettings
}

export const useStoredSettings = ({
  initialSettings,
}: UseStoredSettingsProps = {}) => {
  const [settings, _updateSettings, clearSettings] =
    useLocalStorage<StoredSettings>(
      storedSettingsKey,
      initialSettings ?? defaultSettings,
    )

  const updateSettings = (newSettings: Partial<StoredSettings>) => {
    _updateSettings({ ...settings, ...newSettings })
  }

  return { settings, updateSettings, clearSettings }
}
