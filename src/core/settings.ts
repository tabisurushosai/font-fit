export const FONT_STACKS = {
  UD_GOTHIC: '"BIZ UDPGothic", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif',
  SANS_SERIF: 'sans-serif',
  SERIF: 'serif'
} as const;

export interface Settings {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  backgroundColor: string;
  maxWidth: string;
}

export type Preset = {
  name: string;
  settings: Settings;
};

export type PremiumStatus = {
  isPremium: boolean;
  isTrialing: boolean;
  daysLeft: number;
  trialEndsAt: number;
  trialExpired: boolean;
};

export type PremiumState = {
  isPremium: boolean;
  trialStartTs?: number;
};

export const defaultSettings: Settings = {
  fontFamily: FONT_STACKS.UD_GOTHIC,
  fontSize: 1.2,
  lineHeight: 1.8,
  letterSpacing: 0.05,
  backgroundColor: '#ffffff',
  maxWidth: '760px'
};

export const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function mergeSettings(settings?: Partial<Settings>): Settings {
  return { ...defaultSettings, ...settings };
}

export function getPremiumStatus(state: PremiumState, now = Date.now()): PremiumStatus {
  const trialStartTs = state.trialStartTs ?? now;
  const trialExpiresAt = trialStartTs + TRIAL_DURATION_MS;
  const isTrialing = now < trialExpiresAt;
  const isPremium = state.isPremium || isTrialing;
  const daysLeft = Math.ceil((trialExpiresAt - now) / (24 * 60 * 60 * 1000));

  return {
    isPremium,
    isTrialing: isTrialing && !state.isPremium,
    daysLeft: isTrialing ? daysLeft : 0,
    trialEndsAt: trialExpiresAt,
    trialExpired: !isTrialing && !state.isPremium
  };
}
