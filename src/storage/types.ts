import type { PremiumState, Preset, Settings } from '../core/settings';

/**
 * Stable storage keys used by the shipped Chrome extension.
 *
 * Keep these values unchanged so mobile ports can read existing exported or
 * migrated user data without a conversion step.
 */
export const STORAGE_KEYS = {
  settings: 'settings',
  isPremium: 'is_premium',
  trialStartTs: 'trial_start_ts',
  presets: 'presets',
  autoApplySites: 'autoApplySites'
} as const;

export type FontFitStorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
export type FontFitStorageKeyQuery = FontFitStorageKey | readonly FontFitStorageKey[];

export type FontFitStorageValueMap = {
  [STORAGE_KEYS.settings]: Partial<Settings>;
  [STORAGE_KEYS.isPremium]: boolean;
  [STORAGE_KEYS.trialStartTs]: number;
  [STORAGE_KEYS.presets]: Preset[];
  [STORAGE_KEYS.autoApplySites]: string[];
};

export type FontFitStorageItems = Partial<FontFitStorageValueMap>;

/**
 * Minimal platform storage contract used by the shared adapter.
 *
 * The Chrome-specific adapter passes its local storage area here;
 * iOS/Android ports can wrap SharedPreferences, Keychain, SQLite, or another
 * local store with the same get/set shape.
 */
export interface FontFitStoragePort {
  get(keys: FontFitStorageKeyQuery): Promise<FontFitStorageItems>;
  set(items: FontFitStorageItems): Promise<void>;
}

/**
 * High-level storage API used by UI/application code.
 *
 * Consumers should prefer this interface instead of reading raw keys outside
 * the adapter layer.
 */
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

/** @deprecated Use FontFitStorageKey. */
export type StorageKey = FontFitStorageKey;

/** @deprecated Use FontFitStorageKeyQuery. */
export type StorageKeyQuery = FontFitStorageKeyQuery;

/** @deprecated Use FontFitStorageItems. */
export type StorageItems = FontFitStorageItems;

/** @deprecated Use FontFitStoragePort. */
export type FontFitStorageArea = FontFitStoragePort;
