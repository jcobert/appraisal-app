import { useLocalStorage } from 'usehooks-ts'

import { siteConfig } from '@/configuration/site'

export type StoredSettings = {
  activeOrg?: string
}

const storedSettingsKey =
  `${siteConfig.title?.toLowerCase()?.trim()?.replace(' ', '-')}-prefs` as const

const initialSettings = { activeOrg: '' } satisfies StoredSettings

export const useStoredSettings = () => {
  const [settings, updateSettings, clearSettings] =
    useLocalStorage<StoredSettings>(storedSettingsKey, initialSettings)

  return { settings, updateSettings, clearSettings }
}
