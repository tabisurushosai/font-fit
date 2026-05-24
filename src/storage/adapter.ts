import { mergeSettings, type PremiumState, type Preset, type Settings } from '../core/settings';
import { STORAGE_KEYS, type FontFitStorage, type FontFitStorageArea } from './types';

export function createStorageAdapter(area: FontFitStorageArea): FontFitStorage {
  return {
    async loadSettings(): Promise<Settings> {
      const data = await area.get(STORAGE_KEYS.settings);
      return mergeSettings(data[STORAGE_KEYS.settings]);
    },

    async saveSettings(settings: Settings): Promise<void> {
      await area.set({ [STORAGE_KEYS.settings]: settings });
    },

    async loadPremiumState(): Promise<PremiumState> {
      const data = await area.get([STORAGE_KEYS.isPremium, STORAGE_KEYS.trialStartTs]);
      const trialStartTs = data[STORAGE_KEYS.trialStartTs];

      if (trialStartTs === undefined) {
        return { isPremium: !!data[STORAGE_KEYS.isPremium] };
      }

      return { isPremium: !!data[STORAGE_KEYS.isPremium], trialStartTs };
    },

    async saveTrialStartTs(trialStartTs: number): Promise<void> {
      await area.set({ [STORAGE_KEYS.trialStartTs]: trialStartTs });
    },

    async loadPresets(): Promise<Preset[]> {
      const data = await area.get(STORAGE_KEYS.presets);
      return data[STORAGE_KEYS.presets] || [];
    },

    async savePresets(presets: Preset[]): Promise<void> {
      await area.set({ [STORAGE_KEYS.presets]: presets });
    },

    async loadAutoApplySites(): Promise<string[]> {
      const data = await area.get(STORAGE_KEYS.autoApplySites);
      return data[STORAGE_KEYS.autoApplySites] || [];
    },

    async saveAutoApplySites(sites: string[]): Promise<void> {
      await area.set({ [STORAGE_KEYS.autoApplySites]: sites });
    }
  };
}
