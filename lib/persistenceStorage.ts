import { config } from "./config";
import { captureException } from "./sentry";

type AsyncLikeStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memoryStore = new Map<string, string>();

const memoryStorage: AsyncLikeStorage = {
  async getItem(key) {
    return memoryStore.has(key) ? (memoryStore.get(key) as string) : null;
  },
  async setItem(key, value) {
    memoryStore.set(key, value);
  },
  async removeItem(key) {
    memoryStore.delete(key);
  },
};

let resolvedStorage: AsyncLikeStorage | null = null;
let didWarn = false;

export function getPersistenceStorage(): AsyncLikeStorage {
  if (resolvedStorage) {
    return resolvedStorage;
  }

  try {
    const asyncStorageModule = require("@react-native-async-storage/async-storage");
    const candidate = asyncStorageModule?.default ?? asyncStorageModule;

    if (
      candidate &&
      typeof candidate.getItem === "function" &&
      typeof candidate.setItem === "function" &&
      typeof candidate.removeItem === "function"
    ) {
      resolvedStorage = candidate as AsyncLikeStorage;
      return resolvedStorage;
    }
  } catch (error) {
    if (config.sentryCaptureHandled) {
      captureException(error, { tags: { area: "persistence", action: "load_async_storage" } });
    }

    if (__DEV__ && !didWarn) {
      didWarn = true;
      console.log(
        "[Persistence] AsyncStorage unavailable, falling back to in-memory storage.",
        error,
      );
    }
  }

  resolvedStorage = memoryStorage;
  return resolvedStorage;
}
