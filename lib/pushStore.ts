import { promises as fs } from "node:fs";
import path from "node:path";
import type { PushStoreShape, PushSubscriptionRecord } from "./pushTypes";

const DEFAULT_STORE_PATH = "/tmp/tasbih-push-store.json";
const storePath = process.env.PUSH_STORE_PATH ?? DEFAULT_STORE_PATH;

let inMemoryStore: PushStoreShape = { subscribers: [] };

async function readStore(): Promise<PushStoreShape> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as PushStoreShape;
    if (!parsed || !Array.isArray(parsed.subscribers)) return { subscribers: [] };
    inMemoryStore = parsed;
    return parsed;
  } catch {
    return inMemoryStore;
  }
}

async function writeStore(store: PushStoreShape): Promise<void> {
  inMemoryStore = store;
  try {
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Fallback to in-memory mode only when filesystem is unavailable.
  }
}

export async function listSubscribers(): Promise<PushSubscriptionRecord[]> {
  const store = await readStore();
  return store.subscribers;
}

export async function upsertSubscriber(record: PushSubscriptionRecord): Promise<void> {
  const store = await readStore();
  const idx = store.subscribers.findIndex((s) => s.endpoint === record.endpoint);
  if (idx === -1) {
    store.subscribers.push(record);
  } else {
    store.subscribers[idx] = { ...store.subscribers[idx], ...record };
  }
  await writeStore(store);
}

export async function removeSubscriber(endpoint: string): Promise<void> {
  const store = await readStore();
  store.subscribers = store.subscribers.filter((s) => s.endpoint !== endpoint);
  await writeStore(store);
}

export async function markSubscriberSent(endpoint: string, slot: string): Promise<void> {
  const store = await readStore();
  const idx = store.subscribers.findIndex((s) => s.endpoint === endpoint);
  if (idx === -1) return;
  store.subscribers[idx] = {
    ...store.subscribers[idx],
    lastSentSlot: slot,
    updatedAt: new Date().toISOString(),
  };
  await writeStore(store);
}
