// Offline queue for recycling entries (Phase 7.1).
// Scans confirmed while offline are stored in IndexedDB via idb-keyval and
// replayed through AuthContext.addRecyclingEntry once connectivity returns.
import { createStore, get, set } from 'idb-keyval';

const DB_NAME = 'ecoscan-offline';
const STORE_NAME = 'offline-queue';
const QUEUE_KEY = 'queued-entries';

// Fired on `window` after a flush synced one or more entries (detail: { synced }).
export const QUEUE_SYNCED_EVENT = 'ecoscan:offline-queue-synced';

// Mirrors the parameters of AuthContext.addRecyclingEntry, plus bookkeeping
// fields. `userId` lets the replay skip entries queued under a different
// account on this shared device.
export interface QueuedEntry {
  id: string;
  userId: string;
  item: string;
  material: string;
  location?: {
    latitude: number | null;
    longitude: number | null;
    address?: string;
    locationName?: string;
  };
  queuedAt: number; // epoch ms — used for oldest-first ordering
}

// Dedicated named store so queue data never mixes with other idb-keyval users.
const queueStore = createStore(DB_NAME, STORE_NAME);

// Serialize every read-modify-write cycle on the single queue key so concurrent
// callers (rapid scans, a flush running while the user scans again) can't
// clobber each other's writes.
let writeChain: Promise<unknown> = Promise.resolve();
const withQueueLock = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = writeChain.then(fn, fn);
  writeChain = run.catch(() => undefined);
  return run;
};

const readQueue = async (): Promise<QueuedEntry[]> => {
  const entries = await get<QueuedEntry[]>(QUEUE_KEY, queueStore);
  return Array.isArray(entries) ? entries : [];
};

export async function enqueue(entry: QueuedEntry): Promise<void> {
  await withQueueLock(async () => {
    const entries = await readQueue();
    // Idempotency guard: the same entry can never be queued twice.
    if (entries.some((e) => e.id === entry.id)) return;
    await set(QUEUE_KEY, [...entries, entry], queueStore);
  });
}

export async function getQueued(): Promise<QueuedEntry[]> {
  const entries = await readQueue();
  return [...entries].sort((a, b) => a.queuedAt - b.queuedAt); // oldest first
}

export async function removeQueued(id: string): Promise<void> {
  await withQueueLock(async () => {
    const entries = await readQueue();
    await set(QUEUE_KEY, entries.filter((e) => e.id !== id), queueStore);
  });
}

export async function queuedCount(): Promise<number> {
  return (await readQueue()).length;
}

// Serialize flushes so two overlapping sync passes can never replay the same
// entry twice. A flush waiting on a previous one simply re-reads the
// (possibly already emptied) queue.
let flushChain: Promise<unknown> = Promise.resolve(0);

export function flushQueue(
  replay: (entry: QueuedEntry) => Promise<boolean>
): Promise<number> {
  const run = flushChain.then(
    () => doFlush(replay),
    () => doFlush(replay)
  );
  flushChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function doFlush(
  replay: (entry: QueuedEntry) => Promise<boolean>
): Promise<number> {
  const entries = await getQueued(); // oldest first
  let synced = 0;

  for (const entry of entries) {
    try {
      if (await replay(entry)) {
        // Remove individually (not by rewriting the whole array) so entries
        // enqueued while this flush is running are preserved.
        await removeQueued(entry.id);
        synced += 1;
      }
      // replay returning false keeps the entry queued for the next attempt.
    } catch {
      // Replay threw unexpectedly — treat as failure and keep the entry.
    }
  }

  if (synced > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(QUEUE_SYNCED_EVENT, { detail: { synced } })
    );
  }
  return synced;
}
