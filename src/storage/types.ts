import type { PremiumState, Preset, Settings } from '../core/settings';

export const STORAGE_KEYS = {
  settings: 'settings',
  isPremium: 'is_premium',
  trialStartTs: 'trial_start_ts',
  presets: 'presets',
  autoApplySites: 'autoApplySites'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

export type StorageItems = Partial<{
  [STORAGE_KEYS.settings]: Partial<Settings>;
  [STORAGE_KEYS.isPremium]: boolean;
  [STORAGE_KEYS.trialStartTs]: number;
  [STORAGE_KEYS.presets]: Preset[];
  [STORAGE_KEYS.autoApplySites]: string[];
}>;

export interface FontFitStorageArea {
  get(keys: StorageKey | StorageKey[]): Promise<StorageItems>;
  set(items: StorageItems): Promise<void>;
}

export interface FontFitStorage {
  loadSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
  loadPremiumState(): Promise<PremiumState>;
  saveTrialStartTs(trialStartTs: number): Promise<void>;
  loadPresets(): Promise<Preset[]>;
  savePresets(presets: Preset[]): Promise<void>;
  loadAutoApplySites(): Promise<string[]>;
  saveAutoApplySites(sites: string[]): Promise<void>;
}
