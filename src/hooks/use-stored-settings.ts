import { useLocalStorage } from 'usehooks-ts'

import { siteConfig } from '@/configuration/site'

export type StoredSettings = {
  activeOrg?: string
}

const storedSettingsKey =
  `${siteConfig.title?.toLowerCase()?.trim()?.replace(' ', '-')}-prefs` as const

const defaultSettings = { activeOrg: '' } satisfies StoredSettings

type UseStoredSettingsProps = {
  initialSettings?: StoredSettings
}

export const useStoredSettings = ({
  initialSettings,
}: UseStoredSettingsProps = {}) => {
  const [settings, updateSettings, clearSettings] =
    useLocalStorage<StoredSettings>(
      storedSettingsKey,
      initialSettings ?? defaultSettings,
    )

  return { settings, updateSettings, clearSettings }
}
