import { describe, expect, it } from 'vitest';

import { defaultSettings, shouldShowInitialOnboardingGuide } from './settings';

describe('shouldShowInitialOnboardingGuide', () => {
  it('shows the guide only for a fresh default state', () => {
    expect(shouldShowInitialOnboardingGuide(defaultSettings, [], [])).toBe(true);
  });

  it('hides the guide after settings or saved state exist', () => {
    expect(shouldShowInitialOnboardingGuide({ ...defaultSettings, fontSize: 1.4 }, [], [])).toBe(false);
    expect(shouldShowInitialOnboardingGuide(defaultSettings, [{ name: 'Readable', settings: defaultSettings }], [])).toBe(false);
    expect(shouldShowInitialOnboardingGuide(defaultSettings, [], ['example.com'])).toBe(false);
  });
});
