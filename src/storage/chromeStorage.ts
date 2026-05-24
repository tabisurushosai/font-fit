import { createStorageAdapter } from './adapter';
import type { FontFitStorage, FontFitStorageArea } from './types';

export function createChromeStorageAdapter(area: FontFitStorageArea = chrome.storage.local): FontFitStorage {
  return createStorageAdapter(area);
}
