import { describe, expect, it } from 'vitest';

import { defaultSettings } from '../core/settings';
import { createStorageAdapter } from './adapter';
import { createChromeStorageAdapter } from './chromeStorage';
import { STORAGE_KEYS, type FontFitStorageArea, type StorageItems, type StorageKeyQuery } from './types';

function createMemoryStorageArea(initialItems: StorageItems = {}): FontFitStorageArea & { snapshot(): StorageItems } {
  let items: StorageItems = { ...initialItems };

  return {
    async get(keys: StorageKeyQuery): Promise<StorageItems> {
      if (Array.isArray(keys)) {
        return Object.fromEntries(keys.map((key) => [key, items[key]])) as StorageItems;
      }

      return { [keys]: items[keys] };
    },

    async set(nextItems: StorageItems): Promise<void> {
      items = { ...items, ...nextItems };
    },

    snapshot(): StorageItems {
      return { ...items };
    }
  };
}

describe('createStorageAdapter', () => {
  it('reads and writes settings through the portable storage area interface', async () => {
    const area = createMemoryStorageArea({
      [STORAGE_KEYS.settings]: { fontSize: 2 }
    });
    const storage = createStorageAdapter(area);

    expect(await storage.loadSettings()).toEqual({
      ...defaultSettings,
      fontSize: 2
    });

    await storage.saveSettings(defaultSettings);
    expect(area.snapshot()[STORAGE_KEYS.settings]).toEqual(defaultSettings);
  });

  it('keeps existing premium storage keys unchanged', async () => {
    const area = createMemoryStorageArea({
      [STORAGE_KEYS.isPremium]: true,
      [STORAGE_KEYS.trialStartTs]: 123
    });
    const storage = createStorageAdapter(area);

    expect(await storage.loadPremiumState()).toEqual({
      isPremium: true,
      trialStartTs: 123
    });

    await storage.saveTrialStartTs(456);
    expect(area.snapshot()[STORAGE_KEYS.trialStartTs]).toBe(456);
  });

  it('keeps existing preset and auto-apply storage keys unchanged', async () => {
    const presets = [{ name: 'Readable', settings: defaultSettings }];
    const area = createMemoryStorageArea({
      [STORAGE_KEYS.presets]: presets,
      [STORAGE_KEYS.autoApplySites]: ['example.com']
    });
    const storage = createStorageAdapter(area);

    expect(await storage.loadPresets()).toEqual(presets);
    expect(await storage.loadAutoApplySites()).toEqual(['example.com']);

    await storage.savePresets([]);
    await storage.saveAutoApplySites(['docs.example']);

    expect(area.snapshot()[STORAGE_KEYS.presets]).toEqual([]);
    expect(area.snapshot()[STORAGE_KEYS.autoApplySites]).toEqual(['docs.example']);
  });
});

describe('createChromeStorageAdapter', () => {
  it('uses the same portable storage area interface for an injected chrome area', async () => {
    const area = createMemoryStorageArea({
      [STORAGE_KEYS.settings]: { lineHeight: 2 }
    });
    const storage = createChromeStorageAdapter(area);

    expect(await storage.loadSettings()).toEqual({
      ...defaultSettings,
      lineHeight: 2
    });
  });
});
