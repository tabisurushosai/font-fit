import { mergeSettings, type PremiumState, type Preset, type Settings } from '../core/settings';
import type { FontFitStorage } from './types';

type ChromeStorageArea = typeof chrome.storage.local;

export function createChromeStorageAdapter(area: ChromeStorageArea = chrome.storage.local): FontFitStorage {
  return {
    async loadSettings(): Promise<Settings> {
      const data = await area.get('settings');
      return mergeSettings(data['settings']);
    },

    async saveSettings(settings: Settings): Promise<void> {
      await area.set({ settings });
    },

    async loadPremiumState(): Promise<PremiumState> {
      const data = await area.get(['is_premium', 'trial_start_ts']);
      return {
        isPremium: !!data['is_premium'],
        trialStartTs: data['trial_start_ts']
      };
    },

    async saveTrialStartTs(trialStartTs: number): Promise<void> {
      await area.set({ trial_start_ts: trialStartTs });
    },

    async loadPresets(): Promise<Preset[]> {
      const data = await area.get('presets');
      return data['presets'] || [];
    },

    async savePresets(presets: Preset[]): Promise<void> {
      await area.set({ presets });
    },

    async loadAutoApplySites(): Promise<string[]> {
      const data = await area.get('autoApplySites');
      return data['autoApplySites'] || [];
    },

    async saveAutoApplySites(sites: string[]): Promise<void> {
      await area.set({ autoApplySites: sites });
    }
  };
}
