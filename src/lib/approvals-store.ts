import fs from 'node:fs/promises';
import path from 'node:path';
import type { ApprovalRecord, ApprovalKey } from '@/domain/reviews/types';
import * as process from 'node:process';
import reviewKey from '@/lib/review-key';

type Store = {
  loadAll(): Promise<ApprovalRecord[]>;
  upsert(rec: ApprovalRecord): Promise<void>;
  listByListing(listingId: number): Promise<ApprovalRecord[]>;
  isApproved(key: ApprovalKey): Promise<boolean>;
};

// Inmemory (always available)
const mem: { map: Map<string, ApprovalRecord> } = { map: new Map() };
const keyOf = (k: ApprovalKey) => reviewKey(k.listingId, k.reviewId);

// Vercel KV
async function tryKV() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  return {
    async loadAll(): Promise<ApprovalRecord[]> {
      const r = await fetch(`${url}/hgetall/approvals`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!r.ok) return [];

      // KV returns { [key: string]: stringifiedApproval }
      const obj = (await r.json()) as Record<string, string> | null;

      if (!obj) return [];
      return Object.values(obj).map((s) => JSON.parse(s) as ApprovalRecord);
    },
    async upsert(rec: ApprovalRecord) {
      await fetch(`${url}/hset/approvals/${keyOf(rec)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(JSON.stringify(rec)),
      });
    },
    async listByListing(listingId: number) {
      const all = await this.loadAll();
      return all.filter((a) => a.listingId === listingId);
    },
    async isApproved(k: ApprovalKey) {
      const all = await this.loadAll();
      return all.some(
        (a) => a.listingId === k.listingId && a.reviewId === k.reviewId && a.approved,
      );
    },
  } satisfies Store;
}

// Local file store (dev)
const filePath = path.join(process.cwd(), '.data', 'approvals.json');

async function ensureFile() {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '[]', 'utf8');
  }
}

const fileStore: Store = {
  async loadAll() {
    await ensureFile();
    const raw = await fs.readFile(filePath, 'utf8');
    const arr = JSON.parse(raw) as ApprovalRecord[];
    return arr;
  },
  async upsert(rec) {
    const arr = await this.loadAll();
    const idx = arr.findIndex((x) => x.listingId === rec.listingId && x.reviewId === rec.reviewId);
    if (idx >= 0) arr[idx] = rec;
    else arr.push(rec);
    await fs.writeFile(filePath, JSON.stringify(arr, null, 2), 'utf8');
  },
  async listByListing(listingId) {
    const all = await this.loadAll();
    return all.filter((a) => a.listingId === listingId);
  },
  async isApproved(k) {
    const all = await this.loadAll();
    return all.some((a) => a.listingId === k.listingId && a.reviewId === k.reviewId && a.approved);
  },
};

// Memory fallback
const memoryStore: Store = {
  async loadAll() {
    return Array.from(mem.map.values());
  },
  async upsert(rec) {
    mem.map.set(keyOf(rec), rec);
  },
  async listByListing(listingId) {
    return Array.from(mem.map.values()).filter((a) => a.listingId === listingId);
  },
  async isApproved(k) {
    const v = mem.map.get(keyOf(k));
    return v?.approved === true;
  },
};

// export a preferred store
let storePromise: Promise<Store> | null = null;

export async function approvalsStore(): Promise<Store> {
  if (storePromise) return storePromise;
  storePromise = (async () => {
    // prefer KV when configured (production), else local file (dev), else memory
    const kv = await tryKV();
    if (kv) return kv;
    // local dev under `npm run dev` will use file store so your selections survive restarts
    return process.env.NODE_ENV === 'development' ? fileStore : memoryStore;
  })();
  return storePromise;
}
