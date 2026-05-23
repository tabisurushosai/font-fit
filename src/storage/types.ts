import type { PremiumState, Preset, Settings } from '../core/settings';

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
