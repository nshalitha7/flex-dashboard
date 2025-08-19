import { z } from 'zod';
import type { FilterQuery, NormalizedReview, ReviewType, SortKey } from './types';

// Hostaway raw schemas
export const HostawayReviewRawSchema = z.object({
  id: z.string().or(z.number()).optional(),
  type: z.enum(['host-to-guest', 'guest-to-host']).optional(),
  status: z.enum(['published', 'pending', 'hidden', 'archived']).optional(),
  rating: z.number().nullable().optional(),
  publicReview: z.string().optional(),
  reviewCategory: z
    .array(z.object({ category: z.string(), rating: z.number().nullable() }))
    .optional(),
  submittedAt: z.string().optional(), // e.g. "2020-08-21 22:45:14"
  guestName: z.string().optional(),
  listingName: z.string().optional(),
  listingId: z.string().or(z.number()).optional(),
  channel: z.string().optional(),
});

export const HostawayResponseSchema = z.object({
  status: z.string().optional(),
  result: z.array(HostawayReviewRawSchema).optional(),
});

export type HostawayReviewRaw = z.infer<typeof HostawayReviewRawSchema>;
export type HostawayResponse = z.infer<typeof HostawayResponseSchema>;

// Normalization
export function normalizeHostaway(json: unknown): NormalizedReview[] {
  const parsed = HostawayResponseSchema.safeParse(json);
  const rows: HostawayReviewRaw[] = parsed.success && parsed.data.result ? parsed.data.result : [];

  return rows.map(
    (r): NormalizedReview => ({
      id: String(r.id ?? rnd()),
      source: 'hostaway',
      type: ((r.type as ReviewType | undefined) ?? 'guest') as ReviewType,
      status: r.status ?? 'published',
      rating: isNum(r.rating) ? r.rating : null,
      categories: Array.isArray(r.reviewCategory) ? r.reviewCategory : [],
      submittedAt: toIso(r.submittedAt),
      authorName: r.guestName ?? null,
      listingId: r.listingId != null ? String(r.listingId) : null,
      listingName: r.listingName ?? null,
      channel: String(r.channel ?? 'hostaway'),
      content: r.publicReview ?? '',
    }),
  );
}

// Filtering/Sorting/Bucketing
export function filterReviews(list: NormalizedReview[], q: FilterQuery = {}) {
  const fromTs = q.from ? new Date(q.from).getTime() : null;
  const toTs = q.to ? new Date(q.to).getTime() : null;
  const channel = q.channel?.toLowerCase();
  const type = q.type;
  const name = q.listingName?.toLowerCase();
  const search = q.search?.toLowerCase();
  const min = isNum(q.minRating) ? q.minRating : null;

  return list.filter((r) => {
    if (min != null && (r.rating ?? -1) < min) return false;
    if (channel && r.channel.toLowerCase() !== channel) return false;
    if (type && r.type !== type) return false;
    if (name && !(r.listingName ?? '').toLowerCase().includes(name)) return false;

    if (search) {
      const blob = `${r.content} ${r.authorName ?? ''} ${r.listingName ?? ''}`.toLowerCase();
      if (!blob.includes(search)) return false;
    }

    const t = new Date(r.submittedAt).getTime();
    if (fromTs && t < fromTs) return false;
    if (toTs && t > toTs) return false;

    return true;
  });
}

export function sortReviews(list: NormalizedReview[], sort: SortKey = 'newest') {
  const arr = [...list];
  switch (sort) {
    case 'oldest':
      return arr.sort((a, b) => +new Date(a.submittedAt) - +new Date(b.submittedAt));
    case 'rating':
      return arr.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    case 'newest':
    default:
      return arr.sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));
  }
}

// for trend chart
export function bucketByMonth(list: NormalizedReview[]) {
  const map = new Map<string, { sum: number; n: number; count: number }>();
  for (const r of list) {
    const d = new Date(r.submittedAt);
    if (Number.isNaN(+d)) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entry = map.get(key) ?? { sum: 0, n: 0, count: 0 };
    if (typeof r.rating === 'number') {
      entry.sum += r.rating;
      entry.n += 1;
    }
    entry.count += 1;
    map.set(key, entry);
  }
  return [...map.entries()]
    .map(([month, { sum, n, count }]) => ({ month, avg: n ? sum / n : null, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// Utils
function isNum(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}

function toIso(d: unknown): string {
  if (typeof d === 'string') {
    const isoLike = d.replace(' ', 'T');
    const dt = new Date(isoLike);
    return Number.isNaN(+dt) ? new Date().toISOString() : dt.toISOString();
  }
  if (d instanceof Date) return d.toISOString();
  return new Date().toISOString();
}

function rnd() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
