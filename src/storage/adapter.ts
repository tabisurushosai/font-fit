import { mergeSettings, type PremiumState, type Preset, type Settings } from '../core/settings';
import {
  STORAGE_KEYS,
  type FontFitStorage,
  type FontFitStorageKey,
  type FontFitStoragePort,
  type FontFitStorageValueMap
} from './types';

async function loadStoredValue<Key extends FontFitStorageKey>(
  port: FontFitStoragePort,
  key: Key
): Promise<FontFitStorageValueMap[Key] | undefined> {
  const data = await port.get(key);
  return data[key];
}

export function createStorageAdapter(port: FontFitStoragePort): FontFitStorage {
  return {
    async loadSettings(): Promise<Settings> {
      return mergeSettings(await loadStoredValue(port, STORAGE_KEYS.settings));
    },

    async saveSettings(settings: Settings): Promise<void> {
      await port.set({ [STORAGE_KEYS.settings]: settings });
    },

    async loadPremiumState(): Promise<PremiumState> {
      const data = await port.get([STORAGE_KEYS.isPremium, STORAGE_KEYS.trialStartTs]);
      const trialStartTs = data[STORAGE_KEYS.trialStartTs];

      if (trialStartTs === undefined) {
        return { isPremium: !!data[STORAGE_KEYS.isPremium] };
      }

      return { isPremium: !!data[STORAGE_KEYS.isPremium], trialStartTs };
    },

    async saveTrialStartTs(trialStartTs: number): Promise<void> {
      await port.set({ [STORAGE_KEYS.trialStartTs]: trialStartTs });
    },

    async loadPresets(): Promise<Preset[]> {
      return (await loadStoredValue(port, STORAGE_KEYS.presets)) || [];
    },

    async savePresets(presets: Preset[]): Promise<void> {
      await port.set({ [STORAGE_KEYS.presets]: presets });
    },

    async loadAutoApplySites(): Promise<string[]> {
      return (await loadStoredValue(port, STORAGE_KEYS.autoApplySites)) || [];
    },

    async saveAutoApplySites(sites: string[]): Promise<void> {
      await port.set({ [STORAGE_KEYS.autoApplySites]: sites });
    }
  };
}
