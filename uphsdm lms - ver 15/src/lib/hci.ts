export type HciSettings = {
  darkMode: boolean
  highContrast: boolean
  reduceMotion: boolean
  largeText: boolean
  dyslexiaFont: boolean
}

export const DEFAULT_HCI_SETTINGS: HciSettings = {
  darkMode: false,
  highContrast: false,
  reduceMotion: false,
  largeText: false,
  dyslexiaFont: false,
}

const CLASS_MAP: Record<keyof HciSettings, string> = {
  darkMode: 'hci-dark',
  highContrast: 'hci-contrast',
  reduceMotion: 'hci-reduce-motion',
  largeText: 'hci-large-text',
  dyslexiaFont: 'hci-dyslexic',
}

export function applyHciSettings(settings: Partial<HciSettings>) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  ;(Object.keys(CLASS_MAP) as (keyof HciSettings)[]).forEach((key) => {
    const cls = CLASS_MAP[key]
    if (settings[key]) root.classList.add(cls)
    else root.classList.remove(cls)
  })
}

export function loadHciSettings(): HciSettings {
  if (typeof window === 'undefined') return DEFAULT_HCI_SETTINGS
  try {
    const raw = localStorage.getItem('lms_settings')
    if (!raw) return DEFAULT_HCI_SETTINGS
    const parsed = JSON.parse(raw) as Partial<HciSettings>
    return { ...DEFAULT_HCI_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_HCI_SETTINGS
  }
}
