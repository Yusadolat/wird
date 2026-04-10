import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "wird_device_id";

export async function getDeviceId() {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);

  if (existing) {
    return existing;
  }

  const nextId = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, nextId);
  return nextId;
}
