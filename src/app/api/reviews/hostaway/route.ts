import {
  fetchHostawayNormalized,
  filterReviews,
  sortReviews,
  type SortKey,
} from '@/domain/reviews';
import { paginate } from '@/lib/paginate';
import type { ReviewType } from '@/domain/reviews';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = {
      minRating: numU(searchParams.get('minRating')),
      channel: strU(searchParams.get('channel')),
      type: typeU(searchParams.get('type')),
      listingName: strU(searchParams.get('listingName')),
      search: strU(searchParams.get('search')),
      from: strU(searchParams.get('from')),
      to: strU(searchParams.get('to')),
    };
    const sort = (searchParams.get('sort') as SortKey) || 'newest';
    const page = numD(searchParams.get('page'), 1);
    const perPage = numD(searchParams.get('perPage'), 20);

    const all = await fetchHostawayNormalized();
    const filtered = filterReviews(all, q);
    const sorted = sortReviews(filtered, sort);
    const { slice, total, page: p, perPage: pp } = paginate(sorted, page, perPage);

    return Response.json({
      status: 'success',
      count: filtered.length, // total after filters (before pagination)
      total, // total filtered items (for convenience)
      page: p,
      perPage: pp,
      result: slice,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return Response.json({ status: 'error', message }, { status: 500 });
  }
}

/** helpers */
function numU(v: string | null) {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function numD(v: string | null, d: number) {
  if (v == null) return d; // null/absent -> default
  const s = v.trim();
  if (s === '') return d;
  const n = Number(s);
  return Number.isFinite(n) ? n : d;
}
function strU(v: string | null) {
  return v == null || v === '' ? undefined : v;
}
function typeU(v: string | null): ReviewType | undefined {
  if (!v) return undefined;
  if (v === 'guest' || v === 'guest-to-host' || v === 'host-to-guest') return v;
  return undefined;
}
