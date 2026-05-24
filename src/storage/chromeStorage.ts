import { createStorageAdapter } from './adapter';
import type { FontFitStorage, FontFitStoragePort } from './types';

export function createChromeStorageAdapter(port: FontFitStoragePort = chrome.storage.local): FontFitStorage {
  return createStorageAdapter(port);
}
